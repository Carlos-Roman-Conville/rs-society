import { describe, expect, it } from "vitest";
import { validateCharter } from "../src/charter.ts";
import { mintId, type Charter, type CharterCapabilities, type DecisionProcedure } from "../src/types.ts";

// All amounts, times, counts and thresholds in this file are fixture (test only).
const founding = { window: 10, min_members: 1 }; // fixture (test only)
const schedule = { first: 0, period: 7 };
const vote = {
  type: "simple_majority", base: "present", // fixture (test only)
  electorate: "present", eligibility: { type: "members" },
  quorum: { type: "count", value: 1 },
} as const satisfies DecisionProcedure;
const qualified = { ...vote, type: "qualified_majority", threshold: 0.75 } as const;
const unanimous = { ...vote, type: "unanimity", electorate: "all_members" } as const;
const holder = { type: "position_holder", role: "steward" } as const;
const council = { type: "council", roles: ["steward"], procedure: qualified } as const;
const position = { ...vote, position: "steward", term: 30 } as const;
const open: Charter = { founding, admission: [{ type: "open" }] };
const capabilities: CharterCapabilities = {
  events: ["life.death", "life.illness_onset"],
  ports: ["settlement.ledger", "economy.inventory", "fixture.occupation"],
  procedures: ["simple_majority", "qualified_majority", "unanimity", "position_holder", "council"],
};

// Deliberately invented composition, not selected from any historical catalogue.
const novel: Charter = {
  founding, // fixture (test only)
  name: "Fixture night gardeners", kind: "unclassified",
  admission: [
    { type: "open" }, { type: "sponsored", members: 2 },
    { type: "vote", procedure: council }, { type: "kinship", relation: "sibling" },
    { type: "occupation", occupation: "gardener", port: "fixture.occupation" },
    { type: "fee", amount: 3 },
  ],
  obligations: [
    { type: "dues", amount: 1, schedule },
    { type: "attendance", activity: "night gardening", schedule },
    { type: "service", activity: "repair", hours: 2, schedule },
    { type: "exclusivity", organisations: [mintId({}, "org").id] },
  ],
  benefits: [
    { type: "transfer", event: "life.illness_onset", amount: 4 },
    { type: "goods", event: "life.death", good: "seeds", quantity: 2 },
    { type: "meeting", activity: "stargazing", schedule },
    { type: "loan", event: "life.death", amount: 5, repayment_period: 90 },
  ],
  decision_procedure: holder,
  positions: [position],
  sanctions: [
    { type: "fine", amount: 1, procedure: vote },
    { type: "suspension", duration: 7, procedure: unanimous },
    { type: "expulsion", procedure: council },
  ],
  amendment: unanimous,
};

describe("charter composition (DESIGN §1.2a)", () => {
  it("accepts a novel composition when every component input exists", () => {
    expect(validateCharter(novel, capabilities)).toEqual([]);
  });

  it("accepts open admission without inventing obligations or decision rules", () => {
    expect(validateCharter(open, { events: [], ports: [], procedures: [] })).toEqual([]);
  });

  // DESIGN §1.14 3
  it.each([{ founding }, { founding, admission: [] }])("rejects missing or empty admission: %j", (charter) => {
    expect(validateCharter(charter, capabilities)).toEqual([
      "admission: requires at least one admission rule",
    ]);
  });

  it.each([capabilities, { ...capabilities, events: [], ports: [], procedures: [] }])(
    "renaming a charter leaves both valid and invalid verdicts unchanged",
    (available) => {
      expect(validateCharter({ ...novel, kind: "arbitrary", name: "Unknown form" }, available))
        .toEqual(validateCharter(novel, available));
    },
  );

  it("never reads kind or name, even on nested components", () => {
    function guard(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(guard);
      if (value === null || typeof value !== "object") return value;
      const copy = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, guard(entry)]));
      for (const field of ["kind", "name"]) {
        Object.defineProperty(copy, field, { get: () => { throw new Error(`read ${field}`); } });
      }
      return copy;
    }
    expect(validateCharter(guard(novel) as Charter, capabilities)).toEqual([]);
  });

  it("does not mutate the draft or capability declarations", () => {
    const before = structuredClone({ novel, capabilities });
    validateCharter(novel, capabilities);
    expect({ novel, capabilities }).toEqual(before);
  });

  it.each([
    ["admission[0]", { founding, admission: [{ type: "unknown" }] }],
    ["obligations[0]", { ...open, obligations: [{ type: "unknown" }] }],
    ["benefits[0]", { ...open, benefits: [{ type: "unknown" }] }],
    ["decision_procedure", { ...open, decision_procedure: { type: "unknown" } }],
    ["sanctions[0]", { ...open, sanctions: [{ type: "unknown", procedure: vote }] }],
  ])("rejects unsupported component vocabulary at %s", (path, draft) => {
    // A stale/untyped caller must not turn an unknown component into a no-op.
    expect(validateCharter(draft as Charter, capabilities)).toEqual([`${path}: unsupported component type`]);
  });
});

