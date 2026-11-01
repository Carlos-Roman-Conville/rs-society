import { streams } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import { OrganisationStore, offers, validateCharter, CHOICE_PROCESS,
  type AffordanceState, type AmendmentPayload, type Charter, type CharterCapabilities, type DecisionProcedure,
  type SocialIntention } from "../src/index.ts";
import { a, b, c, d, charter, vote, foundFixture, attend, decision, setup } from "./lifecycle-fixture.ts";

// All identities, seeds, amounts, schedules and rule parameters are fixture (test only).
const unanimous: DecisionProcedure = { type: "unanimity", electorate: "all_members",
  eligibility: { type: "members" }, quorum: { type: "count", value: 1 } };
const rules: Charter = { ...charter, amendment: unanimous,
  obligations: [{ type: "dues", amount: 2, schedule: { first: 1, period: 1 } }],
  benefits: [...charter.benefits!, { type: "transfer", event: "life.illness_onset", amount: 3 }] };
const capabilities: CharterCapabilities = { events: ["life.illness_onset"], ports: ["settlement.ledger"],
  procedures: ["simple_majority", "unanimity", "qualified_majority", "position_holder", "council"] };
const dues: AmendmentPayload = { action: "amend", section: "obligations", component: 0, parameter: "amount", value: 5 };
const relief: AmendmentPayload = { action: "amend", section: "benefits", component: 1, parameter: "amount", value: 4 };

function fixture(composition = rules, seed = 27) {
  const { ledger, views } = setup();
  const random = streams(seed);
  const store = new OrganisationStore({ start: 0, counters: {}, ledger, views, capabilities, streams: random });
  const org = foundFixture(store, [a, b, c], composition);
  attend(store, org);
  return { store, ledger, views, random, org };
}
function propose(f: ReturnType<typeof fixture>, payload = dues, voters = [a, b, c]) {
  const request = decision(f.store, f.org, payload, voters);
  return f.store.attempt(request.proposal, { decision: request });
}
function snapshot(f: ReturnType<typeof fixture>, changes: Partial<AffordanceState> = {}): AffordanceState {
  return { organisations: f.store.organisations(), obligations: f.store.obligations,
    attendance: f.store.get(f.org)!.members.map((m) => ({ org: f.org, person: m.person, activity: "assembly", t: f.store.now })),
    proposals: [], foundingCircles: [], network: { known: [], ties: [] }, ledger: f.ledger,
    facts: {}, unavailable: [], ...changes };
}

