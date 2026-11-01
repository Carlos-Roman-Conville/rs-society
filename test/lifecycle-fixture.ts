import { streams } from "@rex/kernel";
import { CommunicationNetwork, OrganisationStore, mintId, type AccountId, type Charter,
  type CharterCapabilities, type DecisionRequest, type FoundIntention, type LedgerPort,
  type OrgId, type PersonId, type SocialIntention, type ViewsPort } from "../src/index.ts";

// Every amount, time, rule parameter, identity and seed here is fixture (test only).
export const people = Array.from({ length: 5 }, (_, i) => mintId({ person: i }, "person").id);
export const [a, b, c, d, e] = people;
export const vote = { type: "simple_majority", base: "members", // fixture (test only)
  electorate: "all_members", eligibility: { type: "members" },
  quorum: { type: "count", value: 1 } } as const;
export const charter: Charter = { admission: [{ type: "open" }], founding: { window: 10, min_members: 1 },
  decision_procedure: vote, benefits: [{ type: "meeting", activity: "assembly", schedule: { first: 0, period: 1 } }] };
export const capabilities: CharterCapabilities = { events: [], ports: ["settlement.ledger"], procedures: ["simple_majority"] };
export function network(persons: readonly PersonId[] = people, now = 0, connected = true): CommunicationNetwork {
  const net = new CommunicationNetwork({ start: now, counters: {}, streams: streams(27),
    people: persons.map((id) => ({ id, availableHours: 24 })),
    parameters: { kinds: [{ kind: "kin", lambda0: 0, alpha: 0.25, T: 4 }], w_min: 0.01, d: 1 } });
  net.setExposures({ sharedHours: [], households: [], meetings: [],
    kin: connected ? persons.slice(1).map((person, i) => ({ i: persons[i], j: person })) : [] });
  return net;
}
export function draft(store: OrganisationStore, founders: readonly PersonId[] = [a], rules = charter,
  businesses: readonly string[] = []): FoundIntention {
  return { person: founders[0], kind: "found", target: `draft.${store.events.length}`, t: store.now,
    payload: { charter: rules, founders, purpose: "fixture mutual aid", businesses } };
}
export function joins(intention: FoundIntention): SocialIntention[] {
  return intention.payload.founders.map((person) => ({ person, kind: "join", target: intention.target, t: intention.t }));
}
export function foundFixture(store: OrganisationStore, founders: readonly PersonId[] = [a], rules = charter): OrgId {
  const intention = draft(store, founders, rules);
  const result = store.found(intention, joins(intention), network(people, store.now));
  if (result.kind !== "founded") throw new Error(result.cause);
  return result.org;
}
export function decision(store: OrganisationStore, org: OrgId, payload: Record<string, unknown>,
  voters = store.get(org)!.members.map((m) => m.person)): DecisionRequest {
  const proposalId = `proposal.${store.events.length}`;
  return { proposalId, proposal: { person: voters[0], kind: "propose", target: org, t: store.now, payload },
    ballots: voters.map((person) => ({ person, kind: "support", target: proposalId, t: store.now })) };
}
export function attend(store: OrganisationStore, org: OrgId): void {
  for (const { person } of store.get(org)!.members) store.attempt({ person, kind: "attend", target: org,
    t: store.now, payload: { activity: "assembly" } });
}
export function setup() {
  const ledger: LedgerPort & { balances: Map<AccountId, number>; rows: unknown[] } = {
    id: "fixture.ledger", balances: new Map(people.map((p) => [p, 100])), rows: [],
    balance(account) { return this.balances.get(account) ?? 0; },
    transfer(from, to, amount, reason) {
      if (amount <= 0 || this.balance(from) < amount) throw new Error("insufficient funds");
      this.balances.set(from, this.balance(from) - amount); this.balances.set(to, this.balance(to) + amount);
      this.rows.push({ from, to, amount, reason });
    },
    snapshot() { return structuredClone({ balances: this.balances, rows: this.rows }); },
    restore(snapshot) { Object.assign(this, snapshot); },
  };
  const views: ViewsPort & { calls: unknown[][]; fail: boolean } = {
    id: "fixture.views", calls: [], fail: false,
    onCreated(id) { this.calls.push(["created", id]); if (this.fail) throw new Error("view failed"); },
    onMerged(source, survivor) { this.calls.push(["merged", source, survivor]); if (this.fail) throw new Error("view failed"); },
    onDissolved(id) { this.calls.push(["dissolved", id]); if (this.fail) throw new Error("view failed"); },
    closeBusiness(id) { this.calls.push(["close", id]); },
    snapshot() { return structuredClone(this.calls); },
    restore(snapshot) { this.calls = snapshot as unknown[][]; },
  };
  const store = new OrganisationStore({ start: 0, counters: {}, ledger, views, capabilities });
  return { store, ledger, views };
}
