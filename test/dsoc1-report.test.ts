import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";
import { GATES, reportErrors, treeHash, VERDICTS } from "../bench/d-soc-1/integrity.ts";
import { CONDITIONS, runStudy } from "../bench/d-soc-1/study.ts";
import type { StudyResult } from "../bench/d-soc-1/study.ts";
import { renderReport } from "../bench/d-soc-1/report.ts";
import { renderDiagnosis } from "../bench/d-soc-1/diagnose.ts";
import { studyPorts } from "../bench/d-soc-1/ledger.ts";
import { FIXTURES } from "../bench/d-soc-1/fixtures.ts";
import { StudyMindsRunner } from "../bench/d-soc-1/runner.ts";
import { studyMind } from "../bench/d-soc-1/models.ts";
import { createMindsState, MindsRunner } from "@rex/cognition";
import type { MindCommand } from "@rex/cognition";

const root = join(import.meta.dirname, "..");
describe("D-SOC-1 committed study evidence", () => {
  it("has all gate/graded verdicts, at least 30 unique seeds and the current src hash", () => {
    const report = readFileSync(join(root, "bench/d-soc-1/REPORT.md"), "utf8");
    expect(reportErrors(report, treeHash(join(root, "src")))).toEqual([]);
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
  it("recomputes every reported verdict from the complete paired results", () => {
    const bytes = readFileSync(join(root, "bench/d-soc-1/results.json"), "utf8").replace(/\r\n/g, "\n");
    const rows = JSON.parse(bytes) as StudyResult[];
    const report = readFileSync(join(root, "bench/d-soc-1/REPORT.md"), "utf8").replace(/\r\n/g, "\n");
    expect(rows).toHaveLength(120);
    expect(rows.map((r) => [r.seed, r.condition])).toEqual(FIXTURES.calendar.seeds.flatMap((seed) => CONDITIONS.map((condition) => [seed, condition])));
    expect(rows.every((r) => r.steps === FIXTURES.calendar.steps && r.minds === 250 && r.initialPopulation === 250)).toBe(true);
    expect(report).toContain(`Results SHA256: ${createHash("sha256").update(bytes).digest("hex")}`);
    expect(renderReport(rows)).toBe(report);
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
  it("rebuilds the diagnosis from named decisions, shock episodes, money flows and actual amendment tallies", () => {
    const rows = JSON.parse(readFileSync(join(root, "bench/d-soc-1/results.json"), "utf8")) as StudyResult[];
    expect(readFileSync(join(root, "bench/d-soc-1/DIAGNOSIS.md"), "utf8").replace(/\r\n/g, "\n"))
      .toBe(renderDiagnosis(rows));
    for (const row of rows) {
      expect(row.decisions).toHaveLength(row.sourceIntentions);
      expect(row.shockTrace.flatMap((s) => s.ill)).toHaveLength(row.illnesses);
      expect(row.shockTrace.flatMap((s) => s.died)).toHaveLength(row.deaths);
      expect(Object.values(row.ledgerTotals).reduce((n, r) => n + r.count, 0)).toBe(row.transfers);
      expect(row.dissolutionTrace).toHaveLength(row.dissolutions);
      expect(row.exitTrace).toHaveLength(row.leaves);
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
      check({ type: "decide", mind: mind.id, t: 1 });
      const intention = stock.state.minds.find((m) => m.id === mind.id)!.intentions[0].intention.id;
      check({ type: "outcome", intention, event: `outcome.${mind.id}`, cause: "fixture.cause", t: 1, feedback: { observations: [], status: "completed" } });
      check({ type: "outcome", intention, event: `outcome.${mind.id}`, cause: "fixture.cause", t: 1, feedback: { observations: [], status: "completed" } });
    }
    check({ type: "outcome", intention: "missing", event: "missing", t: 1, feedback: { observations: [] } });
    expect(() => sparse.run({ type: "decide", mind: "missing", t: 1 })).toThrow();
    expect(sparse.state).toEqual(stock.state);
  });
  it("replays a small study with baseline needs and independent conservation observers", () => {
    const first = runStudy(1, "baseline", 4);
    expect(first).toEqual(runStudy(1, "baseline", 4));
    expect(first.minds).toBe(250);
    expect(first.initialOrganisations).toBe(0);
    expect(first.attempts).toBeGreaterThan(0);
    expect(first.membershipErrors + first.moneyErrors + first.populationErrors + first.ancestryErrors + first.hourErrors).toBe(0);
  }, 120_000);
});
