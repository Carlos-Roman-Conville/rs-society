import { streams } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import { CHOICE_PROCESS, OrganisationStore, collectiveChoice, offers, validateCharter,
  type AffordanceState, type Charter, type DecisionProcedure, type DecisionRequest,
  type SocialIntention } from "../src/index.ts";
import { a, b, c, d, charter, capabilities, foundFixture, setup, vote } from "./lifecycle-fixture.ts";

// All durations, schedules, amounts, identities, seeds and rule values are fixture (test only).
const rules: Charter = { ...charter, decision_interval: 4, amendment: vote,
  benefits: [{ type: "meeting", activity: "assembly", schedule: { first: 0, period: 20 } }],
  obligations: [{ type: "dues", amount: 2, schedule: { first: 4, period: 4 } }] };
const dues = { action: "amend", section: "obligations", component: 0, parameter: "amount", value: 5 };
function fixture(composition = rules, persons = [a], seed = 27) {
  const { ledger, views } = setup();
  const random = streams(seed);
  const caps = { ...capabilities, procedures: ["simple_majority", "qualified_majority", "unanimity", "position_holder", "council"] as DecisionProcedure["type"][] };
  const store = new OrganisationStore({ start: 0, counters: {}, ledger, views, capabilities: caps, streams: random });
  const org = foundFixture(store, persons, composition);
  return { store, org, ledger, views, random, caps };
}
type Fixture = ReturnType<typeof fixture>;
function open(f: Fixture, payload: Record<string, unknown> = dues, id = "proposal.1", person = a): DecisionRequest {
  const request: DecisionRequest = { proposalId: id,
    proposal: { person, target: f.org, kind: "propose", t: f.store.now, payload }, ballots: [] };
  expect(f.store.attempt(request.proposal, { decision: request })).toMatchObject({ cause: "proposal opened", payload: { outcome: "open" } });
  return request;
}
function act(f: Fixture, kind: SocialIntention["kind"], person = a, id = "proposal.1") {
  return f.store.attempt({ person, target: id, kind, t: f.store.now });
}
function result(f: Fixture, id = "proposal.1") {
  return f.store.proposals.find((p) => p.id === id)!.result!;
}
function candidates(f: Fixture, person = a) {
  const state: AffordanceState = { organisations: f.store.organisations(), obligations: f.store.obligations,
    attendance: f.store.attendance, proposals: f.store.proposals, foundingCircles: [],
    network: { known: [], ties: [] }, facts: {}, unavailable: [], ledger: f.ledger };
  return offers(person, f.store.now, state);
}

