import type { HouseholdStore } from "./household.ts";
import type { HouseholdId, PersonId } from "./types.ts";

export interface ArrangementEntry {
  effect: "permit" | "deny";
  who: PersonId | "members" | "non-members";
  good: string | "any";
  /** Inclusive endpoints in the query's time units. */
  window?: { from: number; to: number };
}

export interface HouseholdArrangement {
  kind: "collective" | "individual_shared" | "shares" | "declared";
  entries: ArrangementEntry[];
  precedence?: "deny-first" | "permit-first";
  label: "fixture" | "assumption" | "sourced";
  source?: string;
}

/** PLAN H6-H7: executable declarations require provenance and explicit conflict rules. */
export function validateArrangement(a: HouseholdArrangement): string[] {
  const errors: string[] = [];
  if (!a || typeof a !== "object" || Array.isArray(a)) return ["arrangement requires an object"];
  if (!["fixture", "assumption", "sourced"].includes(a.label)) errors.push("label must be fixture, assumption or sourced");
  if (a.label === "sourced" && (typeof a.source !== "string" || !a.source.trim())) {
    errors.push("source is required when label is sourced");
  }
  if (a.kind === "individual_shared" || a.kind === "shares") {
    errors.push(`kind ${a.kind} has no executable terms yet (PLAN H7); declare entries under kind 'declared'`);
  } else if (a.kind !== "collective" && a.kind !== "declared") errors.push("unknown arrangement kind");
  if (a.precedence !== undefined && a.precedence !== "deny-first" && a.precedence !== "permit-first") {
    errors.push("precedence must be deny-first or permit-first");
  }
  if (!Array.isArray(a.entries)) return [...errors, "entries must be an array"];
  let permit = false, deny = false;
  a.entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (entry.effect === "permit") permit = true;
    else if (entry.effect === "deny") deny = true;
    else errors.push(`${path}.effect must be permit or deny`);
    if (typeof entry.who !== "string" || !entry.who.trim()) errors.push(`${path}.who is required`);
    if (typeof entry.good !== "string" || !entry.good.trim()) errors.push(`${path}.good is required`);
    if (entry.window !== undefined && (!entry.window || !Number.isFinite(entry.window.from)
      || !Number.isFinite(entry.window.to) || entry.window.from > entry.window.to)) {
      errors.push(`${path}.window requires finite endpoints with from <= to`);
    }
  });
  if (permit && deny && a.precedence === undefined) errors.push("permit and deny entries require precedence");
  return errors;
}

export interface DrawQuery {
  person: PersonId;
  household: HouseholdId;
  good: string;
  t: number;
}
export interface DrawFacts {
  /** Host-composed contract.right_of_use from Settlement; no Society writer. */
  hasRightOfUse(household: HouseholdId, t: number): boolean | null;
}
export interface DrawAuthorisation {
  value: "authorised" | "unauthorised" | "unjudged";
  basis: string;
}

/** PLAN H7 / SN-3, IT-M1a-7: authorisation is a pure query, never physical success.
 * Declared test arrangements do not resolve SOC-R3 or 1270 manorial custom (H6).
 */
export function authoriseDraw(store: HouseholdStore, q: DrawQuery, facts: DrawFacts): DrawAuthorisation {
  if (!store.household(q.household)) throw new Error(`unknown household ${q.household}`);
  const arrangement = store.arrangement(q.household);
  if (!arrangement) return { value: "unjudged", basis: "no arrangement" };
  const member = store.isMember(q.person, q.household, q.t);
  const matches = arrangement.entries.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
    (entry.who === q.person || (entry.who === "members" && member) || (entry.who === "non-members" && !member))
    && (entry.good === "any" || entry.good === q.good)
    && (entry.window === undefined || (entry.window.from <= q.t && q.t <= entry.window.to)));
  if (matches.length) {
    // The loader requires precedence for mixed effects; ties within an effect use declaration order.
    const preferred = arrangement.precedence === "deny-first" ? "deny" : "permit";
    const match = matches.find(({ entry }) => entry.effect === preferred) ?? matches[0];
    return { value: match.entry.effect === "deny" ? "unauthorised" : "authorised",
      basis: `entry ${match.index}: ${match.entry.effect}` };
  }
  // M1a-14: lack of a right-of-use fact cannot manufacture a denial.
  if (arrangement.kind === "collective" && member) {
    return { value: facts.hasRightOfUse(q.household, q.t) === true ? "authorised" : "unjudged",
      basis: "collective: member with right of use" };
  }
  return { value: "unjudged", basis: "no matching entry" };
}
