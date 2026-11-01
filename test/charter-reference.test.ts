import { describe, expect, it } from "vitest";
import reference from "../data/charters/reference.json" with { type: "json" };
import { validateCharter, validateReference } from "../src/charter.ts";
import type {
  Admission, Amendment, Benefit, Charter, CharterCapabilities, DecisionProcedure, Obligation, Parameter, Position,
  Sanction, Schedule,
} from "../src/types.ts";

/** Research-file fields; executable charter shape is DESIGN §1.2a / `src/types.ts`. */
const RESEARCH_META = new Set(["section", "stated", "label", "unit", "stated_schedule"]);

interface ReferenceComponent {
  readonly section: string;
  readonly label?: string;
  readonly stated?: string;
  readonly amount?: number | null;
  readonly [key: string]: unknown;
}

interface ReferenceEntry {
  readonly id: string;
  readonly kind?: string;
  readonly place?: string;
  readonly source: { readonly citation: string };
  readonly components: readonly ReferenceComponent[];
  readonly unmapped: readonly string[];
}

const entries = reference as readonly ReferenceEntry[];

/** Map a reference row to a typed charter draft (metadata stripped, no defaults). */
export function referenceEntryToCharter(entry: ReferenceEntry): Charter {
  const admission: Admission[] = [];
  const obligations: Obligation[] = [];
  const benefits: Benefit[] = [];
  const positions: Position[] = [];
  const sanctions: Sanction[] = [];
  let decision_procedure: DecisionProcedure | undefined;
  let amendment: Amendment | undefined;

  for (const raw of entry.components) {
    const component = Object.fromEntries(
      Object.entries(raw).filter(([key]) => !RESEARCH_META.has(key)),
    ) as Record<string, unknown>;
    switch (raw.section) {
      case "admission":
        admission.push(component as Admission);
        break;
      case "obligation":
        obligations.push(component as Obligation);
        break;
      case "benefit":
        benefits.push(component as Benefit);
        break;
      case "position":
        positions.push(component as Position);
        break;
      case "sanction":
        sanctions.push(component as Sanction);
        break;
      case "decision_procedure":
        decision_procedure = component as DecisionProcedure;
        break;
      case "amendment":
        amendment = component as Amendment;
        break;
      default:
        break;
    }
  }

  return {
    ...(admission.length > 0 ? { admission } : {}),
    ...(obligations.length > 0 ? { obligations } : {}),
    ...(benefits.length > 0 ? { benefits } : {}),
    ...(positions.length > 0 ? { positions } : {}),
    ...(sanctions.length > 0 ? { sanctions } : {}),
    ...(decision_procedure !== undefined ? { decision_procedure } : {}),
    ...(amendment !== undefined ? { amendment } : {}),
    ...(entry.kind !== undefined ? { kind: entry.kind } : {}),
    ...(entry.place !== undefined ? { name: entry.place } : {}),
  };
}

export function validationErrors(charter: Charter, capabilities: CharterCapabilities): string[] {
  try {
    return validateCharter(charter, capabilities);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [message];
  }
}

// Benefit `event` strings are reference vocabulary (SOURCES.md); future kernel wiring is noted per kind.
export const referenceCapabilities: CharterCapabilities = {
  events: [
    "age_60", // Life — age threshold (when Life exposes age milestones)
    "age_blindness_incurable_lameness", // Life — disability onset
    "death_of_approved_poor_member", // Society — membership status at death (observable act)
    "death_of_member", // Life — mortality
    "death_of_member_nominee", // Society — designated beneficiary chain
    "death_of_poor_member", // Life + Society — death of a member in need
    "death_of_wife", // Life — spouse mortality
    "dowry", // Economy — dowry payment episode
    "false_imprisonment", // Government — wrongful detention (observable)
    "hardship", // Society — founder-declared hardship trigger
    "long_sickness", // Life — prolonged illness
    "loss_by_robbery_fire_shipwreck", // Economy / Settlement — catastrophic loss
    "member_request", // Society — member petition act
    "misfortune", // Society — founder-declared misfortune trigger
    "need", // Society — demonstrated need (observable acts)
    "old_age_or_sickness", // Life — age or illness
    "pilgrimage", // Society — member journey act
    "poverty", // Economy / Settlement — insolvency signal
    "poverty_age_sickness_fire_water_theft", // composite hardship (Life, Economy, founder rule)
    "poverty_through_misfortune", // Society — poverty without fault
    "sickness", // Life — illness onset
    "sickness_away", // Life — illness away from home
    "wrongful_imprisonment", // Government — detention overturned (observable)
  ],
  ports: ["settlement.ledger", "economy.inventory"],
  procedures: ["simple_majority", "qualified_majority", "unanimity", "position_holder", "council"],
};

