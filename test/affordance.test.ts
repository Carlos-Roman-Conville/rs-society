import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AFFORDANCE_PROCESS, FORMATION_PROCESS, offers, householdOffers, migrationOffers,
  type AffordanceState, type Admission, type DecisionProcedure, type Organisation,
  type OrgId, type PersonId, type SocialIntention, type SocialOffer } from "../src/index.ts";
import { a, b, c, charter, draft, foundFixture, network, setup, vote } from "./lifecycle-fixture.ts";

// All identities, balances, times, counts and rule values below are fixture (test only).
function snapshot(fixture: ReturnType<typeof setup>, changes: Partial<AffordanceState> = {}): AffordanceState {
  return { organisations: fixture.store.organisations(), obligations: fixture.store.obligations,
    attendance: [], proposals: [], foundingCircles: [], network: { known: [], ties: [] },
    ledger: fixture.ledger, facts: {}, unavailable: [], ...changes };
}
function actor(admission: readonly Admission[] = [{ type: "open" }]): Organisation {
  const fixture = setup();
  const id = foundFixture(fixture.store);
  return { ...fixture.store.get(id)!, charter: { ...charter, admission } };
}
function joinsFor(person: PersonId, state: AffordanceState): readonly SocialOffer[] {
  return offers(person, 0, state).filter((o) => o.kind === "join");
}
function stubMind(candidates: readonly SocialOffer[], t: number): SocialIntention {
  const chosen = candidates.find((o) => o.kind === "join")!;
  return { person: chosen.person, kind: "join", target: chosen.target, t };
}

