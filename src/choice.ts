import type { RandomStreams } from "@rex/kernel";
import type { Charter, DecisionProcedure, OrganisationEvent, OrgId, PersonId, SocialIntention } from "./types.ts";

export const CHOICE_PROCESS = "society.organisation.collective_choice";

/** DESIGN §1.3: amendment authority comes only from the amendment component,
 * never from the ordinary decision rule. Offers and attempts share this lookup.
 */
export function proposalProcedure(charter: Charter, payload: SocialIntention["payload"]): DecisionProcedure | undefined {
  if (payload?.action === "amend") return charter.amendment;
  if (payload?.action === "admit") return charter.admission?.find((r) => r.type === "vote")?.procedure;
  if (payload?.action === "elect") return charter.positions?.find((p) => p.position === payload.role);
  if (payload?.action === "sanction") return typeof payload.component === "number" && Number.isSafeInteger(payload.component)
    ? charter.sanctions?.[payload.component]?.procedure : undefined;
  return charter.decision_procedure;
}
export interface PositionHolder { readonly role: string; readonly holder: PersonId | null }
export interface ChoiceInput {
  readonly org: OrgId;
  readonly t: number;
  /** Host-assigned proposal identity; ballots must target this exact identity. */
  readonly proposalId: string;
  readonly proposal: SocialIntention;
  readonly intentions: readonly SocialIntention[];
  readonly members: readonly PersonId[];
  readonly present: readonly PersonId[];
  /** Includes vacant positions (holder: null). One holder per named position. */
  readonly positions: readonly PositionHolder[];
  readonly procedure: DecisionProcedure;
  readonly streams?: RandomStreams;
  /** An open ballot already checked its proposer at the opening attempt.
   * Departure later removes their vote, not the expressed proposal (§1.15.2).
   */
  readonly proposerValidated?: boolean;
  readonly removed?: readonly { person: PersonId; reason: "left" | "death" | "departure" }[];
}
export interface ChoiceTally {
  readonly eligible: readonly PersonId[];
  readonly present: readonly PersonId[];
  readonly electorate: readonly PersonId[];
  readonly support: readonly PersonId[];
  readonly oppose: readonly PersonId[];
  readonly abstain: readonly PersonId[];
  readonly unexpressed: readonly PersonId[];
  readonly excluded: readonly { person: PersonId; reason: "ineligible" | "absent" | "left" | "death" | "departure" }[];
  readonly denominator: number;
  readonly quorumRequired: number;
}
export type NoActReason = "no quorum" | "tie with no tie-break" | "ineligible proposer" | "no decision";
export type ChoiceEvent = OrganisationEvent & {
  readonly payload: {
    readonly proposalId: string;
    readonly outcome: "accepted" | "rejected" | "no_act";
    readonly reason?: NoActReason;
    readonly tally: ChoiceTally;
    readonly tieBreak?: { readonly type: "position_holder"; readonly person: PersonId }
      | { readonly type: "lots"; readonly draw: number };
  };
};

