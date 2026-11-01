import { simTime, transaction, type Counters, type Participant, type RandomStreams } from "@rex/kernel";
import { found, merge, split, secede, dissolve, SplitRefusal, type LifecycleHost, type FoundIntention,
  type SplitInput, type SecessionInput } from "./formation.ts";
import type { CommunicationNetwork } from "./network.ts";
import { validateCharter } from "./charter.ts";
import { collectiveChoice, proposalProcedure, type ChoiceEvent } from "./choice.ts";
import { amendmentDraft } from "./amendment.ts";
import type { InventoryPort, LedgerPort, OrganisationFacts, ViewsPort } from "./ports.ts";
import { mintId, type Charter, type CharterCapabilities, type DecisionProcedure, type OrganisationEvent,
  type OrganisationEventPayload, type OrgId, type PersonId, type Schedule, type SocialIntention } from "./types.ts";

export const ORGANISATION_PROCESS = "society.organisation.actors";
export interface Membership {
  person: PersonId;
  role: string;
  joined_at: number;
  standing: "active" | "suspended";
  suspended_until?: number;
}
export interface Office { role: string; holder: PersonId | null; term: number | "indefinite"; until: number | null }
export interface Organisation {
  id: OrgId;
  founded_at: number;
  founders: PersonId[];
  members: Membership[];
  charter: Charter;
  positions: Office[];
  schedule: { activity: string; first: number; period: number }[];
  businesses: string[];
}
export interface DueObligation {
  org: OrgId;
  person: PersonId;
  component: number;
  due_at: number;
  status: "paid" | "unpaid" | "fulfilled" | "unfulfilled";
}
export interface DecisionRequest {
  proposalId: string;
  proposal: SocialIntention;
  ballots: readonly SocialIntention[];
}
export interface AttemptContext {
  /** Required for propose (the attempted intention is authoritative); admission
   * votes instead use decision.proposal, expressed by a current member.
   */
  decision?: DecisionRequest;
}
export interface StoreOptions {
  start: number;
  counters: Counters;
  ledger: LedgerPort;
  inventory?: InventoryPort;
  views: ViewsPort;
  capabilities: CharterCapabilities;
  facts?: OrganisationFacts;
  streams?: RandomStreams;
}
interface State {
  now: number;
  counters: Counters;
  organisations: Organisation[];
  events: OrganisationEvent[];
  obligations: DueObligation[];
  attendance: { org: OrgId; person: PersonId; activity: string; t: number }[];
  claims: string[];
  decisions: string[];
  unavailable: PersonId[];
  foundings: string[];
}
const compare = (a: string, b: string): number => {
  const x = /^(.*\.)(\d+)$/.exec(a), y = /^(.*\.)(\d+)$/.exec(b);
  return x && y && x[1] === y[1] ? Number(x[2]) - Number(y[2]) : a < b ? -1 : a > b ? 1 : 0;
};
const ordered = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort(compare);

/** DESIGN §1.2, §2.2–2.3. Host advances this store with Kernel SimTime before
 * delivering acts. advanceTo visits every due time, so coarse clock steps do not
 * skip obligations. Accessors are detached: views cannot edit the actor store.
 * found is the only insertion seam and resolves the founding circle.
 * Lifecycle mutations and their external views commit in one transaction.
 */
export class OrganisationStore {
  #state: State;
  #options: StoreOptions;
  #participant: Participant;

