import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  authoriseDraw,
  HouseholdStore,
  loadHouseholds,
  mintId,
  validateArrangement,
  type DrawFacts,
  type HouseholdArrangement,
  type HouseholdFixture,
  type HouseholdId,
  type PersonId,
} from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const m1aPath = join(here, "../data/fixtures/m1a/household.json");

// fixture (test only)
let counters: Record<string, number> = {};
function person(): PersonId {
  const next = mintId(counters, "person");
  counters = next.counters;
  return next.id;
}
function householdId(label: string): HouseholdId {
  return `household.${label}` as HouseholdId;
}

const defaultOrder = ["death", "departure", "join"] as const;
function storeFrom(fixture: HouseholdFixture) {
  return new HouseholdStore(loadHouseholds(fixture), defaultOrder);
}

function collectiveFixture(members: PersonId[], arrangement?: HouseholdArrangement): HouseholdFixture {
  const h = householdId("collective"); // fixture (test only)
  return {
    constraints: { onePerPerson: members.length <= 1 },
    persons: members,
    households: [{
      id: h,
      relation: "co-resident domestic group",
      members,
      residence: "fixture:building",
      formed_at: 0,
      arrangement: arrangement ?? { kind: "collective", entries: [], label: "fixture" },
    }],
    kinship: [],
  };
}

function rightOfUse(value: boolean | null): DrawFacts {
  return { hasRightOfUse: () => value }; // fixture (test only)
}

