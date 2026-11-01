import { readFileSync } from "node:fs";
import { Scheduler, streams, type Counters } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import { draft, joins, network } from "./lifecycle-fixture.ts";
import { publicAuthority } from "./public-authority.ts";
import { OrganisationStore, ORGANISATION_PROCESS, mintId, type AccountId, type Charter, type CharterCapabilities,
  type DecisionRequest, type InventoryPort, type LedgerPort, type OrganisationFacts, type OrgId,
  type PersonId, type SocialIntention, type ViewsPort } from "../src/index.ts";

// All amounts, dates, periods, roles, seeds and population sizes are fixture (test only).
let counters: Counters = {};
const people = Array.from({ length: 12 }, () => {
  const next = mintId(counters, "person"); counters = next.counters; return next.id;
});
const [a, b, c, d] = people;
const vote = { type: "simple_majority", electorate: "all_members", eligibility: { type: "members" },
  quorum: { type: "count", value: 1 } } as const;
const open: Charter = { admission: [{ type: "open" }] };
const meeting = { type: "meeting", activity: "assembly", schedule: { first: 0, period: 1 } } as const;
const voting: Charter = { ...open, decision_procedure: vote, benefits: [meeting] };
const capabilities: CharterCapabilities = { events: ["life.illness_onset", "life.death"],
  ports: ["settlement.ledger", "economy.inventory", "fixture.occupation"],
  procedures: ["simple_majority", "qualified_majority", "unanimity", "position_holder", "council"] };

class Ledger implements LedgerPort {
  id = "fixture.ledger";
  balances = new Map<AccountId, number>(people.map((p) => [p, 100]));
  rows: { from: AccountId; to: AccountId; amount: number; reason: string }[] = [];
  fail = false;
  balance(account: AccountId) { return this.balances.get(account) ?? 0; }
  transfer(from: AccountId, to: AccountId, amount: number, reason: string) {
    if (!Number.isFinite(amount) || amount <= 0 || this.balance(from) < amount) throw new Error("insufficient ledger funds");
    this.balances.set(from, this.balance(from) - amount);
    this.balances.set(to, this.balance(to) + amount);
    this.rows.push({ from, to, amount, reason });
    if (this.fail) throw new Error("forced ledger failure after mutation");
  }
  snapshot() { return structuredClone({ balances: this.balances, rows: this.rows }); }
  restore(snapshot: unknown) { Object.assign(this, snapshot); }
  total() { return [...this.balances.values()].reduce((sum, value) => sum + value, 0); }
}
class Inventory implements InventoryPort {
  id = "fixture.inventory";
  quantities = new Map<string, number>();
  fail = false;
  quantity(account: AccountId, good: string) { return this.quantities.get(`${account}/${good}`) ?? 0; }
  transfer(from: AccountId, to: AccountId, good: string, quantity: number) {
    this.quantities.set(`${from}/${good}`, this.quantity(from, good) - quantity);
    this.quantities.set(`${to}/${good}`, this.quantity(to, good) + quantity);
    if (this.fail) throw new Error("forced inventory failure");
  }
  snapshot() { return new Map(this.quantities); }
  restore(snapshot: unknown) { this.quantities = snapshot as Map<string, number>; }
}
class Views implements ViewsPort {
  id = "fixture.views";
  calls: unknown[][] = [];
  fail = false;
  onCreated(id: OrgId) { this.calls.push(["created", id]); if (this.fail) throw new Error("forced view failure"); }
  onMerged(source: OrgId, survivor: OrgId) { this.calls.push(["merged", source, survivor]); if (this.fail) throw new Error("forced view failure"); }
  onDissolved(id: OrgId) { this.calls.push(["dissolved", id]); if (this.fail) throw new Error("forced view failure"); }
  closeBusiness(id: string) { this.calls.push(["close", id]); }
  snapshot() { return structuredClone(this.calls); }
  restore(snapshot: unknown) { this.calls = snapshot as unknown[][]; }
}
function setup(facts?: OrganisationFacts) {
  const ledger = new Ledger(), views = new Views(), inventory = new Inventory(), random = streams(27);
  const store = new OrganisationStore({ start: 0, counters: {}, ledger, views, inventory, facts, capabilities, streams: random });
  return { store, ledger, views, inventory, random };
}
function found(store: OrganisationStore, charter = open, founders: PersonId[] = [a], businesses: string[] = []) {
  const event = foundingAttempt(store, charter, founders, businesses);
  expect(event.kind).toBe("founded");
  return event.org;
}
function foundingAttempt(store: OrganisationStore, charter: Charter, founders: PersonId[] = [c], businesses: string[] = []) {
  const intention = draft(store, founders, { ...charter, founding: { window: 1, minimum: 1 } }, businesses);
  return store.found(intention, joins(intention), network(people, store.now));
}
function act(store: OrganisationStore, org: OrgId, person: PersonId, kind: SocialIntention["kind"], payload?: Record<string, unknown>) {
  return store.attempt({ person, kind, target: org, t: store.now, payload });
}
function attend(store: OrganisationStore, org: OrgId, persons: readonly PersonId[]) {
  for (const person of persons) expect(act(store, org, person, "attend", { activity: "assembly" }).cause).toBe("attended");
}
function decision(store: OrganisationStore, org: OrgId, proposer: PersonId, voters: readonly PersonId[],
  payload: Record<string, unknown>, proposalId = `proposal.${store.events.length}`): DecisionRequest {
  return { proposalId, proposal: { person: proposer, kind: "propose", target: org, t: store.now, payload },
    ballots: voters.map((person) => ({ person, kind: "support", target: proposalId, t: store.now })) };
}
function propose(store: OrganisationStore, request: DecisionRequest) {
  return store.attempt(request.proposal, { decision: request });
}