const scheduleFixture = { first: 0, period: 91 }; // fixture (test only)
const founderFounding = { window: 10, min_members: 1 }; // founder-supplied, not historical
const founderOpenAdmission = { type: "open" } as const satisfies Admission; // founder-supplied, not historical

function fixtureMajority(): DecisionProcedure {
  return {
    type: "simple_majority",
    base: "cast", // founder-supplied, not historical
    electorate: "present",
    eligibility: { type: "members" },
    quorum: { type: "count", value: 1 }, // fixture (test only)
  };
}

function fillQuorum(
  quorum: unknown,
): { readonly type: "count"; readonly value: number } | { readonly type: "fraction"; readonly value: number } {
  if (quorum && typeof quorum === "object" && !Array.isArray(quorum)) {
    const value = quorum as { readonly type?: string; readonly value?: Parameter };
    if (value.type === "fraction") {
      return {
        type: "fraction",
        value: typeof value.value === "number" && value.value > 0 ? value.value : 0.5, // fixture (test only)
      };
    }
    if (value.type === "count") {
      return {
        type: "count",
        value: typeof value.value === "number" && value.value > 0 ? value.value : 1, // fixture (test only)
      };
    }
  }
  return { type: "count", value: 1 }; // fixture (test only)
}

function fillProcedure(value: unknown): DecisionProcedure {
  if (value === null || value === undefined) return fixtureMajority();
  if (typeof value !== "object" || Array.isArray(value)) return fixtureMajority();
  const proc = value as Record<string, unknown>;
  if (typeof proc.type !== "string") return fixtureMajority();
  switch (proc.type) {
    case "position_holder":
      return {
        type: "position_holder",
        role: typeof proc.role === "string" && proc.role.trim() ? proc.role : "steward", // fixture (test only)
      };
    case "unanimity":
      return {
        type: "unanimity",
        electorate: proc.electorate === "all_members" ? "all_members" : "present",
        eligibility: proc.eligibility && typeof proc.eligibility === "object"
          && !Array.isArray(proc.eligibility) && (proc.eligibility as { type?: string }).type === "positions"
          ? proc.eligibility as Extract<DecisionProcedure, { type: "unanimity" }>["eligibility"]
          : { type: "members" },
        quorum: fillQuorum(proc.quorum),
      };
    case "qualified_majority":
      return {
        type: "qualified_majority",
        base: "cast", // founder-supplied, not historical
        electorate: proc.electorate === "all_members" ? "all_members" : "present",
        eligibility: proc.eligibility && typeof proc.eligibility === "object"
          && !Array.isArray(proc.eligibility) && (proc.eligibility as { type?: string }).type === "positions"
          ? proc.eligibility as Extract<DecisionProcedure, { type: "qualified_majority" }>["eligibility"]
          : { type: "members" },
        quorum: fillQuorum(proc.quorum),
        threshold: typeof proc.threshold === "number" && proc.threshold > 0 ? proc.threshold : 0.75, // fixture (test only)
      };
    case "council":
      return {
        type: "council",
        roles: Array.isArray(proc.roles) && proc.roles.length > 0
          ? proc.roles as string[]
          : ["council_member"], // fixture (test only)
        procedure: fillProcedure(proc.procedure),
      };
    case "simple_majority":
      return {
        type: "simple_majority",
        base: "cast", // founder-supplied, not historical
        electorate: proc.electorate === "all_members" ? "all_members" : "present",
        eligibility: proc.eligibility && typeof proc.eligibility === "object"
          && !Array.isArray(proc.eligibility) && (proc.eligibility as { type?: string }).type === "positions"
          ? proc.eligibility as Extract<DecisionProcedure, { type: "simple_majority" }>["eligibility"]
          : { type: "members" },
        quorum: fillQuorum(proc.quorum),
      };
    default:
      return fixtureMajority();
  }
}

function fillParameter(value: Parameter | string | null | undefined): Parameter | "indefinite" {
  if (value === "indefinite") return "indefinite";
  if (value === null || value === undefined) return 365; // fixture (test only)
  if (typeof value === "string") return 365; // fixture (test only)
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return 1; // fixture (test only)
}

function fillSchedule(value: Schedule | null | undefined): Schedule {
  if (value && typeof value === "object") {
    return {
      first: typeof value.first === "number" && Number.isFinite(value.first) ? value.first : 0, // fixture (test only)
      period: typeof value.period === "number" && value.period > 0 ? value.period : scheduleFixture.period,
    };
  }
  return scheduleFixture;
}

