import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as observer from "../src/institution.ts";
import { a, b, charter, vote, setup, foundFixture, decision, attend } from "./lifecycle-fixture.ts";

// All terms, amounts, times, identities and rule parameters are fixture (test only).
const rules = { ...charter, positions: [{ ...vote, position: "steward", term: 10 }],
  obligations: [{ type: "dues", amount: 1, schedule: { first: 1, period: 1 } }],
  sanctions: [{ type: "fine", amount: 1, procedure: vote }] } as const;

function scenario(observe = observer.classifyInstitution) {
  const { store, ledger, views } = setup();
  const org = foundFixture(store, [a, b], rules);
  const labels: boolean[] = [];
  const inspect = () => labels.push(observe(store.get(org)!, store.events));
  inspect(); attend(store, org);
  const elect = decision(store, org, { action: "elect", role: "steward", person: a });
  store.attempt(elect.proposal, { decision: elect }); inspect();
  const sanction = decision(store, org, { action: "sanction", component: 0, person: b });
  store.attempt(sanction.proposal, { decision: sanction }); inspect();
  store.advanceTo(1); inspect();
  return { store, org, ledger, labels, trace: { events: store.events, organisations: store.organisations(),
    ledger: ledger.snapshot(), views: views.snapshot() } };
}

describe("institution classification is an observer-only label (DESIGN §1.4)", () => {
  it("requires recognised succession positions, an applied sanction and revenue actually collected", () => {
    const { store, org, labels } = scenario();
    expect(labels).toEqual([false, false, false, true]);
    const state = store.get(org)!;
    for (const cause of ["dues paid", "sanction applied"]) {
      expect(observer.classifyInstitution(state, store.events.filter((e) => e.cause !== cause))).toBe(false);
    }
    expect(observer.classifyInstitution({ ...state, positions: [] }, store.events)).toBe(false);
    expect(observer.classifyInstitution({ ...state, charter: { ...state.charter, positions: [] } }, store.events)).toBe(false);
    expect(observer.classifyInstitution(state, store.events.map((e) => ({ ...e, org: "other" as typeof org })))).toBe(false);
  });
  it("a passed but unfunded fine and unpaid revenue are not evidence of application or collection", () => {
    const { store, ledger } = setup();
    const org = foundFixture(store, [a, b], rules); attend(store, org);
    const elect = decision(store, org, { action: "elect", role: "steward", person: a });
    store.attempt(elect.proposal, { decision: elect });
    ledger.balances.set(b, 0);
    const fine = decision(store, org, { action: "sanction", component: 0, person: b });
    expect(store.attempt(fine.proposal, { decision: fine }).kind).toBe("refused");
    store.advanceTo(1);
    expect(store.events.some((e) => e.cause === "dues paid")).toBe(true);
    expect(store.events.some((e) => e.cause === "sanction applied")).toBe(false);
    expect(observer.classifyInstitution(store.get(org)!, store.events)).toBe(false);
    const applied = scenario();
    const unpaid = applied.store.events.map((event) => event.cause === "dues paid"
      ? { ...event, payload: { ...event.payload, status: "unpaid", revenueCollected: 0 } } : event);
    expect(observer.classifyInstitution(applied.store.get(applied.org)!, unpaid)).toBe(false);
  });
  it("records suspension and expulsion as applied sanctions too", () => {
    for (const sanction of [{ type: "suspension", duration: 2, procedure: vote },
      { type: "expulsion", procedure: vote }] as const) {
      const { store } = setup();
      const org = foundFixture(store, [a, b], { ...rules, sanctions: [sanction] });
      attend(store, org);
      for (const payload of [{ action: "elect", role: "steward", person: a },
        { action: "sanction", component: 0, person: b }]) {
        const request = decision(store, org, payload);
        store.attempt(request.proposal, { decision: request });
      }
      store.advanceTo(1);
      expect(observer.classifyInstitution(store.get(org)!, store.events)).toBe(true);
    }
  });
  it("a declared entry fee actually collected is revenue even without periodic dues", () => {
    const { store } = setup();
    const org = foundFixture(store, [a, b], { ...rules, obligations: [], admission: [{ type: "fee", amount: 1 }] });
    attend(store, org);
    for (const payload of [{ action: "elect", role: "steward", person: a },
      { action: "sanction", component: 0, person: b }]) {
      const request = decision(store, org, payload); store.attempt(request.proposal, { decision: request });
    }
    expect(observer.classifyInstitution(store.get(org)!, store.events)).toBe(true);
  });
  it("always-true and always-false classifier stubs produce identical mechanism traces", () => {
    const stub = vi.spyOn(observer, "classifyInstitution");
    try {
      stub.mockReturnValue(true); const yes = scenario();
      expect(yes.labels).toEqual([true, true, true, true]);
      stub.mockReturnValue(false); const no = scenario();
      expect(no.labels).toEqual([false, false, false, false]);
      expect(no.trace).toEqual(yes.trace);
      expect(stub).toHaveBeenCalledTimes(8);
    } finally { stub.mockRestore(); }
  });
  it("only the barrel re-exports institution; observers retain the dedicated package export", () => {
    const root = new URL("../src/", import.meta.url);
    for (const name of readdirSync(root, { recursive: true }).map(String).filter((n) => n.endsWith(".ts") && n !== "institution.ts")) {
      const code = readFileSync(new URL(name.replaceAll("\\", "/"), root), "utf8");
      // DESIGN §1.14 3
      if (name === "index.ts") {
        expect(code).toContain('export { classifyInstitution } from "./institution.ts"');
        continue;
      }
      expect(code, name).not.toMatch(/(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s*)["'][^"']*institution(?:\.ts)?["']/);
      expect(code, name).not.toContain("classifyInstitution");
    }
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.exports["./institution"]).toBe("./src/institution.ts");
  });
});