describe("organisation authority and lifecycle (DESIGN §1.2, DUP-58)", () => {
  it("creates one Society id, exposes detached records and rejects missing executable charter inputs", () => {
    const { store, views } = setup();
    const org = found(store, open, [b, a]);
    expect(views.calls).toEqual([["created", org]]);
    expect(store.get(org)).toMatchObject({ id: org, founded_at: 0, founders: [a, b], members: [
      { person: a, joined_at: 0, role: "member", standing: "active" },
      { person: b, joined_at: 0, role: "member", standing: "active" },
    ] });
    store.get(org)!.members.splice(0);
    (store.organisations() as unknown[]).splice(0);
    expect(store.memberships(a)).toEqual([org]);
    const refusal = foundingAttempt(store, {
      admission: [{ type: "sponsored", members: 1 }],
    });
    expect(refusal).toMatchObject({ kind: "refused", cause: "admission requires current sponsor facts" });
    expect(store.organisations()).toHaveLength(1);
  });
  it("DUP-58 (3): every public callable's declared adapters lack membership/leadership authority", () => {
    const result = publicAuthority();
    expect(result.checked).toEqual(expect.arrayContaining(["mintId", "validateCharter", "collectiveChoice",
      "pairwiseCollectiveChoice", "CommunicationNetwork", "OrganisationStore", "OrganisationStore.attempt", "OrganisationStore.found"]));
    expect(result.violations).toEqual([]);
  });
  it("DUP-58 (3): the export/parameter check catches renamed functions and nested decision ports", () => {
    const result = publicAuthority(`
      export { collectiveChoice as renamedChoice } from "./src/choice.ts";
      interface HiddenPort { chooseMembers(): string[]; elect(): string }
      export function innocuous(options: { ports: { settlement: HiddenPort } }): void {}
      export class InnocuousStore {
        update(input: { views: { decide(): boolean } }): void {}
        static configure(views: { select(): string }): void {}
      }
    `);
    expect(result.checked).toContain("renamedChoice");
    expect(result.violations.some((error) => error.startsWith("innocuous.options.ports:"))).toBe(true);
    expect(result.violations.some((error) => error.startsWith("InnocuousStore.update.input.views:"))).toBe(true);
    expect(result.violations.some((error) => error.startsWith("InnocuousStore.configure.views:"))).toBe(true);
  });
  it("dissolves on last exit and closes each pointing business exactly once", () => {
    const { store, views } = setup();
    const org = found(store, open, [a, b], ["business.0001", "business.0002"]);
    expect(act(store, org, a, "leave").kind).toBe("left");
    expect(store.get(org)?.members).toHaveLength(1);
    act(store, org, b, "leave");
    expect(store.get(org)).toBeUndefined();
    expect(views.calls).toEqual([["created", org], ["close", "business.0001"], ["close", "business.0002"], ["dissolved", org]]);
    expect(act(store, org, b, "leave").kind).toBe("refused");
    expect(views.calls).toHaveLength(4);
    expect(store.events.at(-2)?.kind).toBe("dissolved");
  });
  it("death and departure remove all memberships and prevent later stale joins", () => {
    const { store } = setup();
    const first = found(store, open, [a, b]), second = found(store, open, [a]);
    expect(store.removePerson(a, "death").map((e) => e.kind)).toEqual(["left", "left", "dissolved"]);
    expect(store.memberships(a)).toEqual([]);
    expect(store.get(second)).toBeUndefined();
    expect(act(store, first, a, "join").cause).toBe("person has died or departed");
    store.removePerson(b, "departure");
    expect(store.organisations()).toEqual([]);
  });
  it("rolls creation and dissolution back with view commands, including the id counter", () => {
    const { store, views } = setup();
    views.fail = true;
    expect(() => found(store)).toThrow("forced view failure");
    expect(store.events).toEqual([]); expect(store.organisations()).toEqual([]); expect(views.calls).toEqual([]);
    views.fail = false;
    const org = found(store, open, [a], ["business.0001"]);
    expect(org).toBe(mintId({}, "org").id);
    views.fail = true;
    expect(() => act(store, org, a, "leave")).toThrow("forced view failure");
    expect(store.memberships(a)).toEqual([org]); expect(store.events).toHaveLength(1);
    expect(views.calls).toEqual([["created", org]]);
  });
  it("merges only after both actors pass the same proposal and repoints businesses without closing them", () => {
    const { store, views } = setup();
    const survivor = found(store, voting, [a, b], ["business.0001"]), source = found(store, voting, [b, c], ["business.0002"]);
    const payload = { action: "merge", survivor, source };
    attend(store, survivor, [a, b]); attend(store, source, [b, c]);
    const no = decision(store, source, b, [], payload, "merge.no");
    expect(store.merge(survivor, source, [decision(store, survivor, a, [a, b], payload, "merge.yes"), no]).kind).toBe("refused");
    expect(store.organisations()).toHaveLength(2);
    views.fail = true;
    const requests = [decision(store, survivor, a, [a, b], payload, "merge.1"), decision(store, source, b, [b, c], payload, "merge.2")] as const;
    const before = store.events;
    expect(() => store.merge(survivor, source, requests)).toThrow("forced view failure");
    expect(store.events).toEqual(before); expect(store.organisations()).toHaveLength(2);
    views.fail = false;
    expect(store.merge(survivor, source, requests).kind).toBe("merged");
    expect(store.get(source)).toBeUndefined();
    expect(store.get(survivor)?.members.map((m) => m.person)).toEqual([a, b, c]);
    expect(store.get(survivor)?.businesses).toEqual(["business.0001", "business.0002"]);
    expect(views.calls.at(-1)).toEqual(["merged", source, survivor]);
    for (const p of [a, b, c]) act(store, survivor, p, "leave");
    expect(views.calls.filter(([op]) => op === "close")).toEqual([["close", "business.0001"], ["close", "business.0002"]]);
  });
});

