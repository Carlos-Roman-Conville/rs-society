import { describe, expect, it } from "vitest";
import {
  HouseholdStore,
  loadHouseholds,
  mintId,
  type HouseholdEvent,
  type HouseholdFixture,
  type HouseholdId,
  type PersonId,
} from "../src/index.ts";

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
function kinPair(
  a: PersonId,
  b: PersonId,
  relation: "parent" | "child" | "spouse",
  since = 0,
): HouseholdFixture["kinship"] {
  const forward = { person: a, relative: b, relation, since };
  const inverse =
    relation === "parent"
      ? { person: b, relative: a, relation: "child" as const, since }
      : relation === "child"
        ? { person: b, relative: a, relation: "parent" as const, since }
        : { person: b, relative: a, relation: "spouse" as const, since };
  return [forward, inverse];
}

const defaultOrder = ["death", "departure", "join"] as const;
function storeFrom(fixture: HouseholdFixture, order: readonly ("death" | "departure" | "join")[] = defaultOrder) {
  return new HouseholdStore(loadHouseholds(fixture), order);
}

describe("household structure (PLAN §8.4 SN-1, SN-2)", () => {
  it("a duplicate event id changes nothing (membership and log identical)", () => {
    const p = person(); // fixture (test only)
    const h = householdId("dup"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [p],
      households: [{ id: h, relation: "co-resident domestic group", members: [p], residence: "building.dup", formed_at: 0 }],
      kinship: [],
    };
    const store = storeFrom(fixture);
    const event: HouseholdEvent = { id: "evt.dup", t: 1, kind: "departure", person: p, household: h };
    store.applyTick(1, [event]);
    const membersAfterFirst = store.members(h);
    const logAfterFirst = store.log();
    store.applyTick(1, [event]);
    expect(store.members(h)).toEqual(membersAfterFirst);
    expect(store.log()).toEqual(logAfterFirst);
  });

  it("a death followed by an administrative departure of the same person counts once (one left, no second removal)", () => {
    const p = person(); // fixture (test only)
    const h = householdId("death-dep"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [p],
      households: [{ id: h, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 }],
      kinship: [],
    };
    const store = storeFrom(fixture);
    store.applyTick(1, [
      { id: "evt.death", t: 1, kind: "death", person: p },
      { id: "evt.depart", t: 1, kind: "departure", person: p, household: h },
    ]);
    const left = store.log().filter((row) => row.kind === "left" && row.person === p);
    expect(left).toHaveLength(1);
    expect(left[0]?.cause).toBe("death");
    expect(store.isMember(p, h)).toBe(false);
  });

  it("same-tick join and departure follow the declared order: the same events under two different declared orders give the two results the order implies", () => {
    const p = person(); // fixture (test only)
    const q = person(); // fixture (test only)
    const h = householdId("order"); // fixture (test only)
    const base: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [p, q],
      households: [{ id: h, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 }],
      kinship: [],
    };
    const events: HouseholdEvent[] = [
      { id: "evt.join", t: 2, kind: "join", person: q, household: h },
      { id: "evt.leave", t: 2, kind: "departure", person: q, household: h },
    ];
    const departFirst = storeFrom(base, ["death", "departure", "join"]);
    departFirst.applyTick(2, events);
    expect(departFirst.isMember(q, h)).toBe(true);

    const joinFirst = storeFrom(base, ["death", "join", "departure"]);
    joinFirst.applyTick(2, events);
    expect(joinFirst.isMember(q, h)).toBe(false);
    expect(joinFirst.log().some((row) => row.kind === "joined" && row.person === q)).toBe(true);
  });

  it("a thrown event (join of a dead person) rolls back the whole tick: membership and log equal the pre-tick snapshot", () => {
    const p = person(); // fixture (test only)
    const q = person(); // fixture (test only)
    const h = householdId("rollback"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [p, q],
      households: [{ id: h, relation: "co-resident domestic group", members: [p, q], residence: null, formed_at: 0 }],
      kinship: [],
    };
    const store = storeFrom(fixture);
    const before = store.snapshot();
    expect(() =>
      store.applyTick(3, [
        { id: "evt.death", t: 3, kind: "death", person: p },
        { id: "evt.join", t: 3, kind: "join", person: p, household: h },
      ]),
    ).toThrow(/dead person/);
    expect(store.snapshot()).toEqual(before);
  });

  it("a missing or incomplete declared order is refused at construction; a departure or join without a household is refused; nothing is assumed", () => {
    const p = person(); // fixture (test only)
    const h = householdId("refuse"); // fixture (test only)
    const loaded = loadHouseholds({
      constraints: { onePerPerson: false },
      persons: [p],
      households: [{ id: h, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 }],
      kinship: [],
    });
    expect(() => new HouseholdStore(loaded, ["death", "departure"])).toThrow(/event order must declare/);
    const store = storeFrom({
      constraints: { onePerPerson: false },
      persons: [p],
      households: [{ id: h, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 }],
      kinship: [],
    });
    expect(() => store.applyTick(1, [{ id: "evt.no-hh", t: 1, kind: "join", person: p }])).toThrow(/requires household/);
    expect(() => store.applyTick(1, [{ id: "evt.no-hh2", t: 1, kind: "departure", person: p }])).toThrow(/requires household/);
  });

  it("replay: the same fixture and events give identical records and log (deep equality) on two fresh stores", () => {
    const p = person(); // fixture (test only)
    const q = person(); // fixture (test only)
    const h = householdId("replay"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: true },
      persons: [p, q],
      households: [{ id: h, relation: "co-resident domestic group", members: [p, q], residence: null, formed_at: 0 }],
      kinship: kinPair(p, q, "spouse"),
    };
    const events: HouseholdEvent[] = [{ id: "evt.death", t: 5, kind: "death", person: q }];
    const a = storeFrom(fixture);
    const b = storeFrom(fixture);
    a.applyTick(5, events);
    b.applyTick(5, events);
    expect(a.snapshot()).toEqual(b.snapshot());
    expect(a.log()).toEqual(b.log());
    expect(a.household(h)).toEqual(b.household(h));
  });

  it("in a two-person household (the CP-1 shape) an injected death removes one member; the household keeps the same id; the survivor is still a member; no ledger or inventory call is possible (the store has no such port: assert the store object exposes none) and the store holds no stock field", () => {
    const survivor = person(); // fixture (test only)
    const deceased = person(); // fixture (test only)
    const h = householdId("cp1"); // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: true },
      persons: [survivor, deceased],
      households: [{
        id: h,
        relation: "co-resident domestic group",
        members: [survivor, deceased],
        residence: "building.cp1",
        formed_at: 0,
      }],
      kinship: kinPair(survivor, deceased, "spouse"),
    };
    const store = storeFrom(fixture);
    expect(Object.keys(store)).not.toEqual(expect.arrayContaining(["ledger", "inventory", "stock"]));
    expect("ledger" in store).toBe(false);
    expect("inventory" in store).toBe(false);
    expect("stock" in store).toBe(false);
    store.applyTick(1, [{ id: "evt.cp1-death", t: 1, kind: "death", person: deceased }]);
    expect(store.household(h)?.id).toBe(h);
    expect(store.isMember(survivor, h)).toBe(true);
    expect(store.isMember(deceased, h)).toBe(false);
    expect(store.members(h)).toEqual([survivor]);
  });

  it("the last member's death dissolves the household with cause last member death; its id is not reused by a later fixture load in the same test", () => {
    const lone = person(); // fixture (test only)
    const hDissolved = householdId("solo"); // fixture (test only)
    const first = storeFrom({
      constraints: { onePerPerson: false },
      persons: [lone],
      households: [{ id: hDissolved, relation: "co-resident domestic group", members: [lone], residence: null, formed_at: 0 }],
      kinship: [],
    });
    first.applyTick(2, [{ id: "evt.solo-death", t: 2, kind: "death", person: lone }]);
    const dissolved = first.log().find((row) => row.kind === "dissolved");
    expect(dissolved?.household).toBe(hDissolved);
    expect(dissolved?.cause).toBe("last member death");
    expect(first.household(hDissolved)?.dissolved_at).toBe(2);

    const hFresh = householdId("later"); // fixture (test only)
    const later = storeFrom({
      constraints: { onePerPerson: false },
      persons: [lone],
      households: [{ id: hFresh, relation: "co-resident domestic group", members: [lone], residence: null, formed_at: 10 }],
      kinship: [],
    });
    expect(later.household(hFresh)?.id).toBe(hFresh);
    expect(later.household(hDissolved)).toBeUndefined();
    expect(first.household(hDissolved)?.dissolved_at).toBe(2);
  });

  it("fixture validation: with onePerPerson true, a person in two households is refused; with it false, the same fixture loads. An empty relation is refused", () => {
    const p = person(); // fixture (test only)
    const h1 = householdId("a"); // fixture (test only)
    const h2 = householdId("b"); // fixture (test only)
    const dual = {
      constraints: { onePerPerson: true },
      persons: [p],
      households: [
        { id: h1, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 },
        { id: h2, relation: "co-resident domestic group", members: [p], residence: null, formed_at: 0 },
      ],
      kinship: [],
    };
    expect(() => loadHouseholds(dual)).toThrow(/onePerPerson/);
    expect(loadHouseholds({ ...dual, constraints: { onePerPerson: false } }).households).toHaveLength(2);
    expect(() =>
      loadHouseholds({
        constraints: { onePerPerson: false },
        persons: [p],
        households: [{ id: h1, relation: "   ", members: [p], residence: null, formed_at: 0 }],
        kinship: [],
      }),
    ).toThrow(/empty household relation/);
  });

  it("kinship: an asymmetric parent/child pair, an asymmetric spouse pair, an unknown relation and a parent cycle are each refused with an error naming the cause; a valid symmetric graph loads and kin() returns both directions", () => {
    const a = person(); // fixture (test only)
    const b = person(); // fixture (test only)
    const c = person(); // fixture (test only)
    const base = (kinship: HouseholdFixture["kinship"]) => ({
      constraints: { onePerPerson: false },
      persons: [a, b, c],
      households: [{ id: householdId("kin"), relation: "co-resident domestic group", members: [a], residence: null, formed_at: 0 }],
      kinship,
    });
    expect(() => loadHouseholds(base([{ person: a, relative: b, relation: "parent", since: 0 }]))).toThrow(/asymmetric kinship/);
    expect(() =>
      loadHouseholds(base([{ person: a, relative: b, relation: "spouse", since: 0 }])),
    ).toThrow(/asymmetric kinship/);
    expect(() =>
      loadHouseholds(base([{ person: a, relative: b, relation: "cousin", since: 0 }])),
    ).toThrow(/invalid kinship relation/);
    const cycleKin: HouseholdFixture["kinship"] = [
      ...kinPair(a, b, "parent"),
      ...kinPair(b, c, "parent"),
      ...kinPair(c, a, "parent"),
    ];
    expect(() => loadHouseholds(base(cycleKin))).toThrow(/cycle along parent edges/);

    const loaded = loadHouseholds(base(kinPair(a, b, "spouse")));
    const store = storeFrom({ ...base(kinPair(a, b, "spouse")), constraints: loaded.constraints });
    expect(store.kin(a).some((row) => row.relative === b && row.relation === "spouse")).toBe(true);
    expect(store.kin(b).some((row) => row.relative === a && row.relation === "spouse")).toBe(true);
  });

  it("residence agreement: with residenceOf supplied, a member whose residence differs is refused naming both; a member temporarily elsewhere (no residence change) is not removed (the store never reads location)", () => {
    const atHome = person(); // fixture (test only)
    const away = person(); // fixture (test only)
    const h = householdId("res"); // fixture (test only)
    const building = "building.res"; // fixture (test only)
    const fixture: HouseholdFixture = {
      constraints: { onePerPerson: false },
      persons: [atHome, away],
      households: [{ id: h, relation: "co-resident domestic group", members: [atHome, away], residence: building, formed_at: 0 }],
      kinship: [],
    };
    expect(() =>
      loadHouseholds(fixture, {
        residenceOf: (person) => (person === away ? "building.elsewhere" : building),
      }),
    ).toThrow(new RegExp(`person ${away}.*household ${h}`, "s"));

    const stranger = person(); // fixture (test only)
    const agreed = storeFrom({
      ...fixture,
      persons: [...fixture.persons, stranger],
      households: [{ ...fixture.households[0]!, members: [atHome, away, stranger] }],
    });
    expect(agreed.isMember(away, h)).toBe(true);
    agreed.applyTick(4, [{ id: "evt.stranger-death", t: 4, kind: "death", person: stranger }]);
    expect(agreed.isMember(away, h)).toBe(true);
  });
});