function fillAdmission(admission: Admission): Admission {
  switch (admission.type) {
    case "fee":
      return { type: "fee", amount: fillParameter(admission.amount) as number };
    case "sponsored":
      return { type: "sponsored", members: admission.members ?? 2 }; // fixture (test only)
    case "vote":
      return { type: "vote", procedure: fillProcedure(admission.procedure) };
    case "open":
    case "kinship":
    case "occupation":
      return admission;
    default:
      return admission;
  }
}

function fillObligation(obligation: Obligation): Obligation {
  switch (obligation.type) {
    case "dues":
      return {
        type: "dues",
        amount: fillParameter(obligation.amount) as number,
        schedule: fillSchedule(obligation.schedule),
      };
    case "attendance":
    case "service":
      return {
        ...obligation,
        schedule: fillSchedule(obligation.schedule),
        ...(obligation.type === "service"
          ? { hours: fillParameter(obligation.hours) as number }
          : {}),
      };
    case "exclusivity":
      return obligation;
    default:
      return obligation;
  }
}

function fillBenefit(benefit: Benefit): Benefit {
  switch (benefit.type) {
    case "transfer":
      return { type: "transfer", event: benefit.event, amount: fillParameter(benefit.amount) as number };
    case "loan":
      return {
        type: "loan",
        event: benefit.event,
        amount: fillParameter(benefit.amount) as number,
        repayment_period: fillParameter(benefit.repayment_period) as number,
      };
    case "goods":
      return {
        type: "goods",
        event: benefit.event,
        good: benefit.good,
        quantity: fillParameter(benefit.quantity) as number,
      };
    case "meeting":
      return { type: "meeting", activity: benefit.activity, schedule: fillSchedule(benefit.schedule) };
    default:
      return benefit;
  }
}

function fillPosition(position: Position): Position {
  const term = fillParameter(position.term);
  const raw = position as Position & { readonly type?: DecisionProcedure["type"] | null };
  const procedure = fillProcedure(raw.type == null ? null : position);
  return { ...procedure, position: position.position, term } as Position;
}

function fillSanction(sanction: Sanction): Sanction {
  const procedure = fillProcedure(sanction.procedure);
  switch (sanction.type) {
    case "fine":
      return { type: "fine", amount: fillParameter(sanction.amount) as number, procedure };
    case "suspension":
      return { type: "suspension", duration: fillParameter(sanction.duration) as number, procedure };
    case "expulsion":
      return { type: "expulsion", procedure };
    default:
      return sanction;
  }
}

function collectCouncilRoles(procedure: DecisionProcedure | undefined, rolesNeeded: Set<string>): void {
  if (!procedure) return;
  if (procedure.type === "council") {
    for (const role of procedure.roles) rolesNeeded.add(role);
    collectCouncilRoles(procedure.procedure, rolesNeeded);
    return;
  }
  if (procedure.type === "simple_majority" || procedure.type === "qualified_majority" || procedure.type === "unanimity") {
    if (procedure.eligibility.type === "positions") {
      for (const role of procedure.eligibility.roles) rolesNeeded.add(role);
    }
  }
}

function ensureCouncilRolePositions(charter: Charter): Charter {
  const rolesNeeded = new Set<string>();
  collectCouncilRoles(charter.decision_procedure, rolesNeeded);
  collectCouncilRoles(charter.amendment, rolesNeeded);
  charter.positions?.forEach((position) => collectCouncilRoles(position, rolesNeeded));
  charter.sanctions?.forEach((sanction) => collectCouncilRoles(sanction.procedure, rolesNeeded));
  charter.admission?.forEach((admission) => {
    if (admission.type === "vote") collectCouncilRoles(admission.procedure, rolesNeeded);
  });

  const names = new Set(charter.positions?.map((position) => position.position) ?? []);
  const added: Position[] = [];
  for (const role of rolesNeeded) {
    if (names.has(role)) continue;
    added.push({ ...fixtureMajority(), position: role, term: 365 }); // founder-supplied, not historical
    names.add(role);
  }
  if (added.length === 0) return charter;
  return { ...charter, positions: [...(charter.positions ?? []), ...added] };
}