describe("attempts check true state at attempt time (IF-46 amendment A)", () => {
  it("refuses an occupation join with its reason despite the applicant's asserted payload", () => {
    let occupation = false;
    const { store } = setup({ occupation: () => occupation });
    const org = found(store, { admission: [{ type: "occupation", occupation: "gardener", port: "fixture.occupation" }] });
    expect(act(store, org, b, "join", { occupation: "gardener" })).toMatchObject({ kind: "refused", payload: { reason: "occupation admission not met" } });
    expect(store.memberships(b)).toEqual([]);
    occupation = true;
    expect(act(store, org, b, "join").kind).toBe("joined");
  });
  it("combines current sponsorship, kinship and fee rules; departed sponsors and duplicates cannot count", () => {
    const { store, ledger } = setup({ sponsors: () => [a, a, b], kinship: (person, member) => person === c && member === a });
    const org = found(store, { admission: [{ type: "sponsored", members: 2 }, { type: "kinship", relation: "sibling" }, { type: "fee", amount: 3 }] }, [a, b]);
    const foundingRows = ledger.snapshot();
    act(store, org, b, "leave");
    expect(act(store, org, c, "join").cause).toContain("sponsors");
    expect(ledger.snapshot()).toEqual(foundingRows);
    // A separate circle with both current sponsors satisfies the same composition.
    const second = found(store, store.get(org)!.charter, [a, b]);
    expect(act(store, second, d, "join").cause).toContain("kinship");
    ledger.balances.set(c, 0);
    expect(act(store, second, c, "join").cause).toContain("cannot pay");
    ledger.balances.set(c, 10);
    ledger.fail = true;
    expect(() => act(store, second, c, "join")).toThrow("forced ledger failure");
    expect(store.memberships(c)).toEqual([]); expect(ledger.balance(c)).toBe(10);
    ledger.fail = false;
    expect(act(store, second, c, "join").kind).toBe("joined");
    expect(ledger.balance(second)).toBe(9); // Two founders and the admitted member pay the declared fee.
  });
  it("vote admission runs collective choice with current membership and actual attendance", () => {
    const { store } = setup();
    const org = found(store, { ...voting, admission: [{ type: "vote", procedure: vote }] }, [a, b]);
    const join: SocialIntention = { person: c, kind: "join", target: org, t: 0 };
    const request = () => decision(store, org, a, [a, b], { action: "admit", person: c });
    expect(store.attempt(join, { decision: request() }).cause).toBe("no quorum");
    expect(store.events.some((e) => e.payload?.tally)).toBe(true);
    attend(store, org, [a, b]);
    expect(store.attempt(join, { decision: request() }).kind).toBe("joined");
    expect(store.memberships(c)).toEqual([org]);
    expect(act(store, org, c, "join").cause).toBe("already a member");
  });
  it("attendance, payment and proposals refuse unavailable actions; prior attendance supplies no current quorum", () => {
    const { store } = setup();
    const org = found(store, voting);
    expect(act(store, org, b, "attend", { activity: "assembly" }).cause).toBe("not a member");
    expect(act(store, org, a, "attend", { activity: "imagined" }).cause).toBe("no such meeting now");
    expect(act(store, org, a, "pay", { amount: 1 }).cause).toBe("no such unpaid obligation");
    attend(store, org, [a]);
    expect(propose(store, decision(store, org, a, [a], { action: "act" })).payload?.outcome).toBe("accepted");
    store.advanceTo(1);
    expect(propose(store, decision(store, org, a, [a], { action: "act" })).payload?.reason).toBe("no quorum");
    expect(() => store.attempt({ person: a, kind: "leave", target: org, t: 0 })).toThrow("Kernel clock");
  });
  it("consumes an admission vote even if a later fee rule refuses the join", () => {
    const { store, ledger } = setup();
    const org = found(store, { ...voting, admission: [{ type: "vote", procedure: vote }, { type: "fee", amount: 2 }] });
    attend(store, org, [a]);
    ledger.balances.set(b, 0);
    const request = decision(store, org, a, [a], { action: "admit", person: b });
    const intention: SocialIntention = { person: b, kind: "join", target: org, t: 0 };
    expect(store.attempt(intention, { decision: request }).cause).toBe("cannot pay admission fee");
    ledger.balances.set(b, 2);
    expect(store.attempt(intention, { decision: request }).cause).toBe("proposal identity already resolved");
    expect(store.memberships(b)).toEqual([]);
    expect(store.attempt(intention, { decision: decision(store, org, a, [a], { action: "admit", person: b }) }).kind).toBe("joined");
  });
  it("uses the actual propose intention, accepts detached inputs, and refuses invalid sanction indexes", () => {
    const { store } = setup();
    const org = found(store, { ...voting, sanctions: [{ type: "expulsion", procedure: vote }] });
    attend(store, org, [a]);
    const request = decision(store, org, a, [a], {});
    expect(store.attempt(structuredClone(request.proposal), { decision: request }).payload?.outcome).toBe("accepted");
    expect(propose(store, request).cause).toBe("proposal identity already resolved");
    expect(propose(store, decision(store, org, a, [a], { action: "sanction", component: "map", person: a })).kind).toBe("refused");
    expect(store.memberships(a)).toEqual([org]);
  });
});

