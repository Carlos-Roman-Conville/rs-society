import { describe, expect, it } from "vitest";
import reference from "../data/charters/reference.json" with { type: "json" };
import { validateCharter } from "../src/charter.ts";
import type { Charter, CharterCapabilities } from "../src/types.ts";

// All numeric terms, roles and identifiers below are fixture (test only).
const schedule = { first: 0, period: 1 };
const vote = { type: "simple_majority", base: "present", // fixture (test only)
  electorate: "present", eligibility: { type: "members" },
  quorum: { type: "count", value: 1 }, tie_break: { type: "position_holder", role: "steward" } } as const;
const council = { type: "council", roles: ["steward"], procedure: { type: "qualified_majority", base: "present", // fixture (test only)
  electorate: "present",
  threshold: 0.5, eligibility: { type: "positions", roles: ["steward"] }, quorum: { type: "fraction", value: 1 } } } as const;
const complete: Charter = {
  founding: { window: 1, min_members: 1 },
  admission: [{ type: "open" }, { type: "sponsored", members: 1 }, { type: "vote", procedure: council },
    { type: "kinship", relation: "sibling" }, { type: "occupation", occupation: "smith", port: "facts" }, { type: "fee", amount: 1 }],
  obligations: [{ type: "dues", amount: 1, schedule }, { type: "attendance", activity: "meeting", schedule },
    { type: "service", activity: "repair", hours: 1, schedule }, { type: "exclusivity", organisations: ["org.1" as never] }],
  benefits: [{ type: "transfer", event: "sickness", amount: 1 }, { type: "goods", event: "sickness", good: "bread", quantity: 1 },
    { type: "meeting", activity: "meeting", schedule }, { type: "loan", event: "sickness", amount: 1, repayment_period: 1 }],
  decision_procedure: vote,
  positions: [{ ...vote, position: "steward", term: 1 }],
  sanctions: [{ type: "fine", amount: 1, procedure: vote }, { type: "suspension", duration: 1, procedure: council },
    { type: "expulsion", procedure: { type: "position_holder", role: "steward" } }],
  amendment: { type: "unanimity", electorate: "all_members", eligibility: { type: "members" }, quorum: { type: "count", value: 1 } },
};
const capabilities: CharterCapabilities = { events: ["sickness"], ports: ["settlement.ledger", "economy.inventory", "facts"],
  procedures: ["position_holder", "council", "simple_majority", "qualified_majority", "unanimity"] };

function paths(value: unknown, path: string[] = []): string[][] {
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [[...path, key], ...paths(child, [...path, key])]);
}
function replace(value: unknown, path: string[], missing: boolean): Charter {
  const copy = structuredClone(value) as Record<string, unknown>;
  let parent = copy;
  for (const key of path.slice(0, -1)) parent = parent[key] as Record<string, unknown>;
  if (missing) delete parent[path.at(-1)!];
  else parent[path.at(-1)!] = null;
  return copy as Charter;
}
function rejects(draft: unknown, available = capabilities): string[] {
  let errors: string[] = [];
  expect(() => { errors = validateCharter(draft as Charter, available); }).not.toThrow();
  expect(Array.isArray(errors)).toBe(true);
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.every((error) => typeof error === "string" && error.includes(":"))).toBe(true);
  return errors;
}

describe("JSON-shaped charter nulls return errors without inventing parameters (DESIGN §1.2a)", () => {
  it("starts from an executable fixture composition", () => {
    expect(validateCharter(complete, capabilities)).toEqual([]);
  });
  it.each(paths(complete).map((path) => [path.join("."), path] as const))("rejects null at %s", (_name, path) => {
    rejects(replace(complete, path, false));
  });
  // Optional mechanisms and tie-breaks may be omitted; every declared component still needs its inputs.
  const required = paths(complete).filter((path) => path.length > 1 && path.at(-1) !== "tie_break"
    && !/^\d+$/.test(path.at(-1)!));
  it.each(required.map((path) => [path.join("."), path] as const))("rejects missing %s", (_name, path) => {
    rejects(replace(complete, path, true));
  });
  it.each([null, undefined])("rejects a missing charter or capabilities (%s)", (value) => {
    rejects(value);
    let errors: string[] = [];
    expect(() => { errors = validateCharter(complete, value as unknown as CharterCapabilities); }).not.toThrow();
    expect(errors).toEqual(["capabilities: requires an object"]);
  });
  it.each(["events", "ports", "procedures"])("rejects null/missing capability list %s", (key) => {
    for (const value of [null, undefined, [null], [undefined]]) rejects(complete, { ...capabilities, [key]: value });
  });
  it("keeps array indexes in errors after a null component", () => {
    expect(rejects({ founding: complete.founding, admission: [null, { type: "fee", amount: null }] })).toEqual([
      "admission[0]: requires an object", "admission[1].amount: requires a finite positive number",
    ]);
  });
});

// These are the reference rows with null procedure/position inputs that previously
// produced an exception as the first reported failure, or an unsupported position.
const rows = reference.filter((row) => row.components.some((component) =>
  ("procedure" in component && component.procedure === null)
  || (component.section === "position" && component.type === null)));
const sections: Record<string, string> = { admission: "admission", obligation: "obligations", benefit: "benefits",
  position: "positions", sanction: "sanctions" };
describe("researched null procedures and position types are diagnostics", () => {
  it("includes both null procedure and null position regressions", () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.components.some((c) => "procedure" in c && c.procedure === null))).toBe(true);
    expect(rows.some((row) => row.components.some((c) => c.section === "position" && c.type === null))).toBe(true);
  });
  it.each(rows)("returns errors for $id without filling research gaps", (row) => {
    const draft: Record<string, unknown> = {};
    for (const component of row.components) {
      const key = sections[component.section];
      if (key) {
        const components = (draft[key] ??= []) as unknown[];
        components.push(component);
      }
      else if (component.section === "decision_procedure" || component.section === "amendment") draft[component.section] = component;
    }
    const before = structuredClone(draft);
    const errors = rejects(draft);
    expect(errors.some((error) => /(?:procedure|positions\[)/.test(error))).toBe(true);
    expect(draft).toEqual(before);
  });
});
