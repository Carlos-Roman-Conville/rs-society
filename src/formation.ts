import type { CommunicationNetwork } from "./network.ts";
import type { ChoiceEvent } from "./choice.ts";
import { validateCharter } from "./charter.ts";
import type { ViewsPort } from "./ports.ts";
import type { DecisionRequest, Organisation } from "./organisation.ts";
import type { Charter, CharterCapabilities, OrganisationEvent, OrganisationEventPayload, OrgId, PersonId, SocialIntention } from "./types.ts";

export const FORMATION_PROCESS = "society.institution.formation_dissolution";

export interface FoundIntention extends SocialIntention {
  readonly kind: "found";
  /** Identity of this draft: all founding joins must target it. */
  readonly target: string;
  readonly payload: {
    readonly charter: Charter;
    readonly founders: readonly PersonId[];
    readonly purpose: string;
    readonly businesses?: readonly string[];
  };
}
export interface FoundingResult {
  readonly organisation?: Organisation;
  readonly errors: readonly string[];
  readonly missing: readonly PersonId[];
}

export const mintOrder = (a: string, b: string): number => {
  const x = /^(.*\.)(\d+)$/.exec(a), y = /^(.*\.)(\d+)$/.exec(b);
  return x && y && x[1] === y[1] ? Number(x[2]) - Number(y[2]) : a < b ? -1 : a > b ? 1 : 0;
};

/** DESIGN §1.4: resolve a delivered founding circle at the host's current time.
 * The host accumulates expressed joins, then submits them together; an incomplete
 * submission is a failed attempt, never a pending or automatically created actor.
 * validateCharter checks the draft; the store adds current adapter checks.
 * Only this function constructs organisations; the store commits its result in
 * the same Kernel transaction as its founding event and view notifications.
 */
export function found(intention: FoundIntention, joins: readonly SocialIntention[],
  network: Pick<CommunicationNetwork, "now" | "ties">,
  context: { id: OrgId; now: number; capabilities: CharterCapabilities; errors: readonly string[]; unavailable: readonly PersonId[] }): FoundingResult {
  const { charter, purpose } = intention.payload;
  const founders = [...intention.payload.founders].sort(mintOrder);
  const errors = [...new Set([...validateCharter(charter, context.capabilities), ...context.errors])];
  const window = charter.founding?.window;
  const minimum = charter.founding?.minimum;
  if (!charter.founding) errors.push("founding: requires window and minimum; no defaults");
  if (intention.kind !== "found" || !intention.target.trim() || !purpose.trim()
    || !founders.includes(intention.person) || !founders.length) errors.push("requires a named founder, draft identity and purpose");
  if (new Set(founders).size !== founders.length) errors.push("duplicate named founder");
  if (founders.some((person) => context.unavailable.includes(person))) errors.push("founders must be available");
  if (!Number.isSafeInteger(intention.t) || intention.t < 0 || intention.t > context.now) errors.push("invalid founding time");
  const deadline = intention.t + (window ?? NaN);
  if (!Number.isSafeInteger(deadline)) errors.push("invalid founding deadline");
  const validJoin = (join: SocialIntention): boolean => join.kind === "join" && join.target === intention.target
    && founders.includes(join.person) && Number.isSafeInteger(join.t)
    && join.t >= intention.t && join.t <= deadline && join.t <= context.now;
  const missing = founders.filter((person) => !joins.some((join) => join.person === person && validJoin(join)));
  if (missing.length) errors.push("missing founders' join intentions within founding window");
  if (joins.some((join) => !validJoin(join))) errors.push("invalid founding join intention");
  if (new Set(joins.map((join) => join.person)).size !== joins.length) errors.push("duplicate founding join intention");
  if (typeof minimum !== "number" || founders.length < minimum) errors.push("minimum founding membership not met");
  if (network.now !== context.now) errors.push("network and organisation clocks must agree");
  // DESIGN §1.4: every founder must reach every other over existing directed
  // ties (§1.1). Intermediaries may be non-founders; no second network is stored.
  const ties = network.ties();
  for (const person of founders) {
    const seen = new Set<PersonId>([person]), queue = [person];
    for (let i = 0; i < queue.length; i++) for (const tie of ties) {
      if (tie.i === queue[i] && !seen.has(tie.j)) { seen.add(tie.j); queue.push(tie.j); }
    }
    if (founders.some((other) => !seen.has(other))) { errors.push("founders are not mutually reachable"); break; }
  }
  if (errors.length) return { errors, missing };
  const organisation: Organisation = {
    id: context.id, founded_at: context.now, founders, charter: structuredClone(charter),
    members: founders.map((person) => ({ person, role: "member", joined_at: context.now, standing: "active" })),
    positions: (charter.positions ?? []).map((p) => ({ role: p.position, holder: null, term: p.term!, until: null })),
    schedule: [...(charter.obligations ?? []), ...(charter.benefits ?? [])]
      .flatMap((r) => r.type === "attendance" || r.type === "meeting"
        ? [{ activity: r.activity, first: r.schedule.first!, period: r.schedule.period! }] : []),
    businesses: [...(intention.payload.businesses ?? [])].sort(mintOrder),
  };
  return { organisation, errors, missing };
}