describe("obligations and resources (DESIGN §1.2, §2.3)", () => {
  const dues: Charter = { ...voting, obligations: [{ type: "dues", amount: 3, schedule: { first: 5, period: 5 } }] };
  it("runs dues on Kernel time, catches up every period, and never charges before joining or twice", () => {
    const { store, ledger } = setup();
    const org = found(store, dues);
    const clock = new Scheduler({ order: { phases: ["society"], order: { society: [ORGANISATION_PROCESS] } } });
    clock.register({ id: ORGANISATION_PROCESS, mechanisms: [], period: 1, phase: "society", run: (ctx) => store.advanceTo(ctx.t) });
    clock.runUntil(4); expect(ledger.rows).toHaveLength(0);
    clock.runUntil(5); expect(ledger.balance(org)).toBe(3);
    act(store, org, b, "join");
    store.advanceTo(15); store.advanceTo(15);
    expect(store.obligations.map((d) => [d.person, d.due_at])).toEqual([[a, 5], [a, 10], [b, 10], [a, 15], [b, 15]]);
    expect(ledger.balance(org)).toBe(15);
    expect(ledger.total()).toBe(1200);
    expect(store.events.filter((e) => e.cause === "dues paid")).toHaveLength(5);
  });
  it("a late ledger failure rolls back earlier transfers, events, due rows and the clock; retry commits both", () => {
    const { store, ledger } = setup();
    const org = found(store, dues, [a, b]);
    const original = ledger.transfer.bind(ledger);
    ledger.transfer = (...args) => { original(...args); if (args[0] === b) throw new Error("second payment fails"); };
    expect(() => store.advanceTo(5)).toThrow("second payment fails");
    expect(store.now).toBe(0); expect(store.obligations).toEqual([]); expect(store.events).toHaveLength(1);
    expect(ledger.rows).toEqual([]); expect(ledger.balance(org)).toBe(0); expect(ledger.balance(a)).toBe(100);
    ledger.transfer = original;
    store.advanceTo(5);
    expect(ledger.rows).toHaveLength(2); expect(store.events.filter((e) => e.cause === "dues paid")).toHaveLength(2);
  });
  it("clock subdivision changes neither due outcomes nor transfers and respects integer boundaries", () => {
    const coarse = setup(), fine = setup();
    found(coarse.store, dues); found(fine.store, dues);
    coarse.store.advanceTo(20);
    for (let t = 1; t <= 20; t++) fine.store.advanceTo(t);
    expect(coarse.store.events).toEqual(fine.store.events);
    expect(coarse.ledger.snapshot()).toEqual(fine.ledger.snapshot());
    expect(() => fine.store.advanceTo(19)).toThrow("reverse");
    expect(() => fine.store.advanceTo(20.5)).toThrow("integer");
    const bad = foundingAttempt(fine.store, {
      ...open, obligations: [{ type: "dues", amount: 1, schedule: { first: 21, period: 0.5 } }],
    });
    expect(bad.cause).toContain("integer milliseconds");
  });
  it("records unpaid dues without automatic sanctions and accepts an explicit later payment exactly once", () => {
    const { store, ledger } = setup();
    const org = found(store, { ...dues, sanctions: [{ type: "expulsion", procedure: vote }] });
    ledger.balances.set(a, 0);
    store.advanceTo(5);
    expect(store.obligations[0].status).toBe("unpaid");
    expect(store.get(org)?.members[0].standing).toBe("active");
    expect(store.events.at(-1)?.payload?.reason).toBe("want of resources");
    ledger.balances.set(a, 3);
    expect(act(store, org, a, "pay", { component: 0, due_at: 5 }).cause).toBe("dues paid");
    expect(act(store, org, a, "pay", { component: 0, due_at: 5 }).kind).toBe("refused");
    expect(ledger.rows).toHaveLength(1);
  });
  it("records attendance and service obligations, and enforces declared exclusivity at join time", () => {
    const { store } = setup({ serviceHours: () => 2 });
    const other = found(store, open, [b]);
    const org = found(store, { ...open, obligations: [
      { type: "attendance", activity: "assembly", schedule: { first: 5, period: 5 } },
      { type: "service", activity: "repair", hours: 2, schedule: { first: 5, period: 5 } },
      { type: "exclusivity", organisations: [other] },
    ] });
    expect(act(store, org, b, "join").kind).toBe("refused");
    store.advanceTo(5);
    expect(store.obligations.map((o) => o.status)).toEqual(["unfulfilled", "fulfilled"]);
    expect(act(store, org, a, "attend", { activity: "assembly" }).cause).toBe("attended");
    expect(store.obligations[0].status).toBe("fulfilled");
  });
  it("records an empty-account benefit failure; resource-backed payments conserve money and prevent replay", () => {
    const { store, ledger } = setup();
    const org = found(store, { ...open, benefits: [{ type: "transfer", event: "life.illness_onset", amount: 4 }] });
    const claim = { org, person: a, event: "life.illness_onset", eventId: "illness.1", t: 0 };
    expect(store.claim(claim)[0]).toMatchObject({ kind: "refused", payload: { outcome: "failed", reason: "want of resources" } });
    expect(ledger.rows).toEqual([]);
    ledger.transfer(b, org, 10, "fixture funding");
    expect(store.claim(claim)[0].cause).toBe("event already claimed");
    const success = { ...claim, eventId: "illness.2" };
    ledger.fail = true;
    const before = store.events;
    expect(() => store.claim(success)).toThrow("forced ledger failure");
    expect(store.events).toEqual(before); expect(ledger.balance(org)).toBe(10);
    ledger.fail = false;
    expect(store.claim(success)[0].payload?.outcome).toBe("paid");
    expect(ledger.balance(org)).toBe(6); expect(ledger.total()).toBe(1200);
    expect(store.claim({ ...success, person: c })[0].kind).toBe("refused");
  });
  it("goods benefits use the inventory participant and roll back after a transfer failure", () => {
    const { store, inventory } = setup();
    const org = found(store, { ...open, benefits: [{ type: "goods", event: "life.illness_onset", good: "grain", quantity: 2 }] });
    inventory.quantities.set(`${org}/grain`, 3);
    const claim = { org, person: a, event: "life.illness_onset", eventId: "illness.1", t: 0 };
    inventory.fail = true;
    expect(() => store.claim(claim)).toThrow("forced inventory failure");
    expect(inventory.quantity(org, "grain")).toBe(3);
    inventory.fail = false;
    store.claim(claim);
    expect(inventory.quantity(org, "grain") + inventory.quantity(a, "grain")).toBe(3);
    expect(store.claim({ ...claim, eventId: "illness.2" })[0].payload?.reason).toBe("want of resources");
  });
});

