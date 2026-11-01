import { DAY, simTime, type Counters, type RandomStreams, type SimTime } from "@rex/kernel";
import { mintId, type OrgId, type Parameter, type PersonId, type TieId, type TieKind } from "./types.ts";
import type { ExchangeRecord } from "./acceptance.ts";

export const NETWORK_PROCESS = "society.network.communication";

/** All calibration is caller supplied, to research (DESIGN §1.1).
 * lambda0: contacts/day per exposure (Mossong et al. 2008).
 * alpha: episode reinforcement (Granovetter 1973; approximation).
 * T: half-life in days (Burt 2000; Roberts & Dunbar 2015).
 */
export interface KindParameters {
  readonly kind: TieKind;
  readonly lambda0: Parameter;
  readonly alpha: Parameter;
  readonly T: Parameter;
}
export interface NetworkParameters {
  readonly kinds: readonly KindParameters[];
  /** Removal threshold; to research (DESIGN §1.1). */
  readonly w_min: Parameter;
  /** Contact duration in hours; to research (DESIGN §1.1 rate limiter). */
  readonly d: Parameter;
}
export interface NetworkPerson {
  readonly id: PersonId;
  /** Available hours/day, supplied by the host's time-use/capacity port. */
  readonly availableHours: number;
}
export interface Pair {
  readonly i: PersonId;
  readonly j: PersonId;
}
export interface SharedHours extends Pair {
  readonly kind: TieKind;
  readonly hours: number;
}
export interface MeetingAttendance {
  readonly org: OrgId;
  readonly attendees: readonly PersonId[];
  readonly attendance: number;
}
export interface ExposureInputs {
  /** Directed pair rows from Settlement; null explicitly flags an absent port. */
  readonly sharedHours: readonly SharedHours[] | null;
  /** Undirected relation facts: each produces two directed exposures of 1. */
  readonly households: readonly Pair[];
  readonly kin: readonly Pair[];
  /** Actual co-attendance, not just names on an organisation's membership roll. */
  readonly meetings: readonly MeetingAttendance[];
}
export interface NetworkTie extends Pair {
  readonly id: TieId;
  readonly kinds: readonly TieKind[];
  readonly w: number;
  /** Scaled proposal rate, contacts/day; hard capacity can suppress proposals. */
  readonly lambda: number;
  readonly t_last: SimTime | null;
}
export interface ContactOpportunity<Payload> extends Pair {
  readonly tieId: TieId;
  readonly t: SimTime;
  readonly payloads: readonly Payload[];
}
interface Exposure { structural: number; sought: number }
interface ExposureRow extends Pair { kind: TieKind; x: number }
interface TieState extends Pair {
  id: TieId;
  exposures: Map<TieKind, Exposure>;
  w: number;
  t_last: SimTime | null;
  decayedAt: SimTime;
  halfLife?: number;
  lambda: number;
  next: number;
  /** Remaining integrated hazard survives zero rates and rate changes. */
  hazard?: number;
  scheduledAt: number;
}
type CalibratedKind = { lambda0: number; alpha: number; T: number };

function number(value: unknown, name: string, minimum: number, strict = false): number {
  if (typeof value !== "number" || !Number.isFinite(value)
    || (strict ? value <= minimum : value < minimum)) {
    throw new Error(`${name} requires a finite number ${strict ? ">" : ">="} ${minimum}; missing parameters have no default`);
  }
  return value;
}
// Kernel ids have a padded numeric suffix; preserve mint order beyond 9999 too.
const compare = (a: string, b: string): number => {
  const left = /^(.*\.)(\d+)$/.exec(a), right = /^(.*\.)(\d+)$/.exec(b);
  if (left && right && left[1] === right[1]) return Number(left[2]) - Number(right[2]);
  return a < b ? -1 : a > b ? 1 : 0;
};