  constructor(options: StoreOptions) {
    this.#options = { ...options, capabilities: structuredClone(options.capabilities) };
    this.#state = { now: simTime(options.start), counters: { ...options.counters }, organisations: [],
      events: [], obligations: [], attendance: [], claims: [], decisions: [], unavailable: [], foundings: [] };
    // Published event objects are immutable internally; detach the append-only
    // log array without repeatedly cloning its entire historical payloads.
    this.#participant = { id: ORGANISATION_PROCESS,
      snapshot: () => ({ ...structuredClone({ ...this.#state, events: [] }), events: this.#state.events.slice() }),
      restore: (state) => { this.#state = state as State; } };
  }
  get now(): number { return this.#state.now; }
  get events(): readonly OrganisationEvent[] { return structuredClone(this.#state.events); }
  get obligations(): readonly DueObligation[] { return structuredClone(this.#state.obligations); }
  organisations(): readonly Organisation[] { return structuredClone(this.#state.organisations); }
  get(id: OrgId): Organisation | undefined { return structuredClone(this.#find(id)); }
  memberships(person: PersonId): readonly OrgId[] {
    return this.#state.organisations.filter((org) => org.members.some((m) => m.person === person)).map((org) => org.id);
  }
  #find(id: OrgId): Organisation | undefined { return this.#state.organisations.find((org) => org.id === id); }
  #atomic<T>(work: () => T): T {
    const { ledger, inventory, views, streams } = this.#options;
    const participants = [this.#participant, ledger, views];
    if (inventory) participants.push(inventory);
    if (streams) participants.push({ id: `${ORGANISATION_PROCESS}.streams`, snapshot: () => streams.state(),
      restore: (state) => streams.restore(state as ReturnType<RandomStreams["state"]>) });
    return transaction(participants, work);
  }
  #emit(org: OrgId, kind: OrganisationEvent["kind"], cause: string,
    intentions: readonly SocialIntention[] = [], payload: OrganisationEventPayload = {}): OrganisationEvent {
    const event = structuredClone({ org, kind, t: this.now, cause, intentions, payload });
    this.#state.events.push(event);
    return structuredClone(event);
  }
  #refuse(org: OrgId, reason: string, intentions: readonly SocialIntention[] = []): OrganisationEvent {
    return this.#emit(org, "refused", reason, intentions, { outcome: "refused", reason });
  }
  #time(intention: SocialIntention): void {
    if (simTime(intention.t) !== this.now) throw new Error("attempt time must equal the store's Kernel clock; advanceTo first");
  }
  #errors(charter: Charter): string[] {
    const { capabilities, facts, inventory } = this.#options;
    const errors = validateCharter(charter, capabilities);
    for (const rule of charter.admission ?? []) {
      if (rule.type === "sponsored" && !facts?.sponsors) errors.push("admission requires current sponsor facts");
      if (rule.type === "kinship" && !facts?.kinship) errors.push("admission requires current kinship facts");
      if (rule.type === "occupation" && !facts?.occupation) errors.push("admission requires current occupation facts");
    }
    if (charter.benefits?.some((b) => b.type === "goods") && !inventory) errors.push("benefits require inventory adapter");
    if (charter.obligations?.some((o) => o.type === "service") && !facts?.serviceHours) errors.push("service requires current service facts");
    const schedules = [...(charter.obligations ?? []), ...(charter.benefits ?? [])];
    for (const rule of schedules) if ("schedule" in rule) {
      try { simTime(rule.schedule.first!); simTime(rule.schedule.period!); }
      catch { errors.push("schedules require Kernel integer milliseconds"); }
    }
    for (const p of charter.positions ?? []) if (p.term !== "indefinite" && !Number.isSafeInteger(p.term)) errors.push("position term requires integer milliseconds");
    for (const s of charter.sanctions ?? []) if (s.type === "suspension" && !Number.isSafeInteger(s.duration)) errors.push("suspension requires integer milliseconds");
    const needsLots = (p: DecisionProcedure): boolean => p.type === "council" ? needsLots(p.procedure)
      : p.type === "simple_majority" && p.tie_break?.type === "lots";
    const procedures = [charter.decision_procedure, charter.amendment, ...(charter.positions ?? []),
      ...(charter.sanctions ?? []).map((s) => s.procedure),
      ...(charter.admission ?? []).flatMap((a) => a.type === "vote" ? [a.procedure] : [])];
    if (!this.#options.streams && procedures.some((p) => p && needsLots(p))) errors.push("declared lots require Kernel streams");
    return errors;
  }
  found(intention: FoundIntention, joins: readonly SocialIntention[],
    network: Pick<CommunicationNetwork, "now" | "ties">): OrganisationEvent {
    return this.#atomic(() => {
      const minted = mintId(this.#state.counters, "org"); this.#state.counters = minted.counters;
      const id = minted.id;
      const errors = this.#errors(intention.payload.charter);
      const fees = (intention.payload.charter.admission ?? []).reduce((sum, rule) => sum + (rule.type === "fee" ? rule.amount! : 0), 0);
      if (!Number.isFinite(fees)) errors.push("founding fees exceed finite range");
      if (intention.payload.founders.some((person) => this.#options.ledger.balance(person) < fees)) errors.push("founder cannot pay admission fee");
      if (this.#state.foundings.includes(intention.target)) errors.push("founding identity already resolved");
      else this.#state.foundings.push(intention.target);
      const businesses = intention.payload.businesses ?? [];
      if (new Set(businesses).size !== businesses.length || businesses.some((b) => !b.trim()
        || this.#state.organisations.some((org) => org.businesses.includes(b)))) errors.push("business already points at an actor or is invalid");
      const result = found(intention, joins, network, { id, now: this.now, capabilities: this.#options.capabilities, errors, unavailable: this.#state.unavailable });
      const intentions = [intention, ...[...joins].sort((a, b) => compare(a.person, b.person))];
      if (!result.organisation) return this.#emit(id, "refused", result.errors.join("; "), intentions,
        { outcome: "failed", errors: result.errors, missing: result.missing, founding: intention.target });
      for (const person of result.organisation.founders) {
        if (fees) this.#options.ledger.transfer(person, id, fees, "founding admission fee");
      }
      this.#state.organisations.push(result.organisation);
      this.#state.organisations.sort((a, b) => compare(a.id, b.id));
      this.#options.views.onCreated(id);
      return this.#emit(id, "founded", "founders' commitments", intentions,
        { founding: intention.target, purpose: intention.payload.purpose, admissionFeeCollected: fees,
          revenueCollected: fees * result.organisation.founders.length });
    });
  }

  /** DESIGN §1.2 demographic identity (level 1): set equality, not just a count. */
  #members(org: Organisation, joins: readonly PersonId[], removals: readonly PersonId[]): void {
    const before = org.members.map((m) => m.person);
    if (new Set(before).size !== before.length || joins.some((p) => before.includes(p))
      || removals.some((p) => !before.includes(p)) || ordered(joins).length !== joins.length
      || ordered(removals).length !== removals.length) throw new Error("membership accounting does not close");
    org.members = org.members.filter((m) => !removals.includes(m.person));
    org.members.push(...joins.map((person): Membership => ({ person, role: "member", joined_at: this.now, standing: "active" })));
    org.members.sort((a, b) => compare(a.person, b.person));
    const expected = ordered([...before.filter((p) => !removals.includes(p)), ...joins]);
    if (org.members.length !== before.length + joins.length - removals.length
      || org.members.some((m, i) => m.person !== expected[i])) throw new Error("membership identity failed");
    for (const position of org.positions) if (position.holder && removals.includes(position.holder)) {
      position.holder = null; position.until = null;
    }
    this.#state.attendance = this.#state.attendance.filter((a) => a.org !== org.id || !removals.includes(a.person));
    for (const person of joins) for (const current of this.#state.organisations) {
      if (current.members.some((m) => m.person === person) && this.#exclusive(current, person)) {
        this.#emit(current.id, "refused", "exclusive membership obligation unmet", [], { person });
      }
    }
  }
  #active(org: Organisation, person: PersonId): boolean {
    return org.members.some((m) => m.person === person && m.standing === "active");
  }
  #choice(org: Organisation, request: DecisionRequest, procedure: DecisionProcedure): ChoiceEvent {
    if (this.#state.decisions.includes(request.proposalId)) throw new Error("proposal identity already resolved");
    const event = collectiveChoice({ org: org.id, t: this.now, proposalId: request.proposalId,
      proposal: request.proposal, intentions: request.ballots, procedure,
      members: org.members.filter((m) => m.standing === "active").map((m) => m.person),
      positions: org.positions.map((p) => ({ role: p.role, holder: p.holder && this.#active(org, p.holder) ? p.holder : null })),
      present: ordered(this.#state.attendance.filter((a) => a.org === org.id && a.t === this.now && this.#active(org, a.person)).map((a) => a.person)),
      streams: this.#options.streams });
    this.#state.events.push(structuredClone(event));
    // One proposal may be checked by multiple admission components in this attempt.
    return event;
  }
  attempt(intention: SocialIntention, context: AttemptContext = {}): OrganisationEvent {
    this.#time(intention);
    if (!intention.target) throw new Error("organisation attempt requires a target");
    return this.#atomic(() => {
      const id = intention.target as OrgId, org = this.#find(id);
      if (!org) return this.#refuse(id, "organisation does not exist", [intention]);
      if (this.#state.unavailable.includes(intention.person)) return this.#refuse(id, "person has died or departed", [intention]);
      if (context.decision && this.#state.decisions.includes(context.decision.proposalId)) {
        return this.#refuse(id, "proposal identity already resolved", [intention]);
      }
      if (intention.kind === "join") {
        const start = this.#state.events.length;
        const event = this.#join(org, intention, context.decision);
        // A resolved vote cannot be replayed after a later admission component
        // refuses (for example an unpaid entry fee). Ledger exceptions roll this back.
        if (context.decision && this.#state.events.slice(start).some((e) => e.payload?.proposalId === context.decision!.proposalId)) {
          this.#state.decisions.push(context.decision.proposalId);
        }
        return event;
      }
      const member = org.members.find((m) => m.person === intention.person);
      if (!member) return this.#refuse(id, "not a member", [intention]);
      if (intention.kind === "leave") {
        this.#members(org, [], [intention.person]);
        const event = this.#emit(id, "left", "accepted leave", [intention]);
        if (!org.members.length) this.#dissolve(org, "last member left", [intention]);
        return event;
      }
      if (intention.kind === "pay") return this.#pay(org, intention);
      if (!this.#active(org, intention.person)) return this.#refuse(id, "membership suspended", [intention]);
      if (intention.kind === "attend") {
        const activity = intention.payload?.activity;
        if (typeof activity !== "string" || !org.schedule.some((s) => s.activity === activity && this.#scheduled(s, this.now))) {
          return this.#refuse(id, "no such meeting now", [intention]);
        }
        if (this.#state.attendance.some((a) => a.org === id && a.person === intention.person && a.activity === activity && a.t === this.now)) {
          return this.#refuse(id, "already attended", [intention]);
        }
        this.#state.attendance.push({ org: id, person: intention.person, activity, t: this.now });
        for (const due of this.#state.obligations) {
          const rule = org.charter.obligations?.[due.component];
          if (due.org === id && due.person === intention.person && due.due_at === this.now
            && rule?.type === "attendance" && rule.activity === activity) due.status = "fulfilled";
        }
        return this.#emit(id, "act", "attended", [intention], { activity });
      }
      if (intention.kind === "propose") return this.#propose(org, intention, context.decision);
      return this.#refuse(id, "unsupported organisation attempt", [intention]);
    });
  }
  #join(org: Organisation, intention: SocialIntention, decision?: DecisionRequest): OrganisationEvent {
    const person = intention.person;
    const refuse = (reason: string) => this.#refuse(org.id, reason, [intention]);
    if (org.members.some((m) => m.person === person)) return refuse("already a member");
    // All admission components are conjunctive (DESIGN §1.2a composition).
    let fees = 0;
    for (const rule of org.charter.admission!) {
      switch (rule.type) {
        case "open": break;
        case "sponsored": {
          const sponsors = ordered(this.#options.facts!.sponsors!(person, org.id, this.now));
          if (sponsors.filter((p) => this.#active(org, p)).length < rule.members!) return refuse("insufficient current member sponsors");
          break;
        }
        case "kinship":
          if (!org.members.some((m) => this.#options.facts!.kinship!(person, m.person, rule.relation, this.now))) return refuse("kinship admission not met");
          break;
        case "occupation":
          if (!this.#options.facts!.occupation!(person, rule.port, rule.occupation, this.now)) return refuse("occupation admission not met");
          break;
        case "fee": fees += rule.amount!; break;
        case "vote": {
          if (!decision || decision.proposal.payload?.action !== "admit" || decision.proposal.payload?.person !== person) return refuse("admission requires a proposal naming this applicant");
          const result = this.#choice(org, decision, rule.procedure);
          if (result.payload.outcome !== "accepted") {
            return refuse(result.payload.reason ?? "admission vote rejected");
          }
          break;
        }
      }
    }
    if (this.#exclusive(org, person)) return refuse("exclusive membership obligation not met");
    if (!Number.isFinite(fees)) return refuse("admission fees exceed finite range");
    if (fees > this.#options.ledger.balance(person)) return refuse("cannot pay admission fee");
    if (fees) this.#options.ledger.transfer(person, org.id, fees, "admission fee");
    this.#members(org, [person], []);
    return this.#emit(org.id, "joined", "accepted join", [intention], { admissionFeeCollected: fees, revenueCollected: fees });
  }
  #exclusive(org: Organisation, person: PersonId): boolean {
    const memberships = this.memberships(person);
    return (org.charter.obligations ?? []).some((o) => o.type === "exclusivity" && o.organisations.some((id) => memberships.includes(id)));
  }
  #pay(org: Organisation, intention: SocialIntention): OrganisationEvent {
    const due = this.#state.obligations.find((d) => d.org === org.id && d.person === intention.person
      && d.component === intention.payload?.component && d.due_at === intention.payload?.due_at && d.status === "unpaid");
    if (!due) return this.#refuse(org.id, "no such unpaid obligation", [intention]);
    return this.#collect(org, due, [intention]);
  }
  #collect(org: Organisation, due: DueObligation, intentions: readonly SocialIntention[] = []): OrganisationEvent {
    const rule = org.charter.obligations![due.component];
    if (rule.type !== "dues") throw new Error("payment requires dues");
    if (this.#options.ledger.balance(due.person) < rule.amount!) {
      due.status = "unpaid";
      return this.#emit(org.id, "refused", "cannot pay dues", intentions, { ...due, reason: "want of resources" });
    }
    this.#options.ledger.transfer(due.person, org.id, rule.amount!, "organisation dues");
    due.status = "paid";
    return this.#emit(org.id, "act", "dues paid", intentions, { ...due, revenueCollected: rule.amount! });
  }
  #scheduled(schedule: { first: number; period: number }, t: number): boolean {
    return t >= schedule.first && (t - schedule.first) % schedule.period === 0;
  }
  #next(schedule: Schedule, after: number): number {
    // DESIGN §1.2: first + n*period; first occurrence strictly after the last clock.
    const first = schedule.first!, period = schedule.period!;
    const t = first > after ? first : first + (Math.floor((after - first) / period) + 1) * period;
    return Number.isSafeInteger(t) ? t : Infinity;
  }
  /** Called from a Kernel process's run(ctx) using ctx.t. Dues accrue strictly
   * after joining; a period at the exact founding/join time is not back-charged.
   * Attendance can fulfil a due row later in the same Kernel tick.
   */
  advanceTo(t: number): void {
    simTime(t);
    if (t < this.now) throw new Error("cannot reverse organisation clock");
    this.#atomic(() => {
      while (this.now < t) {
        let next = t;
        for (const org of this.#state.organisations) for (const rule of org.charter.obligations ?? []) {
          if ("schedule" in rule) next = Math.min(next, this.#next(rule.schedule, this.now));
        }
        this.#state.now = next;
        this.#state.attendance = this.#state.attendance.filter((a) => a.t === next);
        for (const org of this.#state.organisations) {
          for (const m of org.members) if (m.standing === "suspended" && m.suspended_until! <= next) {
            m.standing = "active"; delete m.suspended_until;
          }
          for (const p of org.positions) if (p.until !== null && p.until <= next) { p.holder = null; p.until = null; }
          (org.charter.obligations ?? []).forEach((rule, component) => {
            if (rule.type === "exclusivity" || !this.#scheduled({ first: rule.schedule.first!, period: rule.schedule.period! }, next)) return;
            for (const member of org.members) {
              const due: DueObligation = { org: org.id, person: member.person, component, due_at: next,
                status: rule.type === "dues" ? "unpaid" : "unfulfilled" };
              this.#state.obligations.push(due);
              if (rule.type === "dues") this.#collect(org, due);
              else {
                if (rule.type === "service" && this.#options.facts!.serviceHours!(member.person, org.id, rule.activity,
                  Math.max(member.joined_at, next - rule.schedule.period!), next) >= rule.hours!) due.status = "fulfilled";
                this.#emit(org.id, "act", "obligation due", [], { ...due });
              }
            }
          });
        }
      }
    });
  }

  /** Host-delivered observed event, not an applicant's assertion. Event ids make
   * retries idempotent, including failed resource claims (DESIGN §1.2a, §2.3).
   */
  claim(input: { org: OrgId; person: PersonId; eventId: string; event: string; t: number }): readonly OrganisationEvent[] {
    if (simTime(input.t) !== this.now || !input.eventId.trim()) throw new Error("claim requires a current emitted event identity");
    return this.#atomic(() => {
      const org = this.#find(input.org);
      if (!org || !this.#active(org, input.person)) return [this.#refuse(input.org, "claim requires active membership")];
      const key = JSON.stringify([input.org, input.person, input.eventId]);
      if (this.#state.claims.includes(key)) return [this.#refuse(input.org, "event already claimed")];
      const benefits = (org.charter.benefits ?? []).filter((b) => b.type !== "meeting" && b.event === input.event);
      if (!benefits.length) return [this.#refuse(input.org, "no benefit for this event")];
      this.#state.claims.push(key);
      return benefits.map((benefit) => {
        if (benefit.type === "meeting") throw new Error("meeting is not an event claim");
        const { ledger, inventory } = this.#options;
        const available = benefit.type === "goods" ? inventory!.quantity(org.id, benefit.good) >= benefit.quantity!
          : ledger.balance(org.id) >= benefit.amount!;
        const payload = { person: input.person, eventId: input.eventId, event: input.event, benefit,
          outcome: available ? "paid" : "failed", reason: available ? undefined : "want of resources" };
        if (!available) return this.#emit(org.id, "refused", "benefit failed for want of resources", [], payload);
        if (benefit.type === "goods") inventory!.transfer(org.id, input.person, benefit.good, benefit.quantity!, "organisation benefit");
        else ledger.transfer(org.id, input.person, benefit.amount!, "organisation benefit");
        return this.#emit(org.id, "act", "benefit paid", [], payload);
      });
    });
  }

  #propose(org: Organisation, intention: SocialIntention, decision?: DecisionRequest): OrganisationEvent {
    if (!decision) return this.#refuse(org.id, "requires a proposal identity and expressed ballots", [intention]);
    const action = intention.payload?.action ?? "act";
    const component = intention.payload?.component;
    const sanction = action === "sanction" && typeof component === "number" && Number.isSafeInteger(component)
      ? org.charter.sanctions?.[component] : undefined;
    const office = action === "elect" ? org.charter.positions?.find((p) => p.position === intention.payload?.role) : undefined;
    const procedure = proposalProcedure(org.charter, intention.payload);
    if (action === "amend" && !procedure) return this.#refuse(org.id, "no amendment component", [intention]);
    if (!procedure) return this.#refuse(org.id, "no decision procedure", [intention]);
    const amendment = action === "amend" ? amendmentDraft(org.charter, intention.payload) : undefined;
    if (amendment && "reason" in amendment) return this.#refuse(org.id, amendment.reason, [intention]);
    if (amendment) {
      const errors = this.#errors(amendment.charter);
      if (errors.length) return this.#emit(org.id, "refused", "invalid amended charter", [intention],
        { outcome: "refused", reason: "invalid amended charter", errors });
    }
    const person = intention.payload?.person as PersonId;
    if (action === "sanction" && (!sanction || !org.members.some((m) => m.person === person))) return this.#refuse(org.id, "sanction requires a declared rule and current member", [intention]);
    if (action === "elect" && (!office || !this.#active(org, person))) return this.#refuse(org.id, "election requires a declared position and active member", [intention]);
    // Other mechanisms may consume generic acts; they cannot mutate this store.
    if (action !== "amend" && action !== "sanction" && action !== "elect" && action !== "dissolve" && action !== "act") return this.#refuse(org.id, "unsupported proposal action", [intention]);
    const result = this.#choice(org, { ...decision, proposal: intention }, procedure);
    this.#state.decisions.push(decision.proposalId);
    if (result.payload.outcome !== "accepted") return structuredClone(result);
    if (amendment) {
      org.charter = amendment.charter;
      // IF-46 B: publication is an observable act, retaining the proposal and
      // tally. Hosts deliver it through observation/testimony (DESIGN §2.2).
      return this.#emit(org.id, "act", "charter amended", result.intentions,
        { ...result.payload, ...amendment.change, previous: amendment.previous, amendmentApplied: true });
    }
    if (action === "dissolve") this.#dissolve(org, "passed dissolution", result.intentions);
    if (office) {
      const position = org.positions.find((p) => p.role === office.position)!;
      position.holder = person;
      position.until = position.term === "indefinite" ? null : simTime(this.now + position.term);
      this.#emit(org.id, "office_changed", "passed election", result.intentions, { role: position.role, holder: person });
    }
    if (sanction) {
      if (sanction.type === "expulsion") {
        this.#members(org, [], [person]);
        this.#emit(org.id, "act", "sanction applied", result.intentions, { person, component, sanction, sanctionApplied: true });
        this.#emit(org.id, "expelled", "passed sanction", result.intentions, { person });
        if (!org.members.length) this.#dissolve(org, "last member expelled", result.intentions);
      } else if (sanction.type === "suspension") {
        const member = org.members.find((m) => m.person === person)!;
        member.standing = "suspended"; member.suspended_until = simTime(this.now + sanction.duration!);
      } else {
        if (this.#options.ledger.balance(person) < sanction.amount!) return this.#refuse(org.id, "fine failed for want of resources", result.intentions);
        this.#options.ledger.transfer(person, org.id, sanction.amount!, "passed fine");
      }
      if (sanction.type !== "expulsion") this.#emit(org.id, "act", "sanction applied", result.intentions, { person, component, sanction, sanctionApplied: true });
    }
    return structuredClone(result);
  }
  removePerson(person: PersonId, cause: "death" | "departure"): readonly OrganisationEvent[] {
    return this.#atomic(() => {
      const events: OrganisationEvent[] = [];
      if (!this.#state.unavailable.includes(person)) this.#state.unavailable.push(person);
      for (const org of [...this.#state.organisations]) if (org.members.some((m) => m.person === person)) {
        this.#members(org, [], [person]);
        events.push(this.#emit(org.id, "left", cause, [], { person }));
        if (!org.members.length) events.push(this.#dissolve(org, `last member ${cause}`));
      }
      return events;
    });
  }
  #lifecycle(): LifecycleHost {
    return {
      now: this.now, organisations: this.#state.organisations, views: this.#options.views,
      find: (id) => this.#find(id),
      remove: (id) => { this.#state.organisations = this.#state.organisations.filter((org) => org.id !== id); },
      members: (org, joins, removals) => this.#members(org, joins, removals),
      emit: (id, kind, cause, intentions, payload) => this.#emit(id, kind, cause, intentions, payload),
      refuse: (id, cause, intentions) => this.#refuse(id, cause, intentions),
      choose: (org, request) => {
        const result = this.#choice(org, request, org.charter.decision_procedure!);
        this.#state.decisions.push(request.proposalId);
        return result;
      },
      join: (org, intention) => this.#join(org, intention),
    };
  }
  #dissolve(org: Organisation, cause: string, intentions: readonly SocialIntention[] = []): OrganisationEvent {
    return dissolve(this.#lifecycle(), org, cause, intentions);
  }
  split(input: SplitInput, decision: DecisionRequest): OrganisationEvent {
    try {
      return this.#atomic(() => split(this.#lifecycle(), input, decision));
    } catch (error) {
      if (!(error instanceof SplitRefusal)) throw error;
      return this.#atomic(() => this.#refuse(input.source, error.message,
        [decision.proposal, ...decision.ballots, ...input.choices]));
    }
  }
  secede(input: SecessionInput, network: Pick<CommunicationNetwork, "now" | "ties">): OrganisationEvent {
    return this.#atomic(() => secede(input, {
      ...this.#lifecycle(), source: this.#find(input.source),
      attempt: (intention) => this.attempt(intention),
      found: (intention, joins) => this.found(intention, joins, network),
    }));
  }
  merge(survivingId: OrgId, sourceId: OrgId, decisions: readonly [DecisionRequest, DecisionRequest]): OrganisationEvent {
    return this.#atomic(() => merge(this.#lifecycle(), survivingId, sourceId, decisions));
  }
}
