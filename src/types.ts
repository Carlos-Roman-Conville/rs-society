import { mint, type Counters } from "@rex/kernel";

declare const entityId: unique symbol;
type Id<Entity extends string> = string & { readonly [entityId]: Entity };
export type PersonId = Id<"person">;
export type HouseholdId = Id<"household">;
export type OrgId = Id<"org">;
export type TieId = Id<"tie">;

type Ids = { person: PersonId; household: HouseholdId; org: OrgId; tie: TieId };

/** DESIGN §2.1: counters belong to the caller; mint order comes from Kernel. */
export function mintId<Entity extends keyof Ids>(
  counters: Counters,
  entity: Entity,
): { id: Ids[Entity]; counters: Counters } {
  const result = mint(counters, entity);
  return { id: result.id as Ids[Entity], counters: result.counters };
}

/** DESIGN §1.1: relationship facts, with no mind state on the link. */
export type TieKind =
  | "kin" | "household" | "neighbour" | "co-worker" | "trade"
  | `co-member:${OrgId}` | "patron" | "secret";

export type SocialIntentionKind =
  | "join" | "leave" | "found" | "propose" | "support" | "oppose" | "abstain"
  | "pay" | "attend" | "participate" | "marry" | "move"
  | "seek_contact" | "avoid_contact";

/** DESIGN §2.2: expressed acts only; payload carries action-specific data. */
export interface SocialIntention {
  readonly person: PersonId;
  readonly kind: SocialIntentionKind;
  readonly target?: string;
  readonly t: number;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface Affordance {
  readonly person: PersonId;
  readonly kind: SocialIntentionKind | "stand";
  readonly target: string;
  readonly terms: Readonly<Record<string, unknown>>;
}

/** DESIGN §1.2–§1.4: observable outcomes retain their cause and source acts. */
export interface OrganisationEventPayload extends Readonly<Record<string, unknown>> {
  /** Execution evidence, emitted only after the chosen sanction succeeds. */
  readonly sanctionApplied?: boolean;
  /** Amount actually transferred under a dues or admission revenue rule. */
  readonly revenueCollected?: number;
}

export interface OrganisationEvent {
  readonly org: OrgId;
  readonly kind: "founded" | "joined" | "left" | "expelled" | "office_changed"
    | "act" | "merged" | "split" | "dissolved" | "refused";
  readonly t: number;
  readonly cause: string;
  readonly intentions: readonly SocialIntention[];
  readonly payload?: OrganisationEventPayload;
}

// DESIGN §1.2a–§1.3: all amounts, periods, terms, counts and thresholds below
// are founder-supplied rule parameters, not calibrated engine constants.
// null represents a missing parameter and must be rejected before execution.
// Times/durations use the caller's Kernel clock units; service hours are hours.
export type Parameter = number | null;
export type Eligibility =
  | { readonly type: "members" }
  | { readonly type: "positions"; readonly roles: readonly string[] };
export type Quorum =
  | { readonly type: "count"; readonly value: Parameter }
  | { readonly type: "fraction"; readonly value: Parameter };

interface VotingConditions {
  readonly electorate: "present" | "all_members";
  readonly eligibility: Eligibility;
  readonly quorum: Quorum;
}

/** DESIGN §1.14 2: founder-supplied majority denominator, with no default. */
export type MajorityBase = "cast" | "present" | "members";

/** DESIGN §1.3; councils recursively use one of the same decision rules. */
export type DecisionProcedure =
  | { readonly type: "position_holder"; readonly role: string }
  | ({ readonly type: "simple_majority"; readonly base: MajorityBase; readonly tie_break?:
      | { readonly type: "position_holder"; readonly role: string }
      | { readonly type: "lots" }
      | { readonly type: "no_act" } } & VotingConditions)
  | ({ readonly type: "qualified_majority"; readonly base: MajorityBase; readonly threshold: Parameter } & VotingConditions)
  | ({ readonly type: "unanimity" } & VotingConditions)
  | { readonly type: "council"; readonly roles: readonly string[]; readonly procedure: DecisionProcedure };

export type Admission =
  | { readonly type: "open" }
  | { readonly type: "sponsored"; readonly members: Parameter }
  | { readonly type: "vote"; readonly procedure: DecisionProcedure }
  | { readonly type: "kinship"; readonly relation: string }
  // Occupation facts are supplied by a host port; no engine is imported here.
  | { readonly type: "occupation"; readonly occupation: string; readonly port: string }
  | { readonly type: "fee"; readonly amount: Parameter };

export interface Schedule {
  readonly first: Parameter;
  readonly period: Parameter;
}

export type Obligation =
  | { readonly type: "dues"; readonly amount: Parameter; readonly schedule: Schedule }
  | { readonly type: "attendance"; readonly activity: string; readonly schedule: Schedule }
  | { readonly type: "service"; readonly activity: string; readonly hours: Parameter; readonly schedule: Schedule }
  | { readonly type: "exclusivity"; readonly organisations: readonly OrgId[] };

export type Benefit =
  | { readonly type: "transfer"; readonly event: string; readonly amount: Parameter }
  | { readonly type: "goods"; readonly event: string; readonly good: string; readonly quantity: Parameter }
  | { readonly type: "meeting"; readonly activity: string; readonly schedule: Schedule }
  | { readonly type: "loan"; readonly event: string; readonly amount: Parameter; readonly repayment_period: Parameter };

/** A position's discriminant is its filling procedure (DESIGN §1.2a). */
export type Position = DecisionProcedure & {
  readonly position: string;
  readonly term: Parameter | "indefinite";
};

/** Sanctions require a chosen act, never an automatic consequence (§1.2). */
export type Sanction = (
  | { readonly type: "fine"; readonly amount: Parameter }
  | { readonly type: "suspension"; readonly duration: Parameter }
  | { readonly type: "expulsion" }
) & { readonly procedure: DecisionProcedure };

/** Amendments use their own §1.3 procedure, not an assigned default. */
export type Amendment = DecisionProcedure;

/**
 * DESIGN §1.2a: partial drafts are representable, but admission must be nonempty
 * to validate. Optional mechanisms are absent, never silently supplied.
 * kind/name are observer metadata only, including on individual components.
 */
export interface Charter {
  /** DESIGN §1.4: founder-supplied duration (Kernel milliseconds) and minimum. */
  readonly founding?: { readonly window: Parameter; readonly min_members: Parameter };
  readonly kind?: string;
  readonly name?: string;
  readonly admission?: readonly Admission[];
  readonly obligations?: readonly Obligation[];
  readonly benefits?: readonly Benefit[];
  readonly decision_procedure?: DecisionProcedure;
  /** DESIGN §1.15 ruling 2: founder-supplied ballot duration in Kernel ms.
   * Omission retains same-tick decisions; an explicit null is invalid.
   */
  readonly decision_interval?: Parameter;
  readonly positions?: readonly Position[];
  readonly sanctions?: readonly Sanction[];
  readonly amendment?: Amendment;
}

export interface CharterCapabilities {
  readonly events: readonly string[];
  readonly ports: readonly string[];
  readonly procedures: readonly DecisionProcedure["type"][];
}