// Kernel ids retain numeric mint order beyond the four-digit padding.
function compare(a: string, b: string): number {
  const left = /^(.*\.)(\d+)$/.exec(a), right = /^(.*\.)(\d+)$/.exec(b);
  if (left && right && left[1] === right[1]) return Number(left[2]) - Number(right[2]);
  return a < b ? -1 : a > b ? 1 : 0;
}
function unique<T>(values: readonly T[], name: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${name}`);
}
function parameter(value: unknown, name: string, fraction: boolean): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0
    || (fraction ? value > 1 : !Number.isSafeInteger(value))) {
    throw new Error(`${name} requires ${fraction ? "a fraction in (0, 1]" : "a positive integer"}; no default`);
  }
  return value;
}
function validateProcedure(rule: DecisionProcedure, positions: readonly PositionHolder[]): void {
  const role = (name: string): void => {
    if (!name.trim() || !positions.some((p) => p.role === name)) throw new Error(`requires position ${name}`);
  };
  const roles = (names: readonly string[]): void => {
    if (!names.length) throw new Error("requires at least one position");
    names.forEach(role);
  };
  switch (rule.type) {
    case "position_holder": role(rule.role); return;
    case "council": roles(rule.roles); validateProcedure(rule.procedure, positions); return;
    case "simple_majority":
    case "qualified_majority":
    case "unanimity":
      if (rule.type !== "unanimity" && !["cast", "present", "members"].includes(rule.base)) {
        throw new Error("base requires cast, present or members; no default");
      }
      if (rule.electorate !== "present" && rule.electorate !== "all_members") throw new Error("invalid electorate");
      if (rule.eligibility.type === "positions") roles(rule.eligibility.roles);
      else if (rule.eligibility.type !== "members") throw new Error("invalid eligibility");
      if (rule.quorum.type !== "count" && rule.quorum.type !== "fraction") throw new Error("invalid quorum");
      parameter(rule.quorum.value, "quorum", rule.quorum.type === "fraction");
      if (rule.type === "qualified_majority") parameter(rule.threshold, "threshold", true);
      if (rule.type === "simple_majority" && rule.tie_break) {
        if (rule.tie_break.type === "position_holder") role(rule.tie_break.role);
        else if (rule.tie_break.type !== "lots") throw new Error("unsupported tie-break");
      }
      return;
    default: throw new Error("unsupported decision procedure");
  }
}

/** DESIGN §1.3 (May 1952; Arrow 1951, level 1).
 * DESIGN §1.14 2: majority base selects cast votes, eligible persons present,
 * or all eligible members. Simple requires > half; qualified >= its
 * supplied threshold; unanimity requires every elector's expressed support.
 * May's symmetric binary rule applies when every elector expresses a side.
 * All-member ballots may be remote; quorum always counts eligible attendance.
 * Councils restrict membership before applying the nested rule, one vote/person.
 * A named holder requires presence and a decisive expression; any member of
 * that scope may propose. Voting eligibility also governs who may propose.
 * Duplicate ballots are rejected: this API takes a resolved ballot snapshot,
 * never silently chooses which intention a person meant. No input is mutated.
 */
export function collectiveChoice(input: ChoiceInput): ChoiceEvent {
  const { proposal, procedure, positions } = input;
  if (!Number.isFinite(input.t) || !Number.isFinite(proposal.t) || proposal.t > input.t) throw new Error("invalid proposal time");
  if (proposal.kind !== "propose" || proposal.target !== input.org || !input.proposalId.trim()) {
    throw new Error("requires a propose intention targeting this organisation and a proposalId");
  }
  unique(input.members, "member"); unique(input.present, "attendance");
  unique(positions.map((p) => p.role), "position");
  for (const p of positions) if (p.holder !== null && !input.members.includes(p.holder)) throw new Error("position holder must be a member");
  validateProcedure(procedure, positions);
  const ballots = [...input.intentions].sort((a, b) => compare(a.person, b.person));
  unique(ballots.map((v) => v.person), "ballot");
  for (const v of ballots) {
    if (!["support", "oppose", "abstain"].includes(v.kind) || v.target !== input.proposalId) {
      throw new Error("requires support/oppose/abstain intentions targeting this proposal");
    }
    if (!Number.isFinite(v.t) || v.t < proposal.t || v.t > input.t) throw new Error("invalid ballot time");
  }
  const holders = (roles: readonly string[], scope: readonly PersonId[]): PersonId[] =>
    scope.filter((person) => positions.some((p) => roles.includes(p.role) && p.holder === person));
  let rule = procedure;
  let scope = [...input.members].sort(compare);
  while (rule.type === "council") {
    scope = holders(rule.roles, scope);
    rule = rule.procedure;
  }
  const proposers = rule.type === "position_holder" || rule.eligibility.type === "members"
    ? scope : holders(rule.eligibility.roles, scope);
  const eligible = rule.type === "position_holder" ? holders([rule.role], scope) : proposers;
  const present = eligible.filter((person) => input.present.includes(person));
  const electorate = rule.type === "position_holder" || rule.electorate === "present" ? present : eligible;
  const votes = ballots.filter((v) => electorate.includes(v.person));
  // DESIGN §1.3: a fractional quorum is a fraction of the eligible membership.
  let quorumRequired = rule.type === "position_holder" ? 1
    : rule.quorum.type === "count" ? rule.quorum.value! : Math.ceil(rule.quorum.value! * eligible.length);
  // Use the same ratio comparison as qualified majority at floating boundaries.
  if (rule.type !== "position_holder" && rule.quorum.type === "fraction" && eligible.length
    && (quorumRequired - 1) / eligible.length >= rule.quorum.value!) quorumRequired--;
  const tally: ChoiceTally = {
    eligible, present, electorate,
    support: votes.filter((v) => v.kind === "support").map((v) => v.person),
    oppose: votes.filter((v) => v.kind === "oppose").map((v) => v.person),
    abstain: votes.filter((v) => v.kind === "abstain").map((v) => v.person),
    unexpressed: electorate.filter((person) => !votes.some((v) => v.person === person)),
    excluded: [...ballots.filter((v) => !electorate.includes(v.person) && !input.removed?.some((r) => r.person === v.person)).map((v) => ({
      person: v.person, reason: eligible.includes(v.person) ? "absent" : "ineligible",
    } as const)), ...(input.removed ?? [])].sort((a, b) => compare(a.person, b.person)),
    // DESIGN §1.14 2 (keeper ruling): councils use their scoped nested rule.
    denominator: rule.type === "position_holder" || rule.type === "unanimity" ? electorate.length
      : rule.base === "cast" ? votes.filter((v) => v.kind !== "abstain").length
      : rule.base === "present" ? present.length : eligible.length,
    quorumRequired,
  };
  const event = (outcome: ChoiceEvent["payload"]["outcome"], reason?: NoActReason,
    tieBreak?: ChoiceEvent["payload"]["tieBreak"]): ChoiceEvent => ({
    org: input.org, t: input.t, kind: outcome === "no_act" ? "refused" : "act", cause: CHOICE_PROCESS,
    intentions: [proposal, ...ballots],
    payload: { proposalId: input.proposalId, outcome, tally, ...(reason ? { reason } : {}), ...(tieBreak ? { tieBreak } : {}) },
  });
  if (!input.proposerValidated && !proposers.includes(proposal.person)) return event("no_act", "ineligible proposer");
  if (!electorate.length || !present.length || present.length < quorumRequired) return event("no_act", "no quorum");
  const yes = tally.support.length, no = tally.oppose.length, total = tally.denominator;
  if (rule.type === "position_holder") {
    return yes ? event("accepted") : no ? event("rejected") : event("no_act", "no decision");
  }
  // DESIGN §1.3: inclusive qualified threshold; compare ratios without rounding
  // the threshold product upward (e.g. 0.14 * 100 may round above 14).
  if (rule.type === "qualified_majority") return event(yes / total >= rule.threshold! ? "accepted" : "rejected");
  if (rule.type === "unanimity") return event(yes === total ? "accepted" : "rejected");
  if (yes !== no) return event(yes > total / 2 ? "accepted" : "rejected");
  if (!rule.tie_break) return event("no_act", "tie with no tie-break");
  if (rule.tie_break.type === "position_holder") {
    const role = rule.tie_break.role;
    const person = positions.find((p) => p.role === role)!.holder;
    if (person === null || !eligible.includes(person) || !input.present.includes(person)) return event("no_act", "no decision");
    const ballot = votes.find((v) => v.person === person);
    if (!ballot || ballot.kind === "abstain") return event("no_act", "no decision");
    return event(ballot.kind === "support" ? "accepted" : "rejected", undefined, { type: "position_holder", person });
  }
  if (!input.streams) throw new Error("lots tie-break requires Kernel streams");
  // DESIGN §1.3 failure mode: equal lots over the two alternatives, only by rule.
  const draw = input.streams.get(CHOICE_PROCESS, input.org)();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error("invalid Kernel random draw");
  return event(draw < 1 / 2 ? "accepted" : "rejected", undefined, { type: "lots", draw });
}

export interface PairwiseChoiceInput extends Omit<ChoiceInput, "proposalId" | "proposal" | "intentions" | "streams"> {
  readonly procedure: Extract<DecisionProcedure, { type: "simple_majority" }>;
  /** Array order is the proposals' mint/creation order; no agenda is inferred. */
  readonly proposals: readonly { id: string; intention: SocialIntention }[];
  /** Exactly one comparison per unordered pair; support chooses first, oppose second. */
  readonly comparisons: readonly { first: string; second: string; intentions: readonly SocialIntention[] }[];
}
export type PairwiseChoiceEvent = OrganisationEvent & {
  readonly payload: {
    readonly outcome: "accepted" | "no_act";
    readonly winner?: string;
    readonly reason?: NoActReason | "majority cycle" | "no pairwise winner";
    readonly cycle?: readonly string[];
    readonly comparisons: readonly { first: string; second: string; event: ChoiceEvent }[];
  };
};

/** DESIGN §1.3 / Arrow 1951: inspect the complete pairwise majority relation.
 * A strict majority edge requires > half the declared electorate on that side.
 * Report a directed cycle before considering a winner; never impose an agenda
 * or use binary tie-breaks to manufacture a transitive collective preference.
 */
export function pairwiseCollectiveChoice(input: PairwiseChoiceInput): PairwiseChoiceEvent {
  if (input.procedure.type !== "simple_majority" || input.procedure.tie_break) throw new Error("pairwise analysis requires simple majority without a tie-break");
  const ids = input.proposals.map((p) => p.id);
  if (ids.length < 2) throw new Error("requires at least two proposals");
  unique(ids, "proposal");
  const results: { first: string; second: string; event: ChoiceEvent }[] = [];
  const edges = ids.map(() => [] as number[]);
  let ineligibleProposer = false;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const pair = input.comparisons.filter((c) => (c.first === ids[i] && c.second === ids[j]) || (c.second === ids[i] && c.first === ids[j]));
    if (pair.length !== 1) throw new Error("requires exactly one comparison per pair");
    const c = pair[0];
    const first = input.proposals.find((p) => p.id === c.first)!;
    const second = input.proposals.find((p) => p.id === c.second)!;
    if (c.intentions.some((v) => v.t < second.intention.t)) throw new Error("ballot predates compared proposal");
    const event = collectiveChoice({ ...input, proposalId: first.id, proposal: first.intention, intentions: c.intentions });
    // Check both proposers through the same eligibility rule, retaining original acts.
    const other = collectiveChoice({ ...input, proposalId: second.id, proposal: second.intention, intentions: [] });
    ineligibleProposer ||= other.payload.reason === "ineligible proposer" || event.payload.reason === "ineligible proposer";
    results.push({ first: c.first, second: c.second, event });
    const tally = event.payload.tally;
    if (event.kind === "act") {
      if (tally.support.length > tally.denominator / 2) edges[ids.indexOf(c.first)].push(ids.indexOf(c.second));
      if (tally.oppose.length > tally.denominator / 2) edges[ids.indexOf(c.second)].push(ids.indexOf(c.first));
    }
  }
  if (results.length !== input.comparisons.length) throw new Error("unknown or duplicate pairwise comparison");
  const finish = (payload: PairwiseChoiceEvent["payload"]): PairwiseChoiceEvent => ({
    org: input.org, t: input.t, kind: payload.outcome === "accepted" ? "act" : "refused", cause: CHOICE_PROCESS,
    intentions: [...input.proposals.map((p) => p.intention), ...results.flatMap((r) => r.event.intentions.slice(1))], payload,
  });
  if (ineligibleProposer) return finish({ outcome: "no_act", reason: "ineligible proposer", comparisons: results });
  const blocked = results.find((r) => r.event.payload.reason === "no quorum");
  if (blocked) return finish({ outcome: "no_act", reason: blocked.event.payload.reason, comparisons: results });
  const visited = new Set<number>(), active: number[] = [];
  const visit = (node: number): number[] | undefined => {
    const index = active.indexOf(node);
    if (index >= 0) return [...active.slice(index), node];
    if (visited.has(node)) return;
    visited.add(node); active.push(node);
    for (const next of edges[node].sort((a, b) => a - b)) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    active.pop();
  };
  for (let i = 0; i < ids.length; i++) {
    const cycle = visit(i);
    if (cycle) return finish({ outcome: "no_act", reason: "majority cycle", cycle: cycle.map((n) => ids[n]), comparisons: results });
  }
  const winner = edges.findIndex((outgoing) => outgoing.length === ids.length - 1);
  return winner >= 0 ? finish({ outcome: "accepted", winner: ids[winner], comparisons: results })
    : finish({ outcome: "no_act", reason: "no pairwise winner", comparisons: results });
}
