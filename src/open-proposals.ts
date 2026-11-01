import type { ChoiceEvent, PositionHolder } from "./choice.ts";
import type { DecisionProcedure, OrgId, PersonId, SocialIntention } from "./types.ts";

/** DESIGN §1.15.2: the half-open interval [proposal.t, closesAt) is charter
 * data. One expressed ballot per person; duplicate attempts are refused.
 * Attendance and removals survive clock advances and are never inferred votes.
 */
export interface OpenProposal {
  id: string;
  org: OrgId;
  proposal: SocialIntention;
  procedure: DecisionProcedure;
  closesAt: number;
  status: "open" | "resolved";
  ballots: SocialIntention[];
  present: PersonId[];
  removed: { person: PersonId; reason: "left" | "death" | "departure" }[];
  positions: PositionHolder[];
  result?: ChoiceEvent;
}

/** DESIGN §1.3 / IF-46: shared factual eligibility for offers and attempts.
 * Council scopes intersect before the nested rule is evaluated.
 */
export function choiceEligible(positions: readonly PositionHolder[], person: PersonId,
  procedure: DecisionProcedure, ballot: boolean, present: boolean): boolean {
  const holds = (roles: readonly string[]) => positions.some((p) => p.holder === person && roles.includes(p.role));
  let rule = procedure;
  while (rule.type === "council") {
    if (!holds(rule.roles)) return false;
    rule = rule.procedure;
  }
  if (rule.type === "position_holder") return !ballot || holds([rule.role]) && present;
  return (rule.eligibility.type === "members" || holds(rule.eligibility.roles))
    && (!ballot || rule.electorate === "all_members" || present);
}
