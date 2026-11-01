import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";
import { GATES, reportErrors, studyInputHash, treeHash, VERDICTS } from "../bench/d-soc-1/integrity.ts";
import { CONDITIONS, runStudy } from "../bench/d-soc-1/study.ts";
import type { StudyResult } from "../bench/d-soc-1/study.ts";
import { renderReport } from "../bench/d-soc-1/report.ts";
import { renderDiagnosis } from "../bench/d-soc-1/diagnose.ts";
import { studyPorts } from "../bench/d-soc-1/ledger.ts";
import { COMPANY, FIXTURES, economyErrors, economyRows, ECONOMY_ROWS, sourcedEconomy, CHARTER_COMPONENTS } from "../bench/d-soc-1/fixtures.ts";
import { compose, COMPOSITIONS } from "../bench/d-soc-1/composition.ts";
import { renderRefusalReport, renderRefusalDiagnosis, refusalEvidence } from "../bench/d-soc-1/refusal.ts";
import { validateCharter, type PersonId } from "../src/index.ts";
import { StudyMindsRunner } from "../bench/d-soc-1/runner.ts";
import { studyMind, studyModel } from "../bench/d-soc-1/models.ts";
import { createMindsState, gaussian, MindsRunner, setBelief } from "@rex/cognition";
import type { MindCommand } from "@rex/cognition";