describe("each unavailable input is diagnosed on its own component", () => {
  const ledgerCases: [string, Charter][] = [
    ["admission[0]", { founding, admission: [{ type: "fee", amount: 1 }] }],
    ["obligations[0]", { ...open, obligations: [{ type: "dues", amount: 1, schedule }] }],
    ["benefits[0]", { ...open, benefits: [{ type: "transfer", event: "life.death", amount: 1 }] }],
    ["benefits[0]", { ...open, benefits: [{ type: "loan", event: "life.death", amount: 1, repayment_period: 7 }] }],
    ["sanctions[0]", { ...open, sanctions: [{ type: "fine", amount: 1, procedure: vote }] }],
  ];
  it.each(ledgerCases)("money rule %s requires Settlement's ledger: %j", (path, charter) => {
    expect(validateCharter(charter, { ...capabilities, ports: [] }))
      .toEqual([`${path}: requires port settlement.ledger`]);
  });

  it("a goods benefit requires Economy's inventory", () => {
    const charter: Charter = { ...open, benefits: [{ type: "goods", event: "life.death", good: "seed", quantity: 1 }] };
    expect(validateCharter(charter, { ...capabilities, ports: [] }))
      .toEqual(["benefits[0]: requires port economy.inventory"]);
  });

  it("occupation admission requires its declared fact port", () => {
    const charter: Charter = { founding, admission: [{ type: "occupation", occupation: "gardener", port: "fixture.occupation" }] };
    expect(validateCharter(charter, { ...capabilities, ports: [] }))
      .toEqual(["admission[0]: requires port fixture.occupation"]);
  });

  it.each([
    { type: "transfer", event: "life.illness_onset", amount: 1 },
    { type: "goods", event: "life.death", good: "seed", quantity: 1 },
    { type: "loan", event: "life.death", amount: 1, repayment_period: 7 },
  ] as const)("conditional benefit $type requires an emitted event", (benefit) => {
    expect(validateCharter({ ...open, benefits: [benefit] }, { ...capabilities, events: [] }))
      .toEqual([`benefits[0]: requires emitted event ${benefit.event}`]);
  });

  const procedureCases: [string, Charter][] = [
    ["admission[0].procedure", { founding, admission: [{ type: "vote", procedure: vote }] }],
    ["decision_procedure", { ...open, decision_procedure: vote }],
    ["positions[0]", { ...open, positions: [position] }],
    ["sanctions[0].procedure", { ...open, sanctions: [{ type: "expulsion", procedure: vote }] }],
    ["amendment", { ...open, amendment: vote }],
  ];
  it.each(procedureCases)("%s requires its implemented procedure", (path, charter) => {
    expect(validateCharter(charter, { ...capabilities, procedures: [] }))
      .toEqual([`${path}: requires implemented procedure simple_majority`]);
  });

  it.each([vote, qualified, unanimous, holder, council])("checks implementation of $type", (rule) => {
    expect(validateCharter({ ...open, positions: [position], decision_procedure: rule }, {
      ...capabilities, procedures: capabilities.procedures.filter((entry) => entry !== rule.type),
    })).toContain(`decision_procedure: requires implemented procedure ${rule.type}`);
  });

  it("checks a council's nested procedure independently", () => {
    expect(validateCharter({ ...open, positions: [position], decision_procedure: council }, {
      ...capabilities, procedures: capabilities.procedures.filter((entry) => entry !== "qualified_majority"),
    })).toEqual(["decision_procedure.procedure: requires implemented procedure qualified_majority"]);
  });

  it.each([
    [holder, "decision_procedure.role: requires position steward"],
    [council, "decision_procedure.roles[0]: requires position steward"],
    [{ ...vote, eligibility: { type: "positions", roles: ["steward"] } },
      "decision_procedure.eligibility.roles[0]: requires position steward"],
  ] as const)("referenced positions must be declared: %j", (rule, error) => {
    expect(validateCharter({ ...open, decision_procedure: rule }, capabilities)).toEqual([error]);
  });

  it("reports all missing inputs in component order", () => {
    const charter: Charter = {
      ...open, benefits: [{ type: "transfer", event: "missing.event", amount: 1 }],
      amendment: vote,
    };
    expect(validateCharter(charter, { events: [], ports: [], procedures: [] })).toEqual([
      "benefits[0]: requires emitted event missing.event",
      "benefits[0]: requires port settlement.ledger",
      "amendment: requires implemented procedure simple_majority",
    ]);
  });
});