describe("household draw authorisation (PLAN H6-H7, SN-3)", () => {
  it("(a) a member of the collective household with right of use true → authorised", () => {
    const member = person(); // fixture (test only)
    const fixture = collectiveFixture([member]);
    const store = storeFrom(fixture);
    const h = fixture.households[0]!.id;
    const result = authoriseDraw(store, { person: member, household: h, good: "cereals", t: 0 }, rightOfUse(true));
    expect(result).toEqual({ value: "authorised", basis: "collective: member with right of use" });
  });

  it("(b) the fixture plus a declared deny entry for the non-member → unauthorised; the call returns a value and does not throw", () => {
    const member = person(); // fixture (test only)
    const outsider = person(); // fixture (test only)
    const h = householdId("deny-outsider"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [member, outsider],
      households: [{
        id: h,
        relation: "co-resident domestic group",
        members: [member],
        residence: "fixture:building",
        formed_at: 0,
        arrangement: {
          kind: "collective",
          entries: [{ effect: "deny", who: outsider, good: "any" }],
          label: "fixture",
        },
      }],
      kinship: [],
    };
    const store = storeFrom(fixture);
    expect(() =>
      authoriseDraw(store, { person: outsider, household: h, good: "cereals", t: 0 }, rightOfUse(true)),
    ).not.toThrow();
    expect(authoriseDraw(store, { person: outsider, household: h, good: "cereals", t: 0 }, rightOfUse(true))).toEqual({
      value: "unauthorised",
      basis: "entry 0: deny",
    });
  });

  it("(c) the same non-member with no matching entry → unjudged; a household with no arrangement → unjudged", () => {
    const member = person(); // fixture (test only)
    const outsider = person(); // fixture (test only)
    const withArrangement = householdId("with-arr"); // fixture (test only)
    const bare = householdId("bare"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [member, outsider],
      households: [
        {
          id: withArrangement,
          relation: "co-resident domestic group",
          members: [member],
          residence: "fixture:a",
          formed_at: 0,
          arrangement: { kind: "collective", entries: [], label: "fixture" },
        },
        {
          id: bare,
          relation: "co-resident domestic group",
          members: [member],
          residence: "fixture:b",
          formed_at: 0,
        },
      ],
      kinship: [],
    };
    const store = storeFrom(fixture);
    expect(authoriseDraw(
      store,
      { person: outsider, household: withArrangement, good: "cereals", t: 0 },
      rightOfUse(true),
    )).toEqual({ value: "unjudged", basis: "no matching entry" });
    expect(authoriseDraw(
      store,
      { person: member, household: bare, good: "cereals", t: 0 },
      rightOfUse(true),
    )).toEqual({ value: "unjudged", basis: "no arrangement" });
  });

  it("non-membership alone never gives unauthorised (the non-member under the bare fixture is unjudged)", () => {
    const raw = JSON.parse(readFileSync(m1aPath, "utf8")) as HouseholdFixture & { nonMember: PersonId };
    const store = storeFrom(raw);
    const h = raw.households[0]!.id;
    const result = authoriseDraw(
      store,
      { person: raw.nonMember, household: h, good: "cereals", t: 0 },
      rightOfUse(true),
    );
    expect(result.value).toBe("unjudged");
    expect(result.value).not.toBe("unauthorised");
  });

  it("a member with right of use false or null → unjudged, with the basis saying why", () => {
    const member = person(); // fixture (test only)
    const fixture = collectiveFixture([member]);
    const store = storeFrom(fixture);
    const h = fixture.households[0]!.id;
    const query = { person: member, household: h, good: "cereals", t: 0 };
    for (const facts of [rightOfUse(false), rightOfUse(null)]) {
      const result = authoriseDraw(store, query, facts);
      expect(result).toEqual({ value: "unjudged", basis: "collective: member with right of use" });
    }
  });

  it("permit and deny both matching: refused at load without precedence; with each precedence, the declared one wins", () => {
    const member = person(); // fixture (test only)
    const h = householdId("precedence"); // fixture (test only)
    const base = {
      constraints: { onePerPerson: false },
      persons: [member],
      households: [{
        id: h,
        relation: "co-resident domestic group",
        members: [member],
        residence: "fixture:building",
        formed_at: 0,
        arrangement: {
          kind: "collective" as const,
          entries: [
            { effect: "permit" as const, who: "members" as const, good: "any" },
            { effect: "deny" as const, who: "members" as const, good: "any" },
          ],
          label: "fixture" as const,
        },
      }],
      kinship: [],
    };
    expect(() => loadHouseholds(base)).toThrow(/precedence/);
    expect(validateArrangement(base.households[0]!.arrangement!)).toContain("permit and deny entries require precedence");

    const denyFirst = storeFrom({
      ...base,
      households: [{
        ...base.households[0]!,
        arrangement: { ...base.households[0]!.arrangement!, precedence: "deny-first" },
      }],
    });
    const permitFirst = storeFrom({
      ...base,
      households: [{
        ...base.households[0]!,
        arrangement: { ...base.households[0]!.arrangement!, precedence: "permit-first" },
      }],
    });
    const query = { person: member, household: h, good: "cereals", t: 0 };
    expect(authoriseDraw(denyFirst, query, rightOfUse(false)).value).toBe("unauthorised");
    expect(authoriseDraw(permitFirst, query, rightOfUse(false)).value).toBe("authorised");
  });

  it("a window: an entry outside its window does not match; inclusive at both ends", () => {
    const member = person(); // fixture (test only)
    const outsider = person(); // fixture (test only)
    const h = householdId("window"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [member, outsider],
      households: [{
        id: h,
        relation: "co-resident domestic group",
        members: [member],
        residence: "fixture:building",
        formed_at: 0,
        arrangement: {
          kind: "collective",
          entries: [{ effect: "deny", who: outsider, good: "any", window: { from: 10, to: 20 } }],
          label: "fixture",
        },
      }],
      kinship: [],
    };
    const store = storeFrom(fixture);
    const query = (t: number) => ({ person: outsider, household: h, good: "cereals", t });
    expect(authoriseDraw(store, query(9), rightOfUse(true)).value).toBe("unjudged");
    expect(authoriseDraw(store, query(21), rightOfUse(true)).value).toBe("unjudged");
    expect(authoriseDraw(store, query(10), rightOfUse(true)).value).toBe("unauthorised");
    expect(authoriseDraw(store, query(20), rightOfUse(true)).value).toBe("unauthorised");
  });

  it("kinds individual_shared and shares are refused at load naming PLAN H7; label missing is refused", () => {
    const member = person(); // fixture (test only)
    const h = householdId("kind-refuse"); // fixture (test only)
    const row = {
      id: h,
      relation: "co-resident domestic group",
      members: [member],
      residence: "fixture:building",
      formed_at: 0,
    };
    for (const kind of ["individual_shared", "shares"] as const) {
      expect(() => loadHouseholds({
        constraints: { onePerPerson: false },
        persons: [member],
        households: [{ ...row, arrangement: { kind, entries: [], label: "fixture" } }],
        kinship: [],
      })).toThrow(/PLAN H7/);
    }
    expect(validateArrangement({ kind: "collective", entries: [] } as unknown as HouseholdArrangement)).toContain(
      "label must be fixture, assumption or sourced",
    );
  });

  it("after an injected death of one member (5472 store), the survivor's value is unchanged and the arrangement is unchanged", () => {
    const survivor = person(); // fixture (test only)
    const deceased = person(); // fixture (test only)
    const fixture = collectiveFixture([survivor, deceased]);
    const store = storeFrom(fixture);
    const h = fixture.households[0]!.id;
    const facts = rightOfUse(true);
    const query = { person: survivor, household: h, good: "cereals", t: 0 };
    const before = authoriseDraw(store, query, facts);
    const arrangementBefore = store.arrangement(h);
    store.applyTick(1, [{ id: "evt.m1a-death", t: 1, kind: "death", person: deceased }]);
    expect(authoriseDraw(store, query, facts)).toEqual(before);
    expect(store.arrangement(h)).toEqual(arrangementBefore);
  });

  it("loading data/fixtures/m1a/household.json succeeds and case (a) holds on it", () => {
    const raw = JSON.parse(readFileSync(m1aPath, "utf8")) as HouseholdFixture;
    const loaded = loadHouseholds(raw);
    expect(loaded.households).toHaveLength(1);
    const store = new HouseholdStore(loaded, defaultOrder);
    const h = loaded.households[0]!.id;
    const member = loaded.households[0]!.members[0]!;
    expect(authoriseDraw(
      store,
      { person: member, household: h, good: "cereals", t: 0 },
      rightOfUse(true),
    )).toEqual({ value: "authorised", basis: "collective: member with right of use" });
  });
});