/** Founder-completed draft: fixture nulls, required admission/founding/base (DESIGN §1.14 1). */
export function executableDraftFromReference(entry: ReferenceEntry): Charter {
  const partial = referenceEntryToCharter(entry);
  const draft: Charter = {
    ...partial,
    founding: founderFounding,
    admission: partial.admission?.length
      ? partial.admission.map(fillAdmission)
      : [founderOpenAdmission],
    ...(partial.obligations ? { obligations: partial.obligations.map(fillObligation) } : {}),
    ...(partial.benefits ? { benefits: partial.benefits.map(fillBenefit) } : {}),
    ...(partial.positions ? { positions: partial.positions.map(fillPosition) } : {}),
    ...(partial.sanctions ? { sanctions: partial.sanctions.map(fillSanction) } : {}),
    ...(partial.decision_procedure !== undefined
      ? { decision_procedure: fillProcedure(partial.decision_procedure) }
      : {}),
    ...(partial.amendment !== undefined ? { amendment: fillProcedure(partial.amendment) } : {}),
  };
  return ensureCouncilRolePositions(draft);
}

/** Components copied from reference rows; combination does not appear in any single entry. */
const novelFromReference: Charter = {
  founding: { window: 10, min_members: 1 }, // fixture (test only)
  kind: "unclassified",
  name: "Cross-reference fixture composition",
  admission: [
    { type: "fee", amount: 80 }, // ts-1389-london-garlekhith
    { type: "sponsored", members: 2 }, // ts-1389-lynn-shipmen
  ],
  benefits: [
    { type: "transfer", event: "old_age_or_sickness", amount: 14 }, // ts-1389-london-garlekhith
    { type: "goods", event: "sickness", good: "bread_and_ale", quantity: 1 }, // ts-1389-bishops-lynn-st-george-martyr
  ],
  obligations: [
    {
      type: "attendance",
      activity: "general meeting",
      schedule: scheduleFixture,
    }, // ts-1389-lynn-shipmen shape; schedule is fixture (test only)
  ],
};

function componentStatedLines(entry: ReferenceEntry): readonly string[] {
  return entry.components.map((component) => component.stated).filter((line): line is string => !!line);
}

describe("reference charter research file (DESIGN §1.2a, PLATFORM §11a)", () => {
  it("loads 27 historical reference compositions", () => {
    expect(entries).toHaveLength(27);
  });

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s cites a primary source",
    (_id, entry) => {
      expect(entry.source.citation.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s labels every component researched",
    (_id, entry) => {
      for (const [index, component] of entry.components.entries()) {
        expect(component.label, `components[${index}]`).toBe("researched");
      }
    },
  );

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s labels every amount field researched",
    (_id, entry) => {
      for (const [index, component] of entry.components.entries()) {
        if (!Object.prototype.hasOwnProperty.call(component, "amount")) continue;
        expect(component.label, `components[${index}].amount`).toBe("researched");
      }
    },
  );

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s keeps unmapped rules distinct from mapped statements",
    (_id, entry) => {
      const stated = new Set(componentStatedLines(entry));
      const seen = new Set<string>();
      for (const [index, line] of entry.unmapped.entries()) {
        expect(line.trim().length, `unmapped[${index}]`).toBeGreaterThan(0);
        expect(stated.has(line), `unmapped[${index}] duplicates a component stated line`).toBe(false);
        expect(seen.has(line), `unmapped[${index}] duplicates another unmapped line`).toBe(false);
        seen.add(line);
      }
    },
  );

  it("accepts a novel composition built from two reference charters", () => {
    expect(validateCharter(novelFromReference, referenceCapabilities)).toEqual([]);
  });

  it.each([referenceCapabilities, { ...referenceCapabilities, events: [], ports: [], procedures: [] }])(
    "renaming observer kind labels leaves validation verdicts unchanged",
    (capabilities) => {
      for (const entry of entries) {
        const baseline = referenceEntryToCharter(entry);
        const renamed = { ...baseline, kind: "x" };
        expect(validationErrors(renamed, capabilities)).toEqual(validationErrors(baseline, capabilities));
      }
      const renamedNovel = { ...novelFromReference, kind: "x" };
      expect(validateCharter(renamedNovel, referenceCapabilities))
        .toEqual(validateCharter(novelFromReference, referenceCapabilities));
    },
  );
});

describe("each reference composition validates when inputs exist (DESIGN §1.2a)", () => {
  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s passes validateReference on the research row",
    (_id, entry) => {
      expect(validateReference(entry)).toEqual([]);
    },
  );

  it.each(entries.map((entry) => [entry.id, entry] as const))(
    "%s passes validateCharter when fixture inputs and founder terms are supplied",
    (_id, entry) => {
      expect(validateCharter(executableDraftFromReference(entry), referenceCapabilities)).toEqual([]);
    },
  );
});