describe("missing or unusable rule parameters block execution", () => {
  const invalidCases: [string, Charter][] = [
    ["admission[0].members", { founding, admission: [{ type: "sponsored", members: null }] }],
    ["admission[0].members", { founding, admission: [{ type: "sponsored", members: 1.5 }] }],
    ["admission[0].relation", { founding, admission: [{ type: "kinship", relation: " " }] }],
    ["admission[0].occupation", { founding, admission: [{ type: "occupation", occupation: "", port: "fixture.occupation" }] }],
    ["admission[0].amount", { founding, admission: [{ type: "fee", amount: null }] }],
    ["obligations[0].amount", { ...open, obligations: [{ type: "dues", amount: null, schedule }] }],
    ["obligations[0].schedule.first", { ...open, obligations: [{ type: "attendance", activity: "meet", schedule: { ...schedule, first: null } }] }],
    ["obligations[0].schedule.period", { ...open, obligations: [{ type: "attendance", activity: "meet", schedule: { ...schedule, period: null } }] }],
    ["obligations[0].activity", { ...open, obligations: [{ type: "attendance", activity: "", schedule }] }],
    ["obligations[0].hours", { ...open, obligations: [{ type: "service", activity: "repair", hours: null, schedule }] }],
    ["obligations[0]", { ...open, obligations: [{ type: "exclusivity", organisations: [] }] }],
    ["benefits[0].amount", { ...open, benefits: [{ type: "transfer", event: "life.death", amount: null }] }],
    ["benefits[0].quantity", { ...open, benefits: [{ type: "goods", event: "life.death", good: "seed", quantity: null }] }],
    ["benefits[0].good", { ...open, benefits: [{ type: "goods", event: "life.death", good: "", quantity: 1 }] }],
    ["benefits[0].activity", { ...open, benefits: [{ type: "meeting", activity: "", schedule }] }],
    ["benefits[0].repayment_period", { ...open, benefits: [{ type: "loan", event: "life.death", amount: 1, repayment_period: null }] }],
    ["positions[0].position", { ...open, positions: [{ ...position, position: "" }] }],
    ["positions[0].term", { ...open, positions: [{ ...position, term: null }] }],
    ["positions[1]", { ...open, positions: [position, position] }],
    ["sanctions[0].amount", { ...open, sanctions: [{ type: "fine", amount: null, procedure: vote }] }],
    ["sanctions[0].duration", { ...open, sanctions: [{ type: "suspension", duration: null, procedure: vote }] }],
    ["decision_procedure.roles", { ...open, decision_procedure: { ...council, roles: [] } }],
    ["decision_procedure.eligibility.roles", { ...open, decision_procedure: { ...vote, eligibility: { type: "positions", roles: [] } } }],
    ["decision_procedure.threshold", { ...open, decision_procedure: { ...qualified, threshold: null } }],
    ["decision_procedure.quorum", { ...open, decision_procedure: { ...vote, quorum: { type: "count", value: null } } }],
  ];
  it.each(invalidCases)("diagnoses %s alone: %j", (path, charter) => {
    const errors = validateCharter(charter, capabilities);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.startsWith(`${path}:`)).toBe(true);
  });

  it.each([null, NaN, Infinity, -Infinity, 0, -1])("rejects unusable monetary amount %s", (amount) => {
    expect(validateCharter({ founding, admission: [{ type: "fee", amount }] }, capabilities))
      .toEqual(["admission[0].amount: requires a finite positive number"]);
  });

  it.each([null, NaN, Infinity, 0, -0.1, 1.1])("rejects unusable fraction %s", (value) => {
    expect(validateCharter({ ...open, decision_procedure: { ...vote, quorum: { type: "fraction", value } } }, capabilities))
      .toEqual(["decision_procedure.quorum: requires a fraction greater than 0 and at most 1"]);
  });

  it("rejects fractional head counts", () => {
    expect(validateCharter({ ...open, decision_procedure: { ...vote, quorum: { type: "count", value: 1.5 } } }, capabilities))
      .toEqual(["decision_procedure.quorum: requires a finite positive integer"]);
  });

  it("allows a full fraction, indefinite terms, and position eligibility", () => {
    expect(validateCharter({
      ...open, positions: [{ ...position, term: "indefinite" }],
      decision_procedure: {
        ...qualified, threshold: 1, quorum: { type: "fraction", value: 1 },
        eligibility: { type: "positions", roles: ["steward"] },
      },
    }, capabilities)).toEqual([]);
  });
});
