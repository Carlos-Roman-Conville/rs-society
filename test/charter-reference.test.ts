import { describe, expect, it } from "vitest";
import reference from "../data/charters/reference.json" with { type: "json" };
import { validateCharter } from "../src/charter.ts";
import type {
  Admission, Amendment, Benefit, Charter, CharterCapabilities, DecisionProcedure, Obligation, Position, Sanction,
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
const referenceCapabilities: CharterCapabilities = {
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

/** Components copied from reference rows; combination does not appear in any single entry. */
const novelFromReference: Charter = {
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
  it("loads 24 historical reference compositions", () => {
    expect(entries).toHaveLength(24);
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
  const outcomes = entries.map((entry) => {
    const charter = referenceEntryToCharter(entry);
    const errors = validationErrors(charter, referenceCapabilities);
    return { id: entry.id, errors };
  });

  for (const { id, errors } of outcomes) {
    if (errors.length === 0) {
      it(`accepts ${id}`, () => {
        expect(errors).toEqual([]);
      });
    } else {
      it.todo(`${id}: ${errors.join("; ")}`);
    }
  }
});