export interface SplitInput {
  readonly source: OrgId;
  /** Successors must already have been founded through named intentions. The
   * source may itself survive. Every former member supplies exactly one choice:
   * join a listed successor, or leave the source without a successor.
   */
  readonly successors: readonly OrgId[];
  readonly choices: readonly SocialIntention[];
  readonly cause: string;
}

export interface SecessionInput {
  readonly source: OrgId;
  readonly intention: FoundIntention;
  readonly joins: readonly SocialIntention[];
  readonly exits: readonly SocialIntention[];
  readonly cause: string;
}

/** DESIGN §1.4: a minority's own exits, followed by its own founding. Failed
 * founding leaves their accepted exits in effect; consent to leave is not
 * contingent on a successful new association. No majority act is needed.
 */
export function secede(input: SecessionInput, host: {
  now: number;
  source: Organisation | undefined;
  attempt(intention: SocialIntention): OrganisationEvent;
  found(intention: FoundIntention, joins: readonly SocialIntention[]): OrganisationEvent;
  emit: LifecycleHost["emit"];
  refuse: LifecycleHost["refuse"];
}): OrganisationEvent {
  const founders = input.intention.payload.founders;
  const intentions = [...input.exits, input.intention, ...input.joins];
  const source = host.source;
  if (!source || !input.cause.trim() || !founders.length || new Set(founders).size !== founders.length
    || founders.length >= source.members.length - founders.length
    || founders.some((p) => !source.members.some((m) => m.person === p))
    || input.exits.length !== founders.length || new Set(input.exits.map((i) => i.person)).size !== founders.length
    || input.exits.some((i) => i.kind !== "leave" || i.target !== source.id || i.t !== host.now || !founders.includes(i.person))) {
    return host.refuse(input.source, "secession requires a current minority's own exit intentions and cause", intentions);
  }
  for (const exit of [...input.exits].sort((a, b) => mintOrder(a.person, b.person))) {
    const event = host.attempt(exit);
    if (event.kind !== "left") return event;
  }
  const founding = host.found(input.intention, input.joins);
  if (founding.kind !== "founded") return founding;
  return host.emit(source.id, "split", input.cause, intentions, {
    successors: [source.id, founding.org], left: [],
    resourceClaims: { status: "unsettled", owners: ["Economy", "Settlement"], source: source.id,
      successors: [founding.org], businesses: [...source.businesses] },
  });
}

/** DESIGN §1.4, member conservation (level 1: a partition of a finite set). */
export function splitErrors(input: SplitInput, source: Organisation, now: number,
  organisations: readonly Organisation[]): string[] {
  const errors: string[] = [];
  const people = source.members.map((m) => m.person);
  if (!input.cause.trim()) errors.push("split requires a cause");
  if (!input.successors.length || new Set(input.successors).size !== input.successors.length
    || input.successors.some((id) => !organisations.some((org) => org.id === id))) errors.push("split requires distinct existing successors");
  if (input.choices.length !== people.length || new Set(input.choices.map((i) => i.person)).size !== people.length
    || people.some((person) => !input.choices.some((i) => i.person === person))) errors.push("every former member must choose exactly once");
  for (const choice of input.choices) {
    if (choice.t !== now || !people.includes(choice.person)
      || !(choice.kind === "join" && input.successors.includes(choice.target as OrgId)
        || choice.kind === "leave" && choice.target === source.id)) errors.push("invalid split choice");
    // Existing overlapping memberships cannot silently survive in two successors.
    if (input.successors.some((id) => id !== source.id && id !== choice.target
      && organisations.find((org) => org.id === id)?.members.some((m) => m.person === choice.person))) {
      errors.push("member already belongs to another successor");
    }
  }
  return errors;
}

/** Private store capability passed only while its Kernel transaction is open.
 * Observers never receive these mutable handles; public store reads are clones.
 */
export interface LifecycleHost {
  readonly now: number;
  readonly organisations: readonly Organisation[];
  readonly views: ViewsPort;
  find(id: OrgId): Organisation | undefined;
  remove(id: OrgId): void;
  members(org: Organisation, joins: readonly PersonId[], removals: readonly PersonId[]): void;
  emit(org: OrgId, kind: OrganisationEvent["kind"], cause: string,
    intentions?: readonly SocialIntention[], payload?: OrganisationEventPayload): OrganisationEvent;
  refuse(org: OrgId, cause: string, intentions?: readonly SocialIntention[]): OrganisationEvent;
  choose(org: Organisation, request: DecisionRequest): ChoiceEvent;
  join(org: Organisation, intention: SocialIntention): OrganisationEvent;
}