describe("collective acts and membership accounting", () => {
  it("only a passed §1.3 sanction expels a member; a passed dissolution closes the actor", () => {
    const { store } = setup();
    const org = found(store, { ...voting, sanctions: [{ type: "expulsion", procedure: vote }] }, [a, b, c]);
    const payload = { action: "sanction", component: 0, person: c };
    expect(propose(store, decision(store, org, a, [a, b], payload)).kind).toBe("refused");
    expect(store.get(org)?.members).toHaveLength(3);
    attend(store, org, [a, b]);
    expect(propose(store, decision(store, org, a, [a, b], payload)).payload?.outcome).toBe("accepted");
    expect(store.memberships(c)).toEqual([]);
    expect(store.events.at(-1)).toMatchObject({ kind: "expelled", payload: { person: c } });
    propose(store, decision(store, org, a, [a, b], { action: "dissolve" }));
    expect(store.get(org)).toBeUndefined();
    expect(store.memberships(a)).toEqual([]);
  });
  it("position elections, suspension and expiry use declared rules and current eligibility", () => {
    const { store } = setup();
    const org = found(store, { ...voting, positions: [{ ...vote, position: "chair", term: 3 }],
      sanctions: [{ type: "suspension", duration: 2, procedure: vote }] }, [a, b]);
    attend(store, org, [a, b]);
    propose(store, decision(store, org, a, [a, b], { action: "elect", role: "chair", person: b }));
    expect(store.get(org)?.positions[0]).toMatchObject({ holder: b, until: 3 });
    propose(store, decision(store, org, a, [a, b], { action: "sanction", component: 0, person: b }));
    expect(act(store, org, b, "attend", { activity: "assembly" }).cause).toBe("membership suspended");
    store.advanceTo(2); expect(store.get(org)?.members[1].standing).toBe("active");
    store.advanceTo(3); expect(store.get(org)?.positions[0].holder).toBeNull();
  });
  it("membership identity closes after every seeded join, leave, death, expulsion and departure attempt", () => {
    const random = streams(83).get("fixture.membership", "run.1");
    const { store, ledger } = setup();
    const org = found(store, { ...voting, sanctions: [{ type: "expulsion", procedure: vote }],
      obligations: [{ type: "dues", amount: 1, schedule: { first: 1, period: 1 } }] });
    const expected = new Set<PersonId>([a]), unavailable = new Set<PersonId>();
    const counts = { joins: 0, leaves: 0, deaths: 0, expulsions: 0, departures: 0 };
    for (let t = 1; t <= 250; t++) {
      store.advanceTo(t);
      const person = people[1 + Math.floor(random() * (people.length - 1))];
      const operation = Math.floor(random() * (t < 100 ? 5 : 7));
      const before = expected.size;
      if (operation < 3) {
        const event = act(store, org, person, "join");
        const accept = !expected.has(person) && !unavailable.has(person);
        expect(event.kind).toBe(accept ? "joined" : "refused");
        if (accept) { expected.add(person); counts.joins++; }
      } else if (operation === 3) {
        const event = act(store, org, person, "leave");
        if (expected.delete(person)) { expect(event.kind).toBe("left"); counts.leaves++; }
        else expect(event.kind).toBe("refused");
      } else if (operation === 4 && expected.has(person)) {
        attend(store, org, [...expected]);
        const event = propose(store, decision(store, org, a, [...expected], { action: "sanction", component: 0, person }));
        expect(event.payload?.outcome).toBe("accepted"); expected.delete(person); counts.expulsions++;
      } else if (operation >= 5) {
        const cause = operation === 5 ? "death" : "departure";
        store.removePerson(person, cause); unavailable.add(person);
        if (expected.delete(person)) counts[cause === "death" ? "deaths" : "departures"]++;
      }
      expect(store.get(org)?.members.map((m) => m.person)).toEqual([...expected].sort());
      expect(expected.size).toBe(1 + counts.joins - counts.leaves - counts.deaths - counts.expulsions - counts.departures);
      expect(Math.abs(expected.size - before)).toBeLessThanOrEqual(1);
      for (const p of people) expect(store.memberships(p)).toEqual(expected.has(p) ? [org] : []);
      expect(ledger.total()).toBe(1200);
    }
    for (const count of Object.values(counts)) expect(count).toBeGreaterThan(0);
  }, 15000);
  it("renaming every observer kind label changes no outcome; Society stores no balances", () => {
    function run(label: string) {
      const { store, ledger, views } = setup();
      const charter = { ...voting, kind: label, admission: [{ type: "fee", amount: 2, kind: label }],
        obligations: [{ type: "dues", amount: 1, schedule: { first: 1, period: 1 }, kind: label }] } as unknown as Charter;
      const org = found(store, charter);
      act(store, org, b, "join"); store.advanceTo(2); act(store, org, b, "leave");
      const state = JSON.stringify(store.organisations());
      expect(state).not.toMatch(/"(?:balance|balances|money|account|holdings)"/);
      // Founding provenance now retains the full submitted draft. Remove only
      // its observer metadata when comparing outcomes under a label rename.
      const events = store.events.map((event) => ({ ...event, intentions: event.intentions.map((intention) =>
        intention.kind === "found" ? { ...intention, payload: { ...intention.payload,
          charter: JSON.parse(JSON.stringify(intention.payload?.charter, (key, value) =>
            key === "kind" || key === "name" ? undefined : value)) } } : intention) }));
      return { events, members: store.get(org)?.members, obligations: store.obligations,
        ledger: ledger.snapshot(), total: ledger.total(), views: views.calls };
    }
    expect(run("fraternity")).toEqual(run("renamed entirely"));
  });
  it("declares the actor process and all three Society writes", () => {
    const manifest = JSON.parse(readFileSync(new URL("../kernel.json", import.meta.url), "utf8"));
    const processes = manifest.processes.filter((p: { id: string }) => p.id === ORGANISATION_PROCESS);
    expect(processes).toHaveLength(1);
    expect(processes[0].writes).toEqual(["society.organisation", "society.membership", "society.organisation_event"]);
  });
});