const root = join(import.meta.dirname, "..");
const resultsPath = join(root, "bench/d-soc-1/results/results.json");
describe("D-SOC-1 committed study evidence", () => {
  it("has all gate/graded verdicts, at least 30 unique seeds and the current src hash", () => {
    const report = readFileSync(join(root, "bench/d-soc-1/REPORT.md"), "utf8");
    expect(reportErrors(report, treeHash(join(root, "src")))).toEqual([]);
    expect(report).toContain(`Study inputs SHA256: ${studyInputHash(root)}`);
    if (economyErrors().length) {
      expect(report).toBe(renderRefusalReport(root));
      expect(report).toContain("Completed runs: 0 / 150");
      expect(readFileSync(join(root, "bench/d-soc-1/DIAGNOSIS.md"), "utf8")).toBe(renderRefusalDiagnosis());
    } else expect(report).toMatch(/^Results SHA256: [a-f0-9]{64}$/m);
    expect(report).toMatch(/^Diagnostic illness-only .*excluded from gate calculations/m);
    for (const gate of GATES) expect(report).toMatch(new RegExp(`^${gate}: (PASS|FAIL) `, "m"));
  });
  it("rejects stale evidence, missing verdicts and duplicated seeds without concealing FAIL", () => {
    const hash = "a".repeat(64), seeds = Array.from({ length: 30 }, (_, i) => i + 1).join(", ");
    const report = [...VERDICTS.map((d) => `${d}: FAIL 0; fixture counterexample`), `Source SHA256: ${hash}`, "Seed count: 30", `Seeds: ${seeds}`].join("\n");
    expect(reportErrors(report, hash)).toEqual([]);
    expect(reportErrors(report, "b".repeat(64))).toContain("Stale src/ hash");
    expect(reportErrors(report.replace("D3b: FAIL", "D3b: UNKNOWN"), hash)).toContain("Missing/duplicate verdict D3b");
    expect(reportErrors(report.replace("Seeds: 1, 2,", "Seeds: 1, 1,"), hash)).toContain("Invalid seed list/count");
  });
  it.skipIf(!existsSync(resultsPath) || economyErrors().length > 0)("recomputes every reported verdict and exact hash when local results exist", () => {
    const bytes = readFileSync(resultsPath, "utf8");
    const rows = JSON.parse(bytes) as StudyResult[];
    const report = readFileSync(join(root, "bench/d-soc-1/REPORT.md"), "utf8").replace(/\r\n/g, "\n");
    expect(rows).toHaveLength(FIXTURES.calendar.seeds.length * CONDITIONS.length);
    expect(rows.map((r) => [r.seed, r.condition])).toEqual(FIXTURES.calendar.seeds.flatMap((seed) => CONDITIONS.map((condition) => [seed, condition])));
    expect(rows.every((r) => r.steps === FIXTURES.calendar.steps && r.minds === 250 && r.initialPopulation === 250)).toBe(true);
    expect(report).toContain(`Results SHA256: ${createHash("sha256").update(bytes).digest("hex")}`);
    expect(renderReport(rows)).toBe(report);
    // The illness-only row is diagnostic: even a counterexample there must not
    // silently become a new gate or replace the bundled D7 comparison.
    const changedDiagnostic = rows.map((r) => r.condition === "illness-only" ? { ...r,
      initialOrganisations: 1, ancestryErrors: 1, moneyErrors: 1, hourErrors: 1,
      refusals: r.refusals + 1, unresolved: 1, crossHousehold: 1, reliefFoundings: 1_000_000 } : r);
    const lines = (text: string) => text.split("\n").filter((line) => /^D\d/.test(line));
    expect(lines(renderReport(changedDiagnostic))).toEqual(lines(report));
  });
  it("keeps source creation behind named founding intentions and host circle resolution (D1)", () => {
    const methods: string[] = [];
    const source = ts.createSourceFile("organisation.ts", readFileSync(join(root, "src/organisation.ts"), "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === "this.#state.organisations.push") {
        let parent: ts.Node = node;
        while (parent.parent && !ts.isMethodDeclaration(parent)) parent = parent.parent;
        methods.push(ts.isMethodDeclaration(parent) ? parent.name.getText(source) : "outside method");
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    expect(methods).toEqual(["found"]);
    const host = readFileSync(join(root, "bench/d-soc-1/host.ts"), "utf8");
    expect([...host.matchAll(/\.found\(/g)]).toHaveLength(1);
    expect(host).toContain("this.organisation.found(circle.intention, circle.joins, this.network)");
    expect(readFileSync(join(root, "bench/d-soc-1/study.ts"), "utf8")).not.toMatch(/organisation\.(?:found|split|secede|merge|attempt)\(/);
  });
  it.skipIf(!existsSync(resultsPath) || economyErrors().length > 0)("rebuilds the diagnosis from named decisions, shock episodes, money flows and actual amendment tallies", () => {
    const rows = JSON.parse(readFileSync(resultsPath, "utf8")) as StudyResult[];
    expect(readFileSync(join(root, "bench/d-soc-1/DIAGNOSIS.md"), "utf8").replace(/\r\n/g, "\n"))
      .toBe(renderDiagnosis(rows));
    for (const row of rows) {
      expect(row.decisions).toHaveLength(row.sourceIntentions);
      expect(row.shockTrace.flatMap((s) => s.ill)).toHaveLength(row.illnesses);
      expect(row.shockTrace.flatMap((s) => s.died)).toHaveLength(row.deaths);
      expect(Object.values(row.ledgerTotals).reduce((n, r) => n + r.count, 0)).toBe(row.transfers);
      expect(row.dissolutionTrace).toHaveLength(row.dissolutions);
      expect(row.exitTrace).toHaveLength(row.leaves);
      expect(row.positiveInteractions).toBe(2 * row.networkContacts);
      if (row.condition === "no-network") expect(row.positiveInteractions).toBe(0);
      if (row.condition === "illness-only") {
        const base = rows.find((r) => r.seed === row.seed && r.condition === "baseline")!;
        expect(row.illnesses).toBe(0);
        expect(row.shockTrace.map((s) => s.died)).toEqual(base.shockTrace.map((s) => s.died));
        expect(row.ledgerTotals["fixture income"]).toEqual(base.ledgerTotals["fixture income"]);
      }
      for (const event of row.foundingTrace) for (const source of event.intentions) {
        const decision = row.decisions.find((d) => d.person === source.person && d.t === source.t &&
          d.target === source.target && d.kind === source.kind);
        expect(decision?.founding).toBeDefined();
      }
      for (const d of row.decisions.filter((d) => d.consentUnaffordable)) {
        expect(d.consentOffered).toBe(true);
        expect(d.eligibleConsent).toBe(0);
      }
      for (const event of row.amendmentTrace) for (const source of event.intentions) {
        expect(row.decisions.some((d) => d.person === source.person && d.t === source.t &&
          d.target === source.target && d.kind === source.kind)).toBe(true);
      }
      if (row.condition === "no-shocks") expect(row.illnesses + row.deaths).toBe(0);
      if (row.condition === "baseline") {
        const high = rows.find((r) => r.seed === row.seed && r.condition === "high-illness")!;
        expect(row.shockTrace.map((s) => s.died)).toEqual(high.shockTrace.map((s) => s.died));
        for (const [i, step] of row.shockTrace.entries()) {
          expect(step.ill.every((person) => high.shockTrace[i].ill.includes(person))).toBe(true);
        }
      }
    }
  }, 60_000);
  it("aliases household purses, conserves ledger transfers, refuses overspending and restores transactions", () => {
    const { ledger } = studyPorts([{ id: "h", members: [{ person: "p1" }, { person: "p2" }] }]);
    const opening = ledger.total(), snapshot = ledger.snapshot();
    ledger.transfer("p1", "org.0001", 3, "fixture dues");
    expect(ledger.balance("p2")).toBe(FIXTURES.economy.openingPurse - 3);
    expect(ledger.total()).toBe(opening);
    expect(() => ledger.transfer("p2", "org.0001", FIXTURES.economy.openingPurse, "fixture dues")).toThrow(/Unfunded/);
    ledger.restore(snapshot);
    expect(ledger.rows).toEqual([]);
    expect(ledger.balance("p1")).toBe(FIXTURES.economy.openingPurse);
  });
  it("forecasts company only from believed peers and leaving only from believed inside contacts (DESIGN 1.15.1)", () => {
    const setup = studyMind("a"), runner = new MindsRunner(createMindsState(1), { a: setup.config });
    runner.run({ type: "addMind", mind: setup.input });
    const mind = runner.state.minds[0], target = "known-org.0";
    const social = (kind: "found" | "join" | "attend" | "pay" | "leave", value = mind) =>
      studyModel({ kind, target }, value).outcomeSpace[0].deficits.social_connection;
    for (const kind of ["found", "join", "attend", "pay", "leave"] as const) expect(social(kind)).toBe(0.5);
    const withPeers = { ...mind, memory: { ...mind.memory, beliefs: setBelief(mind.memory.beliefs, target, COMPANY.peers, gaussian(3, 1)) } };
    for (const kind of ["found", "join", "attend"] as const) expect(social(kind, withPeers)).toBe(0.125);
    expect(social("pay", withPeers)).toBe(0.5);
    expect(social("leave", withPeers)).toBe(0.5);
    const withInside = { ...withPeers, memory: { ...withPeers.memory,
      beliefs: setBelief(withPeers.memory.beliefs, target, COMPANY.inside, gaussian(1, 1)) } };
    expect(social("leave", withInside)).toBe(1);
  });

  it("runs the unchanged Cognition reducer with stock-equivalent state, ids, outcomes and duplicate detection", () => {
    const a = studyMind("a"), b = studyMind("b"), configs = { a: a.config, b: b.config };
    const stock = new MindsRunner(createMindsState(1), configs), sparse = new StudyMindsRunner(createMindsState(1), configs);
    const check = (command: MindCommand) => {
      expect(sparse.run(command)).toEqual(stock.run(command));
      expect(sparse.log).toEqual(stock.log);
      expect(sparse.events).toEqual(stock.events);
    };
    check({ type: "addMind", mind: a.input }); check({ type: "addMind", mind: b.input });
    for (const mind of stock.state.minds) {
      check({ type: "observe", mind: mind.id, t: 1, observations: [] });
      check({ type: "tickNeeds", mind: mind.id, inputs: { signals: { "body.hunger_signal": 0.5 }, elapsedSeconds: 1, outcomeTags: [], cues: [] } });
      check({ type: "tickNeeds", mind: mind.id, inputs: { signals: { "body.hunger_signal": 0.5 },
        elapsedSeconds: 1, outcomeTags: ["positive_interaction"], cues: [] } });
      expect(sparse.state.minds.find((m) => m.id === mind.id)!.needs.needs.find((n) => n.definition.id === "social_connection")!.deficit).toBe(0);
      check({ type: "decide", mind: mind.id, t: 1 });
      const intention = stock.state.minds.find((m) => m.id === mind.id)!.intentions[0].intention.id;
      check({ type: "outcome", intention, event: `outcome.${mind.id}`, cause: "fixture.cause", t: 1, feedback: { observations: [], status: "completed" } });
      check({ type: "outcome", intention, event: `outcome.${mind.id}`, cause: "fixture.cause", t: 1, feedback: { observations: [], status: "completed" } });
    }
    check({ type: "outcome", intention: "missing", event: "missing", t: 1, feedback: { observations: [] } });
    expect(() => sparse.run({ type: "decide", mind: "missing", t: 1 })).toThrow();
    expect(sparse.state).toEqual(stock.state);
  }, 60_000); // Larger sourced vocabulary; this checks equivalence, not latency.
  it("refuses every seed and condition before simulation when a required source row is null (§1.16)", () => {
    expect(economyErrors()).toHaveLength(9);
    for (const seed of FIXTURES.calendar.seeds) for (const condition of CONDITIONS) {
      expect(() => runStudy(seed, condition, 4)).toThrow(/economy.json row illness_incidence_per_person_year/);
    }
    const evidence = refusalEvidence(root);
    expect(evidence).toMatchObject({ status: "refused", plannedRuns: 150, completedRuns: 0 });
    expect(evidence.errors).toEqual(economyErrors());
  });
  it("uses only stated period arithmetic and identifies every missing row without substituting a fixture", () => {
    // fixture (test only): synthetic complete source rows exercise conversions.
    const complete = economyRows.map((r) => ({ ...r, value: typeof r.value === "number" ? r.value : 1 }));
    const values = sourcedEconomy(complete);
    expect(values.income).toEqual([0.25, 4.875 / 4, 0.25]);
    expect(values).toMatchObject({ subsistence: 0.25, rent: 0.25, illness: 0.25, highIllness: 0.5,
      death: 1 / 4000, harvest: 1 / 40, illnessCost: 1, harvestRatio: 2 / 7 });
    for (const id of Object.values(ECONOMY_ROWS)) {
      expect(() => sourcedEconomy(complete.map((r) => r.id === id ? { ...r, value: null } : r))).toThrow(id);
    }
  });
  it("composes executable sourced pence components across references without null amount or quorum repair", () => {
    const drafts = compose("person.test" as PersonId, 1);
    expect(drafts.length).toBe(COMPOSITIONS.length);
    expect(drafts.length).toBeGreaterThan(4);
    for (const { component } of CHARTER_COMPONENTS) if ("amount" in component) {
      expect(typeof component.amount).toBe("number");
      expect(component.unit).toBe("penny (English d.)");
    }
    for (const [i, draft] of drafts.entries()) {
      expect(validateCharter(draft.payload.charter, { events: ["illness"], ports: ["settlement.ledger"], procedures: [] })).toEqual([]);
      expect(draft.payload.purpose).toContain(COMPOSITIONS[i].admission.source);
      expect(draft.payload.purpose).toContain(COMPOSITIONS[i].obligation.source);
      expect(draft.payload.charter.amendment).toBeUndefined();
    }
    expect(COMPOSITIONS.some((c) => c.admission.source.split("/")[0] !== c.obligation.source.split("/")[0])).toBe(true);
    expect(COMPOSITIONS.some((c) => !c.benefit)).toBe(true);
  });
});
