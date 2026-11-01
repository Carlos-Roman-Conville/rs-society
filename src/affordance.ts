import { simTime } from "@rex/kernel";
import { FORMATION_PROCESS, mintOrder, type FoundIntention } from "./formation.ts";
import type { NetworkTie, Pair } from "./network.ts";
import type { DueObligation, Organisation } from "./organisation.ts";
import type { LedgerPort, OrganisationFacts } from "./ports.ts";
import type { Affordance, DecisionProcedure, OrgId, PersonId, SocialIntention } from "./types.ts";

export const AFFORDANCE_PROCESS = "society.affordance.offer";

export type OfferSource =
  | { readonly row: "society.organisation"; readonly id: OrgId }
  | { readonly row: "society.institution.formation_dissolution"; readonly id: string }
  | { readonly row: "society.comm_network"; readonly id: string }
  | { readonly row: "society.household" | "society.population"; readonly id: string };

export interface SocialOffer extends Affordance {
  readonly source: OfferSource;
  readonly t: number;
  /** Action arguments, separate from the source's descriptive terms. */
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface OfferProposal {
  readonly id: string;
  readonly proposal: SocialIntention;
  readonly status: "open" | "resolved";
}
export interface FoundingCircle {
  readonly intention: FoundIntention;
  readonly status: "open" | "resolved";
  readonly joins: readonly SocialIntention[];
}
export interface OfferAttendance {
  readonly org: OrgId;
  readonly person: PersonId;
  readonly activity: string;
  readonly t: number;
}

/** A current host snapshot. Pending proposals/circles are expressed intentions,
 * not actors. Known pairs are directed observed acquaintance facts, not all
 * registered people. The ledger remains owned by Settlement (DESIGN §2.3).
 */
export interface AffordanceState {
  readonly organisations: readonly Organisation[];
  readonly obligations: readonly DueObligation[];
  readonly attendance: readonly OfferAttendance[];
  readonly proposals: readonly OfferProposal[];
  readonly foundingCircles: readonly FoundingCircle[];
  readonly network: { readonly known: readonly Pair[]; readonly ties: readonly NetworkTie[] };
  readonly ledger: Pick<LedgerPort, "balance">;
  readonly facts: OrganisationFacts;
  readonly unavailable: readonly PersonId[];
}

/** Typed extension points: households (§1.6) and migration (§1.8) are not built. */
export function householdOffers(_person: PersonId, _t: number, _state: AffordanceState): readonly SocialOffer[] { return []; }
export function migrationOffers(_person: PersonId, _t: number, _state: AffordanceState): readonly SocialOffer[] { return []; }

function active(org: Organisation, person: PersonId): boolean {
  return org.members.some((m) => m.person === person && m.standing === "active");
}

/** DESIGN §1.2a: conjunctive factual admission terms. A vote is a possible
 * application, never a predicted approval; attempt still requires its decision.
 */
function canApply(org: Organisation, person: PersonId, t: number, state: AffordanceState): boolean {
  if (!org.charter.admission?.length) return false;
  let fees = 0;
  for (const rule of org.charter.admission) {
    switch (rule.type) {
      case "open": case "vote": break;
      case "fee":
        if (rule.amount === null) throw new Error("admission fee requires an amount; no default");
        fees += rule.amount;
        break;
      case "sponsored": {
        if (rule.members === null) throw new Error("sponsored admission requires members; no default");
        if (!state.facts.sponsors) throw new Error("admission requires current sponsor facts");
        const sponsors = new Set(state.facts.sponsors(person, org.id, t));
        if ([...sponsors].filter((p) => active(org, p)).length < rule.members) return false;
        break;
      }
      case "kinship":
        if (!state.facts.kinship) throw new Error("admission requires current kinship facts");
        if (!org.members.some((m) => state.facts.kinship!(person, m.person, rule.relation, t))) return false;
        break;
      case "occupation":
        if (!state.facts.occupation) throw new Error("admission requires current occupation facts");
        if (!state.facts.occupation(person, rule.port, rule.occupation, t)) return false;
        break;
    }
  }
  if ((org.charter.obligations ?? []).some((o) => o.type === "exclusivity"
    && state.organisations.some((other) => o.organisations.includes(other.id) && other.members.some((m) => m.person === person)))) return false;
  return Number.isFinite(fees) && fees <= state.ledger.balance(person);
}

/** DESIGN §1.3: eligibility only; no tally, quorum decision, or outcome. */
function eligible(org: Organisation, person: PersonId, procedure: DecisionProcedure, ballot: boolean, present: boolean): boolean {
  const holds = (roles: readonly string[]) => org.positions.some((p) => p.holder === person && roles.includes(p.role));
  let rule = procedure;
  while (rule.type === "council") {
    if (!holds(rule.roles)) return false;
    rule = rule.procedure;
  }
  if (rule.type === "position_holder") return !ballot || holds([rule.role]) && present;
  return (rule.eligibility.type === "members" || holds(rule.eligibility.roles))
    && (!ballot || rule.electorate === "all_members" || present);
}

function procedureFor(org: Organisation, payload?: Readonly<Record<string, unknown>>): DecisionProcedure | undefined {
  if (payload?.action === "admit") return org.charter.admission?.find((r) => r.type === "vote")?.procedure;
  if (payload?.action === "elect") return org.charter.positions?.find((p) => p.position === payload.role);
  if (payload?.action === "sanction" && typeof payload.component === "number") return org.charter.sanctions?.[payload.component]?.procedure;
  return org.charter.decision_procedure;
}

/** DESIGN §1.13, §2.2 (IF-46): the single writer's pure projection, rebuilt on
 * every call. Offering is not choosing. Terms describe sources; the host must
 * deliver charter observations/testimony separately, and recheck every attempt.
 * Organisations must be validated live records, advanced to t by their owner.
 */
export function offers(person: PersonId, t: number, state: AffordanceState): readonly SocialOffer[] {
  simTime(t);
  if (state.unavailable.includes(person)) return [];
  const result: SocialOffer[] = [];
  const add = (kind: SocialOffer["kind"], target: string, source: OfferSource,
    terms: SocialOffer["terms"], payload?: SocialOffer["payload"]) => {
    result.push({ person, kind, target, source, t, terms, ...(payload ? { payload } : {}) });
  };
  for (const org of [...state.organisations].sort((a, b) => mintOrder(a.id, b.id))) {
    const source: OfferSource = { row: "society.organisation", id: org.id };
    const terms = { charter: org.charter };
    if (!org.members.some((m) => m.person === person)) {
      if (canApply(org, person, t, state)) add("join", org.id, source, terms);
      continue;
    }
    add("leave", org.id, source, terms);
    for (const due of [...state.obligations].sort((a, b) => a.component - b.component || a.due_at - b.due_at)) {
      const rule = org.charter.obligations?.[due.component];
      if (due.org === org.id && due.person === person && due.status === "unpaid" && due.due_at <= t && rule?.type === "dues") {
        add("pay", org.id, source, { ...terms, obligation: rule }, { component: due.component, due_at: due.due_at });
      }
    }
    if (!active(org, person)) continue;
    const attendance = state.attendance.filter((a) => a.org === org.id && a.person === person && a.t === t);
    const activities = new Set<string>();
    for (const meeting of org.schedule) {
      // DESIGN §1.2: a meeting occurs at first + n * period, for integer n >= 0.
      if (t >= meeting.first && (t - meeting.first) % meeting.period === 0
        && !activities.has(meeting.activity) && !attendance.some((a) => a.activity === meeting.activity)) {
        activities.add(meeting.activity);
        add("attend", org.id, source, { ...terms, meeting }, { activity: meeting.activity });
      }
    }
    const proposals = [
      { procedure: org.charter.decision_procedure, payload: { action: "act" } },
      ...(org.charter.positions ?? []).map((p) => ({ procedure: p, payload: { action: "elect", role: p.position } })),
      ...(org.charter.sanctions ?? []).map((s, component) => ({ procedure: s.procedure, payload: { action: "sanction", component } })),
    ];
    for (const { procedure, payload } of proposals) {
      if (procedure && eligible(org, person, procedure, false, attendance.length > 0)) {
        add("propose", org.id, source, { ...terms, procedure }, payload);
      }
    }
    for (const entry of [...state.proposals].sort((a, b) => mintOrder(a.id, b.id))) {
      if (entry.status !== "open" || entry.proposal.kind !== "propose" || entry.proposal.target !== org.id || entry.proposal.t > t) continue;
      const procedure = procedureFor(org, entry.proposal.payload);
      if (!procedure || !eligible(org, person, procedure, true, attendance.length > 0)) continue;
      for (const kind of ["support", "oppose", "abstain"] as const) {
        add(kind, entry.id, source, { ...terms, proposal: entry.proposal, procedure });
      }
    }
  }
  // A generic found candidate invites a person to supply their own draft; it
  // never manufactures a charter or founders. Its target is the source process
  // until the caller assigns a fresh draft identity (DESIGN §1.4).
  add("found", FORMATION_PROCESS, { row: FORMATION_PROCESS, id: FORMATION_PROCESS }, {});
  for (const circle of [...state.foundingCircles].sort((a, b) => mintOrder(a.intention.target, b.intention.target))) {
    const intention = circle.intention;
    const window = intention.payload.charter.founding?.window;
    if (circle.status !== "open" || !intention.payload.founders.includes(person)) continue;
    if (window == null) throw new Error("founding circle requires window; no default");
    if (t < intention.t || t > intention.t + window || circle.joins.some((j) => j.person === person
      && j.kind === "join" && j.target === intention.target && j.t >= intention.t && j.t <= t)) continue;
    add("join", intention.target, { row: FORMATION_PROCESS, id: intention.target }, intention.payload);
  }
  const known = new Set(state.network.known.filter((p) => p.i === person).map((p) => p.j));
  for (const tie of state.network.ties) {
    if (tie.i === person) known.add(tie.j);
    if (tie.j === person) known.add(tie.i);
  }
  for (const other of [...known].sort(mintOrder)) {
    if (other !== person && !state.unavailable.includes(other)) {
      add("seek_contact", other, { row: "society.comm_network", id: other }, {});
    }
  }
  for (const tie of [...state.network.ties].sort((a, b) => mintOrder(a.id, b.id))) {
    if (tie.i === person && tie.j !== person && !state.unavailable.includes(tie.j)) {
      add("avoid_contact", tie.j, { row: "society.comm_network", id: tie.id }, { tie });
    }
  }
  result.push(...householdOffers(person, t, state), ...migrationOffers(person, t, state));
  return structuredClone(result);
}