/** DESIGN section 1.4: called after an authorised act or loss of all members. */
export function dissolve(host: LifecycleHost, org: Organisation, cause: string,
  intentions: readonly SocialIntention[] = []): OrganisationEvent {
  host.members(org, [], org.members.map((m) => m.person));
  host.remove(org.id);
  for (const business of org.businesses) host.views.closeBusiness(business);
  host.views.onDissolved(org.id);
  return host.emit(org.id, "dissolved", cause, intentions);
}

export class SplitRefusal extends Error {}

/** DESIGN section 1.4: a passed act partitions members by expressed choices.
 * Unsettled resource claims are event data for Economy and Settlement.
 */
export function split(host: LifecycleHost, input: SplitInput, decision: DecisionRequest): OrganisationEvent {
  const intentions = [decision.proposal, ...decision.ballots, ...input.choices];
  const source = host.find(input.source);
  if (!source) return host.refuse(input.source, "split source does not exist", intentions);
  const errors = splitErrors(input, source, host.now, host.organisations);
  const proposed = decision.proposal.payload?.successors;
  if (decision.proposal.payload?.action !== "split" || !Array.isArray(proposed)
    || proposed.length !== input.successors.length || proposed.some((id, i) => id !== input.successors[i])
    || !source.charter.decision_procedure) errors.push("requires matching split proposal and procedure");
  if (errors.length) return host.refuse(source.id, errors.join("; "), intentions);
  const result = host.choose(source, decision);
  if (result.payload.outcome !== "accepted") return host.refuse(source.id, "split not passed", intentions);
  const before = source.members.map((m) => m.person);
  const businesses = [...source.businesses];
  const choices = [...input.choices].sort((a, b) => mintOrder(a.person, b.person));
  for (const choice of choices) {
    if (choice.kind === "join" && choice.target === source.id) continue;
    host.members(source, [], [choice.person]);
    host.emit(source.id, "left", input.cause, [choice]);
    if (choice.kind === "join") {
      const successor = host.find(choice.target as OrgId)!;
      if (!successor.members.some((m) => m.person === choice.person)) {
        const joined = host.join(successor, choice);
        if (joined.kind !== "joined") throw new SplitRefusal(joined.cause);
      }
    }
  }
  // Set partition check includes explicit exits and overlapping memberships.
  for (const person of before) {
    const count = input.successors.filter((id) => host.find(id)?.members.some((m) => m.person === person)).length;
    const left = choices.some((i) => i.person === person && i.kind === "leave");
    if (count !== (left ? 0 : 1)) throw new SplitRefusal("split membership conservation failed");
  }
  const event = host.emit(source.id, "split", input.cause, intentions, {
    successors: input.successors, left: choices.filter((i) => i.kind === "leave").map((i) => i.person),
    resourceClaims: { status: "unsettled", owners: ["Economy", "Settlement"], source: source.id,
      successors: input.successors.filter((id) => id !== source.id), businesses },
  });
  if (!source.members.length) dissolve(host, source, input.cause, intentions);
  return event;
}

/** DESIGN section 1.4: both actors must pass the same merger. Overlapping
 * members retain the survivor's membership; source offices expire. No new
 * organisation is created and resource settlement stays with the adapters.
 */
export function merge(host: LifecycleHost, survivingId: OrgId, sourceId: OrgId,
  decisions: readonly [DecisionRequest, DecisionRequest]): OrganisationEvent {
  const intentions = decisions.flatMap((d) => [d.proposal, ...d.ballots]);
  const survivor = host.find(survivingId), source = host.find(sourceId);
  if (!survivor || !source || survivor === source) return host.refuse(survivingId, "merge requires two existing actors", intentions);
  const results: ChoiceEvent[] = [];
  for (const [i, org] of [survivor, source].entries()) {
    const decision = decisions[i];
    if (!org.charter.decision_procedure || decision.proposal.payload?.action !== "merge"
      || decision.proposal.payload?.survivor !== survivingId || decision.proposal.payload?.source !== sourceId) return host.refuse(org.id, "requires matching merger proposals and procedures", intentions);
    results.push(host.choose(org, decision));
  }
  if (results.some((r) => r.payload.outcome !== "accepted")) return host.refuse(survivingId, "merger not passed by both organisations", results.flatMap((r) => r.intentions));
  host.members(survivor, source.members.map((m) => m.person).filter((p) => !survivor.members.some((m) => m.person === p)), []);
  host.members(source, [], source.members.map((m) => m.person));
  survivor.businesses.push(...source.businesses);
  survivor.businesses.sort(mintOrder);
  host.remove(sourceId);
  host.views.onMerged(sourceId, survivingId);
  return host.emit(survivingId, "merged", "passed merger in both organisations", results.flatMap((r) => r.intentions), { source: sourceId, survivor: survivingId });
}
