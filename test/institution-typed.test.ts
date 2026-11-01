import { describe, expect, it } from "vitest";
import { classifyInstitution } from "../src/institution.ts";
import type { OrganisationEvent } from "../src/types.ts";
import { a, b, c, charter, vote, setup, foundFixture, decision, attend } from "./lifecycle-fixture.ts";

// All rule parameters, amounts and times are fixture (test only).
const rules = { ...charter, positions: [{ ...vote, position: "steward", term: 10 }],
  obligations: [{ type: "dues", amount: 2, schedule: { first: 1, period: 1 } }],
  sanctions: [{ type: "fine", amount: 1, procedure: vote }] } as const;
function scenario() {
  const { store, ledger } = setup();
  const org = foundFixture(store, [a, b], rules);
  attend(store, org);
  for (const payload of [{ action: "elect", role: "steward", person: a }, { action: "sanction", component: 0, person: b }]) {
    const request = decision(store, org, payload);
    store.attempt(request.proposal, { decision: request });
  }
  store.advanceTo(1);
  return { store, ledger, org, state: store.get(org)! };
}

describe("institution labels use typed execution evidence (DESIGN §1.4)", () => {
  it("renaming every cause leaves labels unchanged", () => {
    const { store, state } = scenario();
    expect(classifyInstitution(state, store.events)).toBe(true);
    expect(classifyInstitution(state, store.events.map((event) => ({ ...event, cause: "renamed" })))).toBe(true);
    expect(classifyInstitution(state, store.events.map((event) => ({ ...event, cause: "" })))).toBe(true);
  });
  it("cause text, legacy fee/status fields and vote approval cannot replace typed evidence", () => {
    const { store, state } = scenario();
    for (const field of ["sanctionApplied", "revenueCollected"] as const) {
      const history = store.events.map((event) => {
        const payload = { ...event.payload };
        delete payload[field];
        return { ...event, payload };
      });
      expect(classifyInstitution(state, history)).toBe(false);
    }
    const history: OrganisationEvent[] = ["sanction applied", "dues paid"].map((cause) => ({
      org: state.id, t: 1, kind: "act", intentions: [], cause,
      payload: { outcome: "accepted", status: "paid", admissionFeeCollected: 100 },
    }));
    expect(classifyInstitution(state, history)).toBe(false);
  });
  it("typed evidence alone supplies sanction/revenue predicates, with scope and time checks", () => {
    const { state } = scenario();
    const event: OrganisationEvent = { org: state.id, t: 1, kind: "act", cause: "anything", intentions: [],
      payload: { sanctionApplied: true, revenueCollected: 2 } };
    expect(classifyInstitution(state, [event])).toBe(true);
    for (const patch of [{ org: "other" as typeof state.id }, { t: state.founded_at - 1 }, { kind: "refused" as const }]) {
      expect(classifyInstitution(state, [{ ...event, ...patch }])).toBe(false);
    }
    for (const revenueCollected of [0, -1, NaN, Infinity, null, "2", undefined]) {
      expect(classifyInstitution(state, [{ ...event, payload: { sanctionApplied: true, revenueCollected } } as OrganisationEvent])).toBe(false);
    }
    for (const sanctionApplied of [false, 1, "true", null, undefined]) {
      expect(classifyInstitution(state, [{ ...event, payload: { sanctionApplied, revenueCollected: 2 } } as OrganisationEvent])).toBe(false);
    }
  });
  it("emits collected dues amounts and applied flags only after execution", () => {
    const { store } = scenario();
    expect(store.events.filter((event) => event.payload?.sanctionApplied)).toHaveLength(1);
    expect(store.events.filter((event) => event.payload?.revenueCollected).map((event) => event.payload?.revenueCollected)).toEqual([2, 2]);
    expect(store.events.filter((event) => event.payload?.outcome === "accepted")
      .every((event) => event.payload?.sanctionApplied === undefined && event.payload?.revenueCollected === undefined)).toBe(true);
  });
  it("emits total founding fees and later joining fees through the same revenue field", () => {
    const { store } = setup();
    const org = foundFixture(store, [a, b], { ...rules, admission: [{ type: "fee", amount: 3 }], obligations: [] });
    expect(store.events.at(-1)?.payload?.revenueCollected).toBe(6);
    const join = store.attempt({ person: c, kind: "join", target: org, t: 0 });
    expect(join.payload?.revenueCollected).toBe(3);
    attend(store, org);
    for (const payload of [{ action: "elect", role: "steward", person: a }, { action: "sanction", component: 0, person: b }]) {
      const request = decision(store, org, payload); store.attempt(request.proposal, { decision: request });
    }
    const state = store.get(org)!;
    // Either a founding fee or a later joining fee is sufficient revenue evidence.
    for (const kind of ["founded", "joined"]) {
      const history = store.events.filter((event) => !event.payload?.revenueCollected || event.kind === kind);
      expect(classifyInstitution(state, history.map((event) => ({ ...event, cause: "renamed" })))).toBe(true);
    }
  });
  it("failed payments/sanctions carry no evidence, and explicit late payments do", () => {
    const { store, ledger } = setup();
    const org = foundFixture(store, [a, b], rules); attend(store, org);
    ledger.balances.set(b, 0);
    const fine = decision(store, org, { action: "sanction", component: 0, person: b });
    expect(store.attempt(fine.proposal, { decision: fine }).kind).toBe("refused");
    store.advanceTo(1);
    expect(store.events.some((event) => event.payload?.sanctionApplied)).toBe(false);
    expect(store.events.filter((event) => event.kind === "refused")
      .every((event) => event.payload?.revenueCollected === undefined && event.payload?.sanctionApplied === undefined)).toBe(true);
    ledger.balances.set(b, 2);
    const paid = store.attempt({ person: b, kind: "pay", target: org, t: 1, payload: { component: 0, due_at: 1 } });
    expect(paid.payload?.revenueCollected).toBe(2);
  });
});