describe("affordance offers (DESIGN §1.13, IF-46)", () => {
  it("offers no unsupported actions when sources are empty, and leaves typed extensions empty", () => {
    const state = snapshot(setup());
    expect(offers(a, 0, state)).toEqual([{ person: a, kind: "found", target: FORMATION_PROCESS,
      source: { row: FORMATION_PROCESS, id: FORMATION_PROCESS }, t: 0, terms: {} }]);
    expect(householdOffers(a, 0, state)).toEqual([]);
    expect(migrationOffers(a, 0, state)).toEqual([]);
    expect(offers(a, 0, { ...state, unavailable: [a] })).toEqual([]);
    expect(() => offers(a, -1, state)).toThrow();
  });

  it("offers conjunctive admission only when current fee, sponsor, kinship and occupation facts permit it", () => {
    const fixture = setup();
    const org = actor([{ type: "open" }, { type: "fee", amount: 40 }, { type: "fee", amount: 60 },
      { type: "sponsored", members: 1 }, { type: "kinship", relation: "sibling" },
      { type: "occupation", occupation: "weaver", port: "work" }]);
    const state = snapshot(fixture, { organisations: [org], facts: {
      sponsors: () => [a, a], kinship: () => true, occupation: () => true,
    } });
    expect(joinsFor(b, state)).toHaveLength(1);
    expect(joinsFor(b, state)[0].terms).toEqual({ charter: org.charter });
    for (const facts of [
      { ...state.facts, sponsors: () => [c] },
      { ...state.facts, kinship: () => false },
      { ...state.facts, occupation: () => false },
    ]) expect(joinsFor(b, { ...state, facts })).toEqual([]);
    org.members[0].standing = "suspended";
    expect(joinsFor(b, state)).toEqual([]);
    org.members[0].standing = "active";
    fixture.ledger.balances.set(b, 99);
    expect(joinsFor(b, state)).toEqual([]);
    fixture.ledger.balances.set(b, 100);
    org.charter = { ...org.charter, admission: [{ type: "sponsored", members: 2 }] };
    expect(joinsFor(b, state)).toEqual([]); // Duplicate sponsors do not count twice.
  });

  it("does not invent missing admission parameters or required facts", () => {
    const fixture = setup();
    for (const admission of [[{ type: "fee", amount: null }], [{ type: "sponsored", members: null }],
      [{ type: "sponsored", members: 1 }], [{ type: "kinship", relation: "sibling" }],
      [{ type: "occupation", occupation: "weaver", port: "work" }]] as Admission[][]) {
      expect(() => joinsFor(b, snapshot(fixture, { organisations: [actor(admission)] }))).toThrow(/requires/);
    }
    expect(joinsFor(b, snapshot(fixture, { organisations: [actor([])] }))).toEqual([]);
  });

  it("retains vote admission terms without choosing the vote result", () => {
    const state = snapshot(setup(), { organisations: [actor([{ type: "vote", procedure: vote }])] });
    expect(joinsFor(b, state)[0].terms).toEqual({ charter: state.organisations[0].charter });
  });

  it("honours admission exclusivity and does not offer a second join to a member", () => {
    const fixture = setup();
    const first = foundFixture(fixture.store, [b]);
    const second = foundFixture(fixture.store, [a], { ...charter,
      obligations: [{ type: "exclusivity", organisations: [first] }] });
    expect(joinsFor(b, snapshot(fixture))).toEqual([]);
    expect(joinsFor(c, snapshot(fixture)).map((o) => o.target)).toEqual([first, second]);
  });

  it("offers leave, actual unpaid dues, current meetings, proposals and all three open ballot actions with sources", () => {
    const fixture = setup();
    const id = foundFixture(fixture.store, [a], { ...charter,
      obligations: [{ type: "dues", amount: 5, schedule: { first: 1, period: 1 } }] });
    fixture.ledger.balances.set(a, 0);
    fixture.store.advanceTo(1);
    const proposal = { person: a, kind: "propose", target: id, t: 1 } as const;
    const state = snapshot(fixture, { proposals: [
      { id: "proposal.2", proposal, status: "open" },
      { id: "proposal.1", proposal, status: "resolved" },
      { id: "proposal.3", proposal: { ...proposal, t: 2 }, status: "open" },
    ] });
    const candidates = offers(a, 1, state).filter((o) => o.source.row === "society.organisation");
    expect(candidates.map((o) => o.kind)).toEqual(["leave", "pay", "attend", "propose", "support", "oppose", "abstain"]);
    expect(candidates.every((o) => o.source.id === id && o.person === a && o.t === 1)).toBe(true);
    expect(candidates.find((o) => o.kind === "pay")!.payload).toEqual({ component: 0, due_at: 1 });
    expect(candidates.find((o) => o.kind === "attend")!.payload).toEqual({ activity: "assembly" });
    expect(candidates.filter((o) => ["support", "oppose", "abstain"].includes(o.kind)).map((o) => o.target))
      .toEqual(["proposal.2", "proposal.2", "proposal.2"]);
    expect(offers(b, 1, state).some((o) => o.kind === "support")).toBe(false);
    fixture.ledger.balances.set(a, 5);
    const pay = candidates.find((o) => o.kind === "pay")!;
    expect(fixture.store.attempt({ person: a, t: 1, kind: "pay", target: pay.target, payload: pay.payload }).kind).toBe("act");
    expect(offers(a, 1, snapshot(fixture)).some((o) => o.kind === "pay")).toBe(false);
  });

  it("omits unscheduled or already attended meetings and restricts suspended members to leave and pay", () => {
    const org = actor();
    org.schedule = [{ activity: "assembly", first: 1, period: 2 }, { activity: "assembly", first: 1, period: 2 }];
    const state = snapshot(setup(), { organisations: [org] });
    expect(offers(a, 0, state).some((o) => o.kind === "attend")).toBe(false);
    expect(offers(a, 1, state).filter((o) => o.kind === "attend")).toHaveLength(1);
    expect(offers(a, 2, state).some((o) => o.kind === "attend")).toBe(false);
    expect(offers(a, 1, { ...state, attendance: [{ org: org.id, person: a, activity: "assembly", t: 1 }] })
      .some((o) => o.kind === "attend")).toBe(false);
    org.members[0].standing = "suspended";
    expect(offers(a, 1, state).filter((o) => o.source.row === "society.organisation").map((o) => o.kind)).toEqual(["leave"]);
  });

  it("uses chartered voting eligibility and attendance without deciding quorum or outcomes", () => {
    const org = actor();
    org.positions = [{ role: "chair", holder: b, term: "indefinite", until: null }];
    const procedure: DecisionProcedure = { ...vote, electorate: "present", eligibility: { type: "positions", roles: ["chair"] } };
    org.charter = { ...org.charter, decision_procedure: procedure };
    const state = snapshot(setup(), { organisations: [org], proposals: [
      { id: "proposal.1", status: "open", proposal: { person: a, kind: "propose", target: org.id, t: 0 } },
    ] });
    expect(offers(a, 0, state).some((o) => o.kind === "propose" || o.kind === "support")).toBe(false);
    org.positions[0].holder = a;
    expect(offers(a, 0, state).some((o) => o.kind === "propose")).toBe(true);
    expect(offers(a, 0, state).some((o) => o.kind === "support")).toBe(false);
    expect(offers(a, 0, { ...state, attendance: [{ org: org.id, person: a, activity: "assembly", t: 0 }] })
      .some((o) => o.kind === "support")).toBe(true);
    org.charter = { ...org.charter, decision_procedure: { type: "council", roles: ["chair"],
      procedure: { type: "position_holder", role: "chair" } } };
    expect(offers(a, 0, state).some((o) => o.kind === "propose")).toBe(true);
    expect(offers(a, 0, state).some((o) => o.kind === "support")).toBe(false);
  });

  it("does not invent a proposal procedure but exposes chartered elections and sanctions", () => {
    const org = actor();
    org.charter = { admission: [{ type: "open" }] };
    const state = snapshot(setup(), { organisations: [org] });
    expect(offers(a, 0, state).some((o) => o.kind === "propose")).toBe(false);
    org.charter = { ...org.charter, positions: [{ ...vote, position: "chair", term: "indefinite" }],
      sanctions: [{ type: "expulsion", procedure: vote }] };
    expect(offers(a, 0, state).filter((o) => o.kind === "propose").map((o) => o.payload)).toEqual([
      { action: "elect", role: "chair" }, { action: "sanction", component: 0 },
    ]);
  });

  it("offers founding joins only to named founders within the open inclusive window, without creating an actor", () => {
    const fixture = setup();
    const intention = draft(fixture.store, [a, b]);
    const state = snapshot(fixture, { foundingCircles: [{ intention, status: "open", joins: [] }] });
    const candidate = joinsFor(b, state)[0];
    expect(candidate).toMatchObject({ target: intention.target, source: { row: FORMATION_PROCESS, id: intention.target }, terms: intention.payload });
    expect(joinsFor(c, state)).toEqual([]);
    expect(offers(b, 10, state).some((o) => o.kind === "join")).toBe(true);
    expect(offers(b, 11, state).some((o) => o.kind === "join")).toBe(false);
    expect(joinsFor(b, { ...state, foundingCircles: [{ intention, status: "resolved", joins: [] }] })).toEqual([]);
    expect(joinsFor(b, { ...state, foundingCircles: [{ intention, status: "open",
      joins: [{ person: b, kind: "join", target: intention.target, t: 0 }] }] })).toEqual([]);
    expect(fixture.store.organisations()).toEqual([]);
  });

  it("offers contacts only toward known persons and avoids only existing outgoing ties", () => {
    const ties = network([a, b]).ties();
    const state = snapshot(setup(), { network: { known: [{ i: a, j: c }, { i: a, j: c }, { i: a, j: a }], ties } });
    const candidates = offers(a, 0, state).filter((o) => o.source.row === "society.comm_network");
    expect(candidates.filter((o) => o.kind === "seek_contact").map((o) => o.target)).toEqual([b, c]);
    expect(candidates.filter((o) => o.kind === "avoid_contact").map((o) => o.source.id))
      .toEqual(ties.filter((tie) => tie.i === a).map((tie) => tie.id));
    expect(offers(a, 0, { ...state, network: { known: [], ties: ties.filter((tie) => tie.j === a) } })
      .some((o) => o.kind === "avoid_contact")).toBe(false);
    expect(offers(a, 0, { ...state, unavailable: [b, c] }).some((o) => o.source.row === "society.comm_network")).toBe(false);
  });

  it("is byte-identical, uses numeric mint order, and detaches terms without changing its inputs", () => {
    const fixture = setup();
    const org = actor();
    const later = { ...structuredClone(org), id: "org.10000" as OrgId };
    const earlier = { ...structuredClone(org), id: "org.9999" as OrgId };
    const state = snapshot(fixture, { organisations: [later, earlier] });
    const before = JSON.stringify(state);
    const first = offers(b, 0, state);
    expect(JSON.stringify(offers(b, 0, state))).toBe(JSON.stringify(first));
    expect(JSON.stringify(offers(b, 0, { ...state, organisations: [earlier, later] }))).toBe(JSON.stringify(first));
    expect(first.filter((o) => o.kind === "join").map((o) => o.target)).toEqual([earlier.id, later.id]);
    (first[0].terms.charter as { admission: Admission[] }).admission[0] = { type: "fee", amount: 999 };
    expect(JSON.stringify(state)).toBe(before);
    expect(fixture.ledger.rows).toEqual([]);
  });

  it("rebuilds offers when an organisation disappears, including stale proposals and obligations", () => {
    const fixture = setup();
    const id = foundFixture(fixture.store);
    const state = snapshot(fixture, { proposals: [{ id: "proposal.1", status: "open",
      proposal: { person: a, kind: "propose", target: id, t: 0 } }] });
    expect(offers(a, 0, state).some((o) => o.source.id === id)).toBe(true);
    expect(offers(a, 0, { ...state, organisations: [] }).some((o) => o.source.id === id)).toBe(false);
    fixture.store.attempt({ person: a, kind: "leave", target: id, t: 0 });
    expect(offers(b, 0, snapshot(fixture)).some((o) => o.target === id)).toBe(false);
  });

  it("IF-46: an offered join selected by a stub mind is admitted through attempt and emits an outcome", () => {
    const fixture = setup();
    const id = foundFixture(fixture.store, [a], { ...charter, admission: [{ type: "fee", amount: 10 }] });
    const intention = stubMind(offers(b, 0, snapshot(fixture)), 0);
    const result = fixture.store.attempt(intention);
    expect(result).toMatchObject({ org: id, kind: "joined", intentions: [intention] });
    expect(fixture.store.memberships(b)).toEqual([id]);
    expect(fixture.ledger.balance(b)).toBe(90);
  });

  it("D3b / IF-46 A: a selected offer whose true payment precondition changes is refused with an outcome event", () => {
    const fixture = setup();
    const id = foundFixture(fixture.store, [a], { ...charter, admission: [{ type: "fee", amount: 10 }] });
    const candidates = offers(b, 0, snapshot(fixture));
    fixture.ledger.balances.set(b, 9);
    fixture.store.advanceTo(1);
    const intention = stubMind(candidates, 1);
    const result = fixture.store.attempt(intention);
    expect(result).toMatchObject({ org: id, kind: "refused", intentions: [intention],
      payload: { outcome: "refused", reason: "cannot pay admission fee" } });
    expect(fixture.store.events.at(-1)).toEqual(result);
    expect(fixture.store.memberships(b)).toEqual([]);
    expect(fixture.ledger.balance(b)).toBe(9);
    expect(offers(b, 1, snapshot(fixture)).some((o) => o.kind === "join")).toBe(false);
  });

  it("keeps vote approval at attempt time, where a missing decision produces a refused event", () => {
    const fixture = setup();
    foundFixture(fixture.store, [a], { ...charter, admission: [{ type: "vote", procedure: vote }] });
    const intention = stubMind(offers(b, 0, snapshot(fixture)), 0);
    expect(fixture.store.attempt(intention)).toMatchObject({ kind: "refused", intentions: [intention],
      payload: { reason: "admission requires a proposal naming this applicant" } });
  });

  it("registers the single affordance writer and carries no cognition or ranking fields", () => {
    const manifest = JSON.parse(readFileSync(new URL("../kernel.json", import.meta.url), "utf8"));
    const writers = manifest.processes.filter((p: { writes: string[] }) => p.writes.includes("society.affordance"));
    expect(writers).toHaveLength(1);
    expect(writers[0]).toMatchObject({ id: AFFORDANCE_PROCESS, writes: ["society.affordance"] });
    expect(writers[0].reads).toEqual(expect.arrayContaining(["society.organisation", "society.membership", "society.comm_network"]));
    const source = readFileSync(new URL("../src/affordance.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\bbelief\b|\btrust\b|\bscore\b|Math\.random|Date\.now/);
  });
});