/** DESIGN §1.1: one directed tie store, shared by every caller/content type.
 * Times are Kernel integer milliseconds; rates and half-lives use days.
 * Call nextOpportunity to interleave acts with events, or advanceTo to batch.
 * Mutations occur at now (never silently skip pending contact opportunities).
 */
export class CommunicationNetwork {
  #ties = new Map<TieId, TieState>();
  #people = new Map<PersonId, number>();
  #parameters = new Map<TieKind, CalibratedKind>();
  #streams: RandomStreams;
  #counters: Counters;
  #wMin: number;
  #duration: number;
  #now: SimTime;
  #budgetDay: number;
  #offered = new Map<PersonId, number>();
  #settlementMissing = false;

  constructor(input: {
    parameters: NetworkParameters; people: readonly NetworkPerson[];
    streams: RandomStreams; counters: Counters; start: SimTime;
  }) {
    this.#now = simTime(input.start);
    this.#budgetDay = Math.floor(this.#now / DAY);
    this.#streams = input.streams;
    this.#counters = { ...input.counters };
    this.#wMin = number(input.parameters?.w_min, "w_min", 0);
    if (this.#wMin > 1) throw new Error("w_min must be at most 1");
    this.#duration = number(input.parameters?.d, "d", 0, true);
    if (!input.parameters?.kinds) throw new Error("kinds parameters are required");
    for (const p of input.parameters.kinds) {
      if (this.#parameters.has(p.kind)) throw new Error(`duplicate parameters for ${p.kind}`);
      const lambda0 = number(p.lambda0, `lambda0[${p.kind}]`, 0);
      const alpha = number(p.alpha, `alpha[${p.kind}]`, 0);
      if (alpha > 1) throw new Error(`alpha[${p.kind}] must be at most 1`);
      this.#parameters.set(p.kind, { lambda0, alpha, T: number(p.T, `T[${p.kind}]`, 0, true) });
    }
    for (const p of [...input.people].sort((a, b) => compare(a.id, b.id))) {
      if (this.#people.has(p.id)) throw new Error(`duplicate person ${p.id}`);
      this.#people.set(p.id, number(p.availableHours, `availableHours[${p.id}]`, 0));
    }
  }

  get now(): SimTime { return this.#now; }
  get counters(): Counters { return { ...this.#counters }; }
  get trace(): readonly string[] {
    return this.#settlementMissing ? ["settlement exposure unavailable; no co-location exposures substituted"] : [];
  }

  #kind(kind: TieKind): CalibratedKind {
    const p = this.#parameters.get(kind);
    if (!p) throw new Error(`missing lambda0, alpha, T parameters for ${kind}`);
    return p;
  }
  #person(id: PersonId): number {
    const hours = this.#people.get(id);
    if (hours === undefined) throw new Error(`unknown person ${id}; availableHours required`);
    return hours;
  }
  #pair(i: PersonId, j: PersonId): void {
    this.#person(i); this.#person(j);
    if (i === j) throw new Error("a contact requires two different people");
  }
  #at(t: SimTime): void {
    simTime(t);
    if (t !== this.#now) throw new Error("act time must equal network.now; consume opportunities up to the act first");
  }
  #find(i: PersonId, j: PersonId): TieState | undefined {
    return [...this.#ties.values()].find((tie) => tie.i === i && tie.j === j);
  }
  #ensure(i: PersonId, j: PersonId, kind: TieKind): TieState {
    let tie = this.#find(i, j);
    if (!tie) {
      const minted = mintId(this.#counters, "tie");
      this.#counters = minted.counters;
      tie = {
        id: minted.id, i, j, exposures: new Map(), w: 0, t_last: null,
        decayedAt: this.#now, lambda: 0, next: Infinity, scheduledAt: this.#now,
      };
      this.#ties.set(tie.id, tie);
    }
    if (!tie.exposures.has(kind)) tie.exposures.set(kind, { structural: 0, sought: 0 });
    return tie;
  }

  /** Replace structural inputs atomically; intentional exposure remains until avoidance.
   * Rows are canonicalised in person/kind mint order before ties are minted.
   */
  setExposures(input: ExposureInputs): void {
    const rows: ExposureRow[] = [];
    const add = (i: PersonId, j: PersonId, kind: TieKind, x: number): void => {
      this.#pair(i, j); this.#kind(kind); number(x, `exposure[${kind}]`, 0);
      rows.push({ i, j, kind, x });
    };
    for (const row of input.sharedHours ?? []) add(row.i, row.j, row.kind, row.hours);
    for (const [kind, links] of [["household", input.households], ["kin", input.kin]] as const) {
      const seen = new Set<string>();
      for (const { i, j } of links) {
        const key = JSON.stringify([i, j].sort(compare));
        if (seen.has(key)) throw new Error(`duplicate ${kind} link`);
        seen.add(key);
        add(i, j, kind, 1); add(j, i, kind, 1);
      }
    }
    for (const meeting of input.meetings) {
      const kind: TieKind = `co-member:${meeting.org}`;
      this.#kind(kind); number(meeting.attendance, `attendance[${meeting.org}]`, 0);
      const people = [...meeting.attendees].sort(compare);
      if (new Set(people).size !== people.length) throw new Error("duplicate meeting attendee");
      for (const person of people) this.#person(person);
      for (const i of people) for (const j of people) if (i !== j) add(i, j, kind, meeting.attendance);
    }
    rows.sort((a, b) => compare(a.i, b.i) || compare(a.j, b.j) || compare(a.kind, b.kind) || a.x - b.x);
    // Check combined exposures/rates before changing any live state.
    this.#checkExposures([...rows, ...[...this.#ties.values()].flatMap((tie) =>
      [...tie.exposures].map(([kind, x]) => ({ i: tie.i, j: tie.j, kind, x: x.sought }))),
    ]);
    for (const tie of this.#ties.values()) {
      this.#decay(tie);
      for (const exposure of tie.exposures.values()) exposure.structural = 0;
    }
    for (const row of rows) if (row.x > 0) {
      this.#ensure(row.i, row.j, row.kind).exposures.get(row.kind)!.structural += row.x;
    }
    this.#settlementMissing = input.sharedHours === null;
    this.#prune(); this.#rates();
  }