describe("open proposals (DESIGN §1.3, §1.14.2, §1.15.2; IF-46)", () => {
  it("lets a solitary member propose, attend and support on different ticks, then applies the amendment at close", () => {
    const f = fixture();
    open(f);
    expect(f.store.events.filter((e) => e.cause === CHOICE_PROCESS)).toEqual([]);
    f.store.advanceTo(1);
    expect(candidates(f).some((o) => o.kind === "attend" && o.target === "proposal.1")).toBe(true);
    expect(act(f, "attend").cause).toBe("attended ballot");
    f.store.advanceTo(2);
    expect(act(f, "support").cause).toBe("ballot expressed");
    expect(candidates(f).some((o) => o.kind === "support")).toBe(false);
    f.store.advanceTo(3);
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 2 });
    f.store.advanceTo(4);
    expect(result(f)).toMatchObject({ t: 4, kind: "act", payload: {
      outcome: "accepted", tally: { eligible: [a], present: [a], support: [a], unexpressed: [], denominator: 1 },
    } });
    expect(f.store.events.find((e) => e.payload?.amendmentApplied)).toMatchObject({ t: 4,
      payload: { ...dues, previous: 2, outcome: "accepted", amendmentApplied: true } });
    expect(f.ledger.balance(f.org)).toBe(5); // New dues apply at the closing boundary.
    expect(act(f, "oppose")).toMatchObject({ kind: "refused", cause: "proposal is not open" });
    expect(candidates(f).some((o) => o.target === "proposal.1")).toBe(false);
    f.store.advanceTo(12);
    expect(f.store.events.filter((e) => e.cause === CHOICE_PROCESS)).toHaveLength(1);
  });

  it("records no quorum when an expressed remote vote has no expressed attendance", () => {
    const f = fixture();
    open(f); f.store.advanceTo(1); act(f, "support"); f.store.advanceTo(8);
    expect(result(f)).toMatchObject({ t: 4, kind: "refused", payload: { outcome: "no_act", reason: "no quorum",
      tally: { present: [], support: [a], quorumRequired: 1 } } });
    expect(f.store.get(f.org)!.charter.obligations![0]).toMatchObject({ amount: 2 });
  });

  it("allows explicit ballot attendance without a scheduled meeting and records expressed opposition", () => {
    const f = fixture({ ...rules, benefits: [] });
    open(f, { action: "act" });
    f.store.advanceTo(1); act(f, "attend");
    f.store.advanceTo(2); act(f, "oppose");
    f.store.advanceTo(4);
    expect(result(f).payload).toMatchObject({ outcome: "rejected", tally: { support: [], oppose: [a], present: [a] } });
  });

  it("does not open an ineligible proposal or a proposal lacking its own amendment authority", () => {
    for (const amendment of [undefined, { ...vote, eligibility: { type: "positions", roles: ["chair"] } } as DecisionProcedure]) {
      const f = fixture({ ...rules, amendment, positions: [{ ...vote, position: "chair", term: "indefinite" }] });
      const request: DecisionRequest = { proposalId: "proposal.1", proposal: {
        person: a, kind: "propose", target: f.org, t: 0, payload: dues }, ballots: [] };
      expect(f.store.attempt(request.proposal, { decision: request }).kind).toBe("refused");
      expect(f.store.proposals).toEqual([]);
    }
  });

  it("checks bundled ballots at the opening attempt and rolls back malformed or stale batches", () => {
    const f = fixture();
    const proposal: SocialIntention = { person: a, kind: "propose", target: f.org, t: 0, payload: dues };
    const request: DecisionRequest = { proposalId: "proposal.1", proposal, ballots: [
      { person: b, kind: "support", target: "proposal.1", t: 0 },
      { person: a, kind: "support", target: "proposal.1", t: 0 },
    ] };
    f.store.attempt(proposal, { decision: request });
    expect(f.store.proposals[0].ballots.map((v) => v.person)).toEqual([a]);
    expect(f.store.events.some((e) => e.kind === "refused" && e.intentions[0]?.person === b)).toBe(true);
    f.store.advanceTo(1);
    for (const ballot of [{ ...request.ballots[1], target: "proposal.2" },
      { ...request.ballots[1], target: "wrong", t: 1 }]) {
      expect(() => f.store.attempt({ ...proposal, t: 1 }, { decision: { ...request,
        proposalId: "proposal.2", ballots: [ballot] } })).toThrow();
      expect(f.store.proposals.map((p) => p.id)).toEqual(["proposal.1"]);
    }
  });

  it("refuses an overflowing closing time without leaving a partial proposal", () => {
    const f = fixture({ ...rules, obligations: [] });
    f.store.advanceTo(Number.MAX_SAFE_INTEGER - 1);
    const proposal: SocialIntention = { person: a, kind: "propose", target: f.org, t: f.store.now, payload: { action: "act" } };
    expect(() => f.store.attempt(proposal, { decision: { proposalId: "proposal.1", proposal, ballots: [] } })).toThrow();
    expect(f.store.proposals).toEqual([]);
  });

  it.each(["cast", "present", "members"] as const)("counts the %s base and quorum across the entire interval without filling absent votes", (base) => {
    const procedure: DecisionProcedure = { ...vote, base, quorum: { type: "count", value: 2 } };
    const f = fixture({ ...rules, decision_procedure: procedure }, [a, b, c]);
    open(f, { action: "petition", text: "fixture petition" });
    act(f, "attend", a); act(f, "support", a);
    f.store.advanceTo(1); act(f, "attend", b); act(f, "abstain", b);
    expect(act(f, "attend", b).kind).toBe("refused");
    f.store.advanceTo(7);
    expect(result(f)).toMatchObject({ t: 4, payload: { outcome: base === "cast" ? "accepted" : "rejected",
      tally: { present: [a, b], support: [a], oppose: [], abstain: [b], unexpressed: [c],
        denominator: base === "cast" ? 1 : base === "present" ? 2 : 3, quorumRequired: 2 } } });
  });

  it("drops a departing proposer and a dead nonvoter, recording both in mint order", () => {
    const f = fixture(rules, [a, b, c, d]);
    open(f); act(f, "attend"); act(f, "support");
    f.store.advanceTo(1);
    f.store.removePerson(b, "death");
    f.store.attempt({ person: a, kind: "leave", target: f.org, t: 1 });
    expect(act(f, "oppose", b).cause).toBe("person has died or departed");
    expect(act(f, "support", a).kind).toBe("refused");
    act(f, "attend", d); act(f, "support", d);
    f.store.advanceTo(2); act(f, "attend", c); act(f, "support", c);
    f.store.advanceTo(4);
    expect(result(f).payload).toMatchObject({ outcome: "accepted", tally: {
      eligible: [c, d], present: [c, d], electorate: [c, d], support: [c, d], denominator: 2,
      excluded: [{ person: a, reason: "left" }, { person: b, reason: "death" }],
    } });
    expect(result(f).intentions.map((i) => i.person)).toEqual([a, a, c, d]);
  });

  it("closes after loss of the last member and records the removal without inventing an electorate", () => {
    const f = fixture(); open(f); act(f, "attend"); act(f, "support");
    f.store.advanceTo(1); f.store.removePerson(a, "departure");
    expect(f.store.get(f.org)).toBeUndefined();
    f.store.advanceTo(10);
    expect(result(f)).toMatchObject({ t: 4, payload: { reason: "no quorum", tally: {
      eligible: [], support: [], excluded: [{ person: a, reason: "departure" }],
    } } });
  });

  it("does not restore a removed ballot when a member rejoins", () => {
    const f = fixture(rules, [a, b]); open(f); act(f, "attend", b); act(f, "support", b);
    f.store.advanceTo(1);
    f.store.attempt({ person: b, kind: "leave", target: f.org, t: 1 });
    f.store.attempt({ person: b, kind: "join", target: f.org, t: 1 });
    expect(act(f, "attend", b).kind).toBe("refused");
    f.store.advanceTo(4);
    expect(result(f).payload.tally).toMatchObject({ eligible: [a], support: [], excluded: [{ person: b, reason: "left" }] });
  });

  it("rechecks present-only eligibility, membership, ballot identity and current attempt time", () => {
    const f = fixture({ ...rules, decision_procedure: { ...vote, electorate: "present" } });
    const request = open(f, { action: "act" });
    expect(act(f, "support").cause).toBe("not eligible to vote now");
    expect(act(f, "support", b).kind).toBe("refused");
    expect(act(f, "support", a, "missing").kind).toBe("refused");
    f.store.advanceTo(1);
    // The scheduled assembly need not recur: this ballot keeps its meeting open.
    expect(f.store.attempt({ person: a, kind: "attend", target: f.org, t: 1, payload: { activity: "assembly" } }).cause).toBe("attended");
    f.store.advanceTo(2);
    expect(candidates(f).some((o) => o.kind === "support")).toBe(true);
    expect(act(f, "support").cause).toBe("ballot expressed");
    expect(act(f, "oppose").cause).toBe("ballot already expressed");
    expect(() => f.store.attempt({ person: a, kind: "support", target: request.proposalId, t: 1 })).toThrow(/clock/);
    expect(f.store.attempt({ ...request.proposal, t: 2 }, { decision: request }).cause).toBe("proposal identity already opened");
    f.store.advanceTo(4); expect(result(f).payload.outcome).toBe("accepted");
    expect(f.store.attempt({ ...request.proposal, t: 4 }, { decision: request }).cause).toBe("proposal identity already resolved");
  });

  it("rejects stale office eligibility at a vote attempt and at close", () => {
    const f = fixture({ ...rules, positions: [{ ...vote, position: "chair", term: 1 }],
      amendment: { type: "position_holder", role: "chair" } });
    open(f, { action: "elect", role: "chair", person: a }); act(f, "attend"); act(f, "support");
    f.store.advanceTo(4);
    open(f, dues, "proposal.2"); act(f, "attend", a, "proposal.2");
    expect(candidates(f).some((o) => o.kind === "support" && o.target === "proposal.2")).toBe(true);
    f.store.advanceTo(5);
    expect(act(f, "support", a, "proposal.2").cause).toBe("not eligible to vote now");
    f.store.advanceTo(8);
    expect(result(f, "proposal.2").payload.reason).toBe("no quorum");
  });

  it("keeps no-interval charters on the original same-tick path, including no quorum", () => {
    const f = fixture({ ...rules, decision_interval: undefined });
    const request: DecisionRequest = { proposalId: "instant.1", proposal: { person: a, kind: "propose", target: f.org,
      t: 0, payload: dues }, ballots: [{ person: a, kind: "support", target: "instant.1", t: 0 }] };
    const expected = collectiveChoice({ org: f.org, t: 0, proposalId: request.proposalId,
      proposal: request.proposal, intentions: request.ballots, members: [a], present: [], positions: [], procedure: vote });
    expect(f.store.attempt(request.proposal, { decision: request })).toEqual(expected);
    expect(f.store.proposals).toEqual([]);
    f.store.attempt({ person: a, kind: "attend", target: f.org, t: 0, payload: { activity: "assembly" } });
    const next = { ...request, proposalId: "instant.2", ballots: [{ ...request.ballots[0], target: "instant.2" }] };
    expect(f.store.attempt(next.proposal, { decision: next })).toMatchObject({ t: 0, payload: { amendmentApplied: true } });
    f.store.advanceTo(1);
    expect(() => f.store.attempt(request.proposal, { decision: request })).toThrow(/clock/);
  });

  it.each([null, 0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("refuses invalid interval %s without a default", (decision_interval) => {
    expect(validateCharter({ ...rules, decision_interval }, capabilities)).toContain(
      "decision_interval: requires positive safe integer Kernel milliseconds; no default");
  });

  it("closes simultaneous proposals in mint order and amends the current charter without losing earlier changes", () => {
    const f = fixture();
    open(f, { ...dues, value: 7 }, "proposal.10000");
    open(f, { ...dues, value: 3 }, "proposal.9999");
    for (const id of ["proposal.10000", "proposal.9999"]) { act(f, "attend", a, id); act(f, "support", a, id); }
    f.store.advanceTo(20);
    expect(f.store.events.filter((e) => e.payload?.amendmentApplied).map((e) => [e.payload!.proposalId, e.payload!.previous, e.payload!.value]))
      .toEqual([["proposal.9999", 2, 3], ["proposal.10000", 3, 7]]);
  });

  it("uses a closed admission ballot only with an applicant's own current join intention", () => {
    const f = fixture({ ...rules, admission: [{ type: "vote", procedure: vote }] });
    const request = open(f, { action: "admit", person: b }); act(f, "attend"); act(f, "support");
    expect(f.store.attempt({ person: b, kind: "join", target: f.org, t: 0 }, { decision: request }).kind).toBe("refused");
    f.store.advanceTo(4);
    expect(f.store.memberships(b)).toEqual([]);
    expect(f.store.attempt({ person: b, kind: "join", target: f.org, t: 4 }, { decision: request }).kind).toBe("joined");
    f.store.attempt({ person: b, kind: "leave", target: f.org, t: 4 });
    expect(f.store.attempt({ person: b, kind: "join", target: f.org, t: 4 }, { decision: request }).cause).toBe("proposal identity already resolved");
    expect(f.store.events.filter((e) => e.cause === CHOICE_PROCESS && e.payload?.outcome === "accepted")).toHaveLength(1);
  });

  it("requires closed ballots from both organisations before merging", () => {
    const f = fixture();
    const other = foundFixture(f.store, [b], rules);
    const payload = { action: "merge", source: other, survivor: f.org };
    const first = open(f, payload);
    const second = open({ ...f, org: other }, payload, "proposal.2", b);
    act(f, "attend"); act(f, "support"); act(f, "attend", b, "proposal.2"); act(f, "support", b, "proposal.2");
    expect(f.store.merge(f.org, other, [first, second]).kind).toBe("refused");
    f.store.advanceTo(4);
    expect(f.store.merge(f.org, other, [first, second]).kind).toBe("merged");
    expect(f.store.get(f.org)!.members.map((m) => m.person)).toEqual([a, b]);
    expect(f.store.get(other)).toBeUndefined();
  });

  it("applies a closed split approval only with each member's expressed current choice", () => {
    const f = fixture(rules, [a, b]);
    const other = foundFixture(f.store, [c], rules);
    const successors = [f.org, other];
    const request = open(f, { action: "split", successors });
    for (const person of [a, b]) { act(f, "attend", person); act(f, "support", person); }
    const choices = (t: number): SocialIntention[] => [
      { person: a, kind: "join", target: f.org, t }, { person: b, kind: "join", target: other, t },
    ];
    expect(f.store.split({ source: f.org, successors, choices: choices(0), cause: "fixture split" }, request).kind).toBe("refused");
    f.store.advanceTo(4);
    expect(f.store.split({ source: f.org, successors, choices: choices(4), cause: "fixture split" }, request).kind).toBe("split");
    expect(f.store.memberships(a)).toEqual([f.org]);
    expect(f.store.memberships(b)).toEqual([other]);
  });

  it("rolls the clock, closure, ledger and proposal back together when applying an act fails", () => {
    const f = fixture(); open(f, { action: "dissolve" }); act(f, "attend"); act(f, "support");
    const before = { events: f.store.events, proposals: f.store.proposals, ledger: f.ledger.snapshot(), random: f.random.state() };
    f.views.fail = true;
    expect(() => f.store.advanceTo(8)).toThrow("view failed");
    expect(f.store.now).toBe(0);
    expect({ events: f.store.events, proposals: f.store.proposals, ledger: f.ledger.snapshot(), random: f.random.state() }).toEqual(before);
    f.views.fail = false; f.store.advanceTo(8);
    expect(f.store.get(f.org)).toBeUndefined();
    expect(result(f).payload.outcome).toBe("accepted");
  });

  it("replays expressed opposing ballots and declared lots identically with the same seed", () => {
    const run = () => {
      const f = fixture({ ...rules, amendment: { ...vote, base: "cast", tie_break: { type: "lots" } } }, [a, b], 31);
      open(f); act(f, "attend"); act(f, "support");
      f.store.advanceTo(1); act(f, "attend", b); act(f, "oppose", b);
      const detached = f.store.proposals;
      detached[0].ballots.length = 0;
      f.store.advanceTo(8);
      expect(result(f).payload.tieBreak).toMatchObject({ type: "lots" });
      return { events: f.store.events, proposals: f.store.proposals, orgs: f.store.organisations(),
        ledger: f.ledger.snapshot(), random: f.random.state() };
    };
    expect(run()).toEqual(run());
  });
});