describe("amendment acts (DESIGN §1.2a, §1.3, IF-46)", () => {
  it("uses the charter's amendment rule even when the ordinary majority would accept", () => {
    const f = fixture();
    const before = f.store.get(f.org);
    const rejected = propose(f, dues, [a, b]);
    expect(rejected).toMatchObject({ cause: CHOICE_PROCESS, payload: { outcome: "rejected", tally: { denominator: 3 } } });
    expect(f.store.get(f.org)).toEqual(before);
    expect(f.store.events.some((e) => e.payload?.amendmentApplied)).toBe(false);
    const accepted = propose(f);
    expect(accepted).toMatchObject({ org: f.org, kind: "act", cause: "charter amended", payload: {
      ...dues, previous: 2, amendmentApplied: true, outcome: "accepted", tally: { support: [a, b, c] },
    } });
    expect(accepted.intentions[0].payload).toEqual(dues);
    expect(accepted.intentions.slice(1).map((i) => i.person)).toEqual([a, b, c]);
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 5 });
    expect(validateCharter(f.store.get(f.org)!.charter, capabilities)).toEqual([]);
  });

  it("allows an amendment component to act without an ordinary decision procedure", () => {
    const f = fixture({ ...rules, decision_procedure: undefined });
    expect(propose(f).payload?.amendmentApplied).toBe(true);
  });

  it("refuses without an amendment component and offers no amendment or amendment ballot", () => {
    const f = fixture({ ...rules, amendment: undefined });
    const before = f.store.get(f.org);
    const request = decision(f.store, f.org, dues);
    expect(f.store.attempt(request.proposal, { decision: request })).toMatchObject({ kind: "refused", cause: "no amendment component" });
    const candidates = offers(a, 0, snapshot(f, { proposals: [{ id: request.proposalId, proposal: request.proposal, status: "open" }] }));
    expect(candidates.some((o) => o.payload?.action === "amend" || o.kind === "support")).toBe(false);
    expect(f.store.get(f.org)).toEqual(before);
  });

  it.each([null, undefined, 0, -1, NaN, Infinity])("refuses invalid amended charters with validator evidence: %s", (value) => {
    const f = fixture();
    const before = f.store.get(f.org), ledger = f.ledger.snapshot();
    const request = decision(f.store, f.org, { ...dues, value });
    const result = f.store.attempt(request.proposal, { decision: request });
    expect(result).toMatchObject({ kind: "refused", cause: "invalid amended charter",
      payload: { errors: ["obligations[0].amount: requires a finite positive number"] } });
    expect(f.store.get(f.org)).toEqual(before);
    expect(f.ledger.snapshot()).toEqual(ledger);
    expect(f.store.events.some((e) => e.payload?.amendmentApplied)).toBe(false);
  });

  it.each([
    { section: "name" }, { section: "amendment" }, { component: -1 }, { component: 0.5 },
    { component: 99 }, { parameter: "type" }, { parameter: "__proto__" }, { value: "5" },
  ])("refuses missing or nonnumeric component targets: %j", (change) => {
    const f = fixture();
    const before = f.store.get(f.org);
    const request = decision(f.store, f.org, { ...dues, ...change });
    expect(f.store.attempt(request.proposal, { decision: request }).kind).toBe("refused");
    expect(f.store.get(f.org)).toEqual(before);
  });

  it("conserves memberships and ledger balances, then uses new dues and benefits for later transfers", () => {
    const f = fixture();
    const before = f.store.get(f.org)!, ledger = f.ledger.snapshot(), views = f.views.snapshot();
    const total = () => [...f.ledger.balances.values()].reduce((sum, value) => sum + value, 0);
    const originalTotal = total();
    propose(f); propose(f, relief);
    expect(f.store.get(f.org)!.members).toEqual(before.members);
    for (const person of [a, b, c]) expect(f.store.memberships(person)).toEqual([f.org]);
    expect(f.ledger.snapshot()).toEqual(ledger);
    expect(f.views.snapshot()).toEqual(views);
    f.store.advanceTo(1);
    expect(f.ledger.balance(f.org)).toBe(15);
    for (const person of [a, b, c]) expect(f.ledger.balance(person)).toBe(95);
    expect(f.store.claim({ org: f.org, person: a, eventId: "illness.1", event: "life.illness_onset", t: 1 })[0])
      .toMatchObject({ cause: "benefit paid", payload: { benefit: { amount: 4 }, outcome: "paid" } });
    expect(f.ledger.balance(a)).toBe(99);
    expect(f.ledger.balance(f.org)).toBe(11);
    expect(total()).toBe(originalTotal);
    expect(f.store.get(f.org)!.members).toEqual(before.members);
  });

  it("offers numeric amendment terms and proposal ids for ballots without inventing a proposed value", () => {
    const f = fixture();
    const candidates = offers(a, 0, snapshot(f)).filter((o) => o.payload?.action === "amend");
    expect(candidates.map((o) => ({ target: o.target, terms: o.terms, payload: o.payload }))).toEqual([
      { target: f.org, terms: { value: 2 }, payload: { action: "amend", section: "obligations", component: 0, parameter: "amount" } },
      { target: f.org, terms: { value: 3 }, payload: { action: "amend", section: "benefits", component: 1, parameter: "amount" } },
    ]);
    const request = decision(f.store, f.org, dues);
    const ballots = offers(a, 0, snapshot(f, { proposals: [{ id: request.proposalId, proposal: request.proposal, status: "open" }] }))
      .filter((o) => ["support", "oppose", "abstain"].includes(o.kind));
    expect(ballots.map((o) => o.kind)).toEqual(["support", "oppose", "abstain"]);
    expect(ballots.every((o) => o.target === request.proposalId && Object.values(o.terms).every((v) => typeof v === "number"))).toBe(true);
    const candidate = candidates[0];
    const attempted: SocialIntention = { person: a, kind: "propose", target: candidate.target, t: 0,
      payload: { ...candidate.payload, value: 7 } };
    expect(f.store.attempt(attempted, { decision: request })).toMatchObject({ payload: { value: 7, amendmentApplied: true } });
    // The attempted intention is authoritative, never context.decision.proposal.
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 7 });
  });

  it("rechecks active membership and actual quorum when a previously offered amendment is attempted", () => {
    const f = fixture();
    expect(offers(a, 0, snapshot(f)).some((o) => o.payload?.action === "amend")).toBe(true);
    f.store.attempt({ person: a, kind: "leave", target: f.org, t: 0 });
    expect(propose(f)).toMatchObject({ kind: "refused", cause: "not a member" });
    f.store.advanceTo(1);
    expect(propose(f, dues, [b, c])).toMatchObject({ kind: "refused", payload: { reason: "no quorum" } });
    const outsider = decision(f.store, f.org, dues, [d]);
    expect(f.store.attempt(outsider.proposal, { decision: outsider }).cause).toBe("not a member");
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 2 });
  });

  it("uses amendment eligibility for both proposal and ballot offers, and again at attempt", () => {
    const restricted: DecisionProcedure = { ...vote, eligibility: { type: "positions", roles: ["chair"] } };
    const f = fixture({ ...rules, amendment: restricted,
      positions: [{ ...vote, position: "chair", term: "indefinite" }] });
    const request = decision(f.store, f.org, dues);
    const state = snapshot(f, { proposals: [{ id: request.proposalId, proposal: request.proposal, status: "open" }] });
    expect(offers(a, 0, state).some((o) => o.payload?.action === "amend" || o.kind === "support")).toBe(false);
    expect(f.store.attempt(request.proposal, { decision: request }))
      .toMatchObject({ kind: "refused", payload: { reason: "ineligible proposer" } });
  });

  it("rechecks current terms, publishes detached evidence and refuses replay of a resolved proposal", () => {
    const f = fixture();
    const request = decision(f.store, f.org, dues);
    const event = f.store.attempt(request.proposal, { decision: request });
    expect(f.store.attempt(request.proposal, { decision: request }).cause).toBe("proposal identity already resolved");
    expect(propose(f, { ...dues, value: 8 })).toMatchObject({ payload: { previous: 5, value: 8 } });
    (event.payload as Record<string, unknown>).value = 999;
    expect(f.store.events.find((e) => e.payload?.amendmentApplied)?.payload?.value).toBe(5);
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 8 });
  });

  it("same seed replays the rule's explicit lots, events, charter and ledger identically", () => {
    const run = (name: string, kind: string) => {
      const f = fixture({ ...rules, name, kind, amendment: { ...vote, base: "cast", tie_break: { type: "lots" } } }, 31);
      const request = decision(f.store, f.org, dues, [a, b]);
      request.ballots = [request.ballots[0], { ...request.ballots[1], kind: "oppose" }];
      const outcome = f.store.attempt(request.proposal, { decision: request });
      expect(outcome.payload?.tieBreak).toMatchObject({ type: "lots" });
      f.store.advanceTo(2);
      return { events: f.store.events, charter: f.store.get(f.org)!.charter, ledger: f.ledger.snapshot(), random: f.random.state() };
    };
    expect(run("fixture", "fixture")).toEqual(run("fixture", "fixture"));
    const first = run("fixture", "fixture"), renamed = run("unrelated", "unrelated");
    // Founding evidence preserves the supplied observer labels verbatim.
    expect(renamed.events.slice(1)).toEqual(first.events.slice(1));
    expect(renamed.ledger).toEqual(first.ledger);
  });
});