  /** DESIGN §1.1: the caller names the episode's kind for its reinforcement.
   * DESIGN §1.14 5: decay uses the longest half-life of the active kinds.
   */
  recordEpisode(i: PersonId, j: PersonId, t: SimTime, kind?: TieKind): void {
    this.#at(t); this.#pair(i, j);
    const tie = this.#find(i, j);
    if (!tie) throw new Error("recordEpisode requires an existing tie");
    const selected = kind ?? (tie.exposures.size === 1 ? tie.exposures.keys().next().value : undefined);
    if (!selected || !tie.exposures.has(selected)) throw new Error("episode kind required and must belong to the tie");
    this.#strengthen(tie, selected);
    tie.t_last = t;
  }
  /** DESIGN §1.17: a completed exchange is a trade episode in both directions.
   * Host delivers it at network.now after consuming earlier opportunities.
   * Each distinct party pair supplies one contact exposure, retained until avoid.
   * Repeated legs do not multiply contacts; all pairs use person mint order.
   */
  recordExchange(record: ExchangeRecord): void {
    const t = simTime(record.day * DAY);
    this.#at(t); this.#kind("trade");
    const parties = [...new Set(record.legs.map((leg) => leg.to))].sort(compare);
    if (parties.length < 2) throw new Error("a completed exchange requires at least two distinct parties");
    for (const person of parties) this.#person(person);
    const pairs: Pair[] = [];
    for (const i of parties) for (const j of parties) if (i !== j) pairs.push({ i, j });
    const participating = new Set(parties);
    const rows: ExposureRow[] = [];
    for (const tie of this.#ties.values()) for (const [kind, x] of tie.exposures) {
      const replaces = kind === "trade" && participating.has(tie.i) && participating.has(tie.j);
      rows.push({ i: tie.i, j: tie.j, kind, x: x.structural + (replaces ? 0 : x.sought) });
    }
    this.#checkExposures([...rows, ...pairs.map((pair) => ({ ...pair, kind: "trade" as const, x: 1 }))]);
    for (const { i, j } of pairs) {
      const existing = this.#find(i, j);
      if (existing) this.#decay(existing);
      const tie = this.#ensure(i, j, "trade");
      tie.exposures.get("trade")!.sought = 1;
      this.recordEpisode(i, j, t, "trade");
    }
    this.#rates();
  }

  #strengthen(tie: TieState, kind: TieKind): void {
    this.#decay(tie);
    // DESIGN §1.1, saturating reinforcement (Granovetter; model approximation).
    const alpha = this.#kind(kind).alpha;
    const updated = tie.w + alpha * (1 - tie.w);
    // Prevent floating-point rounding to 1 when the mathematical result is <1.
    tie.w = alpha < 1 && tie.w < 1 ? Math.min(1 - Number.EPSILON / 2, updated) : updated;
  }

  seek_contact(i: PersonId, j: PersonId, t: SimTime, kind: TieKind, exposure: number): void {
    this.#at(t); this.#pair(i, j); this.#kind(kind);
    number(exposure, "seek_contact exposure", 0, true);
    number(exposure * this.#kind(kind).lambda0, "seek_contact rate", 0);
    const rows: ExposureRow[] = [];
    for (const tie of this.#ties.values()) for (const [k, x] of tie.exposures) {
      rows.push({ i: tie.i, j: tie.j, kind: k,
        x: x.structural + (tie.i === i && tie.j === j && k === kind ? 0 : x.sought) });
    }
    rows.push({ i, j, kind, x: exposure });
    this.#checkExposures(rows);
    const existing = this.#find(i, j);
    if (existing) this.#decay(existing);
    const tie = this.#ensure(i, j, kind);
    // An intention specifies current exposure; repeats strengthen w, not hours.
    tie.exposures.get(kind)!.sought = exposure;
    this.#strengthen(tie, kind);
    this.#rates();
  }

  avoid_contact(i: PersonId, j: PersonId, t: SimTime): void {
    this.#at(t); this.#pair(i, j);
    const tie = this.#find(i, j);
    if (!tie) return;
    this.#decay(tie);
    for (const x of tie.exposures.values()) { x.structural = 0; x.sought = 0; }
    this.#prune(); this.#rates();
  }

  cutTie(i: PersonId, j: PersonId): void {
    const tie = this.#find(i, j);
    if (tie) this.#ties.delete(tie.id);
    this.#rates();
  }
  cutPerson(person: PersonId): void {
    for (const tie of this.#ties.values()) if (tie.i === person || tie.j === person) this.#ties.delete(tie.id);
    this.#people.delete(person);
    this.#offered.delete(person);
    this.#rates();
  }
  setAvailableHours(person: PersonId, hours: number): void {
    this.#person(person); number(hours, `availableHours[${person}]`, 0);
    if ((this.#offered.get(person) ?? 0) * this.#duration > hours) {
      throw new Error("availableHours cannot be lowered below hours already offered today");
    }
    this.#people.set(person, hours); this.#rates();
  }

  #decay(tie: TieState): void {
    const active = [...tie.exposures].filter(([, x]) => x.structural > 0 || x.sought > 0);
    // DESIGN §1.14 5: max rule (keeper, level 4); kin direction (Roberts & Dunbar).
    // With no remaining exposure, retain the last half-life for the residual
    // strength's §1.1 decay to w_min; do not invent a new parameter.
    if (active.length) tie.halfLife = Math.max(...active.map(([kind]) => this.#kind(kind).T));
    if (tie.halfLife !== undefined) {
      // DESIGN §1.1: exponential half-life decay (Burt; Roberts & Dunbar).
      tie.w *= 2 ** (-(this.#now - tie.decayedAt) / DAY / tie.halfLife);
    }
    tie.decayedAt = this.#now;
  }
  #prune(): void {
    for (const tie of this.#ties.values()) {
      this.#decay(tie);
      for (const [kind, x] of tie.exposures) {
        if (x.structural === 0 && x.sought === 0) tie.exposures.delete(kind);
      }
      if (tie.w < this.#wMin && ![...tie.exposures.values()].some((x) => x.structural > 0)) {
        this.#ties.delete(tie.id);
      }
    }
  }
  #draw(tie: TieState): number {
    // DESIGN §1.1: inverse exponential CDF, per-tie Kernel stream only.
    // 1-U is in (0,1], including Kernel's possible exact U=0.
    return -Math.log1p(-this.#streams.get(NETWORK_PROCESS, tie.id)());
  }
  #schedule(tie: TieState, from: number): void {
    tie.scheduledAt = from;
    tie.next = tie.lambda > 0 ? from + tie.hazard! * DAY / tie.lambda : Infinity;
  }
  #checkExposures(rows: readonly ExposureRow[]): void {
    const sums = new Map<string, ExposureRow>();
    for (const row of rows) {
      const key = JSON.stringify([row.i, row.j, row.kind]);
      const x = number((sums.get(key)?.x ?? 0) + row.x, `exposure[${row.kind}]`, 0);
      sums.set(key, { ...row, x });
    }
    const totals = new Map<PersonId, number>();
    for (const row of sums.values()) {
      const rate = number(row.x * this.#kind(row.kind).lambda0, `contact rate[${row.kind}]`, 0);
      for (const person of [row.i, row.j]) {
        const total = number((totals.get(person) ?? 0) + rate, "total contact rate", 0);
        number(total * this.#duration, "total offered hours", 0);
        totals.set(person, total);
      }
    }
  }
  #rates(): void {
    const raw = new Map<TieId, number>();
    const totals = new Map<PersonId, number>();
    for (const tie of this.#ties.values()) {
      // DESIGN §1.1: additive lambda = sum_k lambda0_k * x_ij,k.
      let rate = 0;
      for (const [kind, x] of tie.exposures) rate += this.#kind(kind).lambda0 * (x.structural + x.sought);
      number(rate, "total tie contact rate", 0);
      raw.set(tie.id, rate);
      for (const person of [tie.i, tie.j]) totals.set(person, (totals.get(person) ?? 0) + rate);
    }
    for (const total of totals.values()) number(total * this.#duration, "total offered hours", 0);
    for (const tie of this.#ties.values()) {
      // DESIGN §1.1 / §1.14 4: rates and availableHours are per kernel day;
      // count incoming AND outgoing contact costs.
      const scale = (person: PersonId): number => {
        const offered = (totals.get(person) ?? 0) * this.#duration;
        return offered === 0 ? 1 : Math.min(1, this.#person(person) / offered);
      };
      const rate = raw.get(tie.id)! * Math.min(scale(tie.i), scale(tie.j));
      if (rate === tie.lambda) continue;
      if (tie.lambda > 0) {
        // Subtract integrated hazard, avoiding overflow if next is beyond the clock range.
        tie.hazard = Math.max(0, tie.hazard! - (this.#now - tie.scheduledAt) / DAY * tie.lambda);
      }
      tie.lambda = rate;
      if (rate > 0 && tie.hazard === undefined) tie.hazard = this.#draw(tie);
      this.#schedule(tie, this.#now);
    }
  }
  #clock(t: SimTime): void {
    this.#now = t;
    const day = Math.floor(t / DAY);
    if (day !== this.#budgetDay) { this.#offered.clear(); this.#budgetDay = day; }
  }

  /** Earliest event on the Kernel clock, or undefined after advancing to until.
   * Payloads are passed through by reference, never read, copied, or retained.
   * Place/channel resolution belongs to the host/Reality, using these endpoints.
   */
  nextOpportunity<Payload>(until: SimTime, payloads: readonly Payload[]): ContactOpportunity<Payload> | undefined {
    simTime(until);
    if (until < this.#now) throw new Error("network time cannot move backwards");
    this.#prune(); this.#rates();
    while (true) {
      let next: TieState | undefined;
      for (const tie of this.#ties.values()) if (!next || tie.next < next.next) next = tie;
      if (!next || next.next > until || next.next === Infinity) {
        this.#clock(until);
        return undefined;
      }
      // Ceil only the emitted timestamp, preserving continuous proposal times.
      const proposal = next.next;
      this.#clock(Math.max(this.#now, Math.ceil(proposal)));
      this.#decay(next);
      if (next.w < this.#wMin && ![...next.exposures.values()].some((x) => x.structural > 0)) {
        this.#ties.delete(next.id); this.#rates(); continue;
      }
      next.hazard = this.#draw(next);
      this.#schedule(next, proposal);
      // DESIGN §1.1 / §1.14 4: Poisson proposals alone bound only EXPECTED hours.
      // Enforce the realised invariant too, in epoch-aligned Kernel days.
      const fits = (person: PersonId): boolean =>
        ((this.#offered.get(person) ?? 0) + 1) * this.#duration <= this.#person(person);
      if (!fits(next.i) || !fits(next.j)) continue;
      for (const person of [next.i, next.j]) this.#offered.set(person, (this.#offered.get(person) ?? 0) + 1);
      return { tieId: next.id, i: next.i, j: next.j, t: this.#now, payloads };
    }
  }
  advanceTo<Payload>(until: SimTime, payloads: readonly Payload[]): ContactOpportunity<Payload>[] {
    const events: ContactOpportunity<Payload>[] = [];
    let event: ContactOpportunity<Payload> | undefined;
    while ((event = this.nextOpportunity(until, payloads))) events.push(event);
    return events;
  }
  ties(): readonly NetworkTie[] {
    this.#prune(); this.#rates();
    return [...this.#ties.values()].map((tie) => ({
      id: tie.id, i: tie.i, j: tie.j, kinds: [...tie.exposures.keys()],
      w: tie.w, lambda: tie.lambda, t_last: tie.t_last,
    }));
  }
  offeredHours(person: PersonId): number {
    this.#person(person);
    return (this.#offered.get(person) ?? 0) * this.#duration;
  }

  /** Observer projection: simple undirected graph; isolates remain components.
   * DESIGN §1.1 / Watts & Strogatz 1998: C_i = 2E_i / (k_i(k_i-1)).
   * No mechanism reads these measures or assigns affinity from them.
   */
  measures(): {
    degree: ReadonlyMap<PersonId, number>;
    localClustering: ReadonlyMap<PersonId, number>;
    components: readonly (readonly PersonId[])[];
  } {
    const neighbours = new Map([...this.#people.keys()].map((id) => [id, new Set<PersonId>()]));
    for (const tie of this.ties()) { neighbours.get(tie.i)!.add(tie.j); neighbours.get(tie.j)!.add(tie.i); }
    const degree = new Map<PersonId, number>();
    const localClustering = new Map<PersonId, number>();
    for (const [person, adjacent] of neighbours) {
      const nodes = [...adjacent].sort(compare);
      let edges = 0;
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
        if (neighbours.get(nodes[a])!.has(nodes[b])) edges++;
      }
      degree.set(person, nodes.length);
      localClustering.set(person, nodes.length < 2 ? 0 : 2 * edges / (nodes.length * (nodes.length - 1)));
    }
    const visited = new Set<PersonId>();
    const components: PersonId[][] = [];
    for (const person of neighbours.keys()) if (!visited.has(person)) {
      const component = [person]; visited.add(person);
      for (let index = 0; index < component.length; index++) {
        for (const neighbour of [...neighbours.get(component[index])!].sort(compare)) if (!visited.has(neighbour)) {
          visited.add(neighbour); component.push(neighbour);
        }
      }
      components.push(component.sort(compare));
    }
    return { degree, localClustering, components };
  }
}
