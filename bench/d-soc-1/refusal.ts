import { join } from "node:path";
import { COMPOSITIONS } from "./composition.ts";
import { economyErrors, FIXTURES as F } from "./fixtures.ts";
import { studyInputHash, treeHash, VERDICTS } from "./integrity.ts";
import { CONDITIONS } from "./study.ts";

export function refusalEvidence(root = ".") {
  return { status: "refused" as const, seeds: [...F.calendar.seeds], conditions: [...CONDITIONS], plannedRuns: F.calendar.seeds.length * CONDITIONS.length,
    completedRuns: 0, errors: economyErrors(), sourceHash: treeHash(join(root, "src")), inputHash: studyInputHash(root) };
}
export function renderRefusalReport(root = "."): string {
  const evidence = refusalEvidence(root);
  return `# D-SOC-1 — DESIGN §1.16 sourced rerun

Run status: REFUSED
Source SHA256: ${evidence.sourceHash}
Study inputs SHA256: ${evidence.inputHash}
Seed count: ${evidence.seeds.length}
Seeds: ${evidence.seeds.join(", ")}
Completed runs: 0 / ${evidence.plannedRuns}
Results SHA256: none (preflight refusal; no new results.json)
Diagnostic illness-only condition remains excluded from gate calculations.

${VERDICTS.map((id) => `${id}: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.`).join("\n")}

FAIL means the demonstration did not establish the requirement; it is not a measured reversal or an engine regression. No previous PASS is carried forward as a sourced result. The same seeds 1–30, five conditions and 20 quarterly ticks were requested. No RNG or simulation state was created.

${evidence.errors.map((error) => `- ${error}`).join("\n")}

Reproduce: npm run bench:dsoc1 (expected nonzero exit while these inputs are missing). The runner records results/sourced-refusal.json in the gitignored results folder. Any existing results/results.json is the previous §1.15 experiment, not evidence for these inputs. It is preserved, never relabelled or overwritten with invented runs. See DIAGNOSIS.md for prior findings and remaining limitations.
`;
}

export function renderRefusalDiagnosis(): string {
  return `# D-SOC-1 diagnosis

## §1.16 sourced rerun (5242)

Attempted the unchanged 30 seeds (1–30), five conditions, 20 quarters: 150 planned runs, 0 completed, 0 simulated quarters. Preflight finds ${economyErrors().length} missing numeric inputs. The requested rerun refuses before drawing RNG or allocating minds. All eight D lines are FAIL/not demonstrated, not measurements from an empty population. No failed direction was tuned.

${economyErrors().map((error) => `- ${error}`).join("\n")}

Economy: removed income=4, bad-harvest income=1, subsistence=3, illness cost=3, illness probabilities=.08/.16 and death=.005. Added row-cited income by occupation, rent, subsistence, illness incidence/cost, non-plague mortality and harvest frequency/depth. Annual money is divided by 4; carpenter daily wage 4.875d is multiplied by the required observed annual work days and divided by 4. Annual cases/person are divided by 4, deaths/1000/year by 1000×4, harvests/decade by 40. Harvest timing retains a periodic stand-in: uniformly accumulated event counts cross a whole-number boundary in the affected quarter; there is no new harvest RNG. The original high-illness treatment remains a twofold contrast. The 2/7 poor/good yield ratio is explicitly a pre-plague depth proxy applied only to smallholder produce. These conversions cannot fill a null. The 260-day convention, 1349 plague share and contractual board cost are not substitutes for missing household inputs. Opening purse=12d and external ledger stock=1,000,000d remain labelled initial-state fixtures; cadence/network/cognition assumptions remain labelled fixtures.

Charters: the former four invented dues/relief pairs are removed. ${COMPOSITIONS.length} distinct component compositions now combine sourced English-pence admission fees, dues with stated quarterly or annual schedules, optional sickness transfers, and annual meetings, across reference IDs. Every selected component keeps its reference ID/index in the draft purpose. Null amounts and foreign currency are excluded; no invented exchange rate. Periods are 1 or 4 quarters; the schedule phase at draft time is a host fixture, not a historical feast date. A sickness transfer is one payment of the source's stated amount; weekly recurrence, qualifying periods and full historical eligibility are unsupported and not claimed. All reference amendment procedures have incomplete quorum/role inputs, so none is offered and no majority/quorum is substituted. This leaves D5 without an executable sourced amendment vocabulary. Weekly/movable-feast obligations and unsupported events remain outside the executable subset.

Meetings: every current member is added to the decision set when a scheduled meeting or attendance obligation is due. Simultaneous summons and rotating selection deduplicate to one decision/person/tick. The 12-person rotating cadence outside meetings and pending-founder consent calls are unchanged. Members receive ordinary offers through their minds, including waiting; neither attendance nor a ballot is filled. No aggregate attendance/change count can be reported because 0 sourced runs completed.

Current causes: D1, D2, D3, D3b and D4 lack current traces because the required source inputs are null. D5 additionally lacks complete sourced amendment rules and a paired transfer counterfactual. D6 and D7 cannot be evaluated without the missing income/cost/hazard inputs. None has a new measured sign.

Prior §1.15 evidence (historical, not the sourced rerun): results SHA256 80e64db7abaa5823b2f47fb686cc8ccf4f3ec47b4d1241ac79e4837f7d772372. D1–D4 including D3b passed; D5–D7 failed. Baseline/high/no-shocks relief foundings were 720/435/1075; D6 illness delta=-285, D7 shock delta=-355. D5 had 446 proposals, 31 expressed ballots, 0 executed amendments and 0 amendment-induced transfers. D6 young/older dissolution hazards were .00508/.03033; duration/inside-ties correlation=-.22787; overlap correlation unavailable. Sparse participation and neutral term appraisal limited D5; purse/consent squeeze, cadence and censoring limited D6/D7. Those causes are not asserted to persist numerically after §1.16. Old results, if present, remain gitignored and are not rehashed as current evidence.

Blocked work is recorded in HANDOFF.md: source nulls require research in data/, outside this task's writable scope; real occupation assignments and missing executable charter semantics require keeper decisions. The three work-post classes retain an explicitly synthetic labourer/carpenter/smallholder mapping. Income aggregation assumes one household income unit per post; household/per-worker definitions need reconciliation before historical interpretation. The existing mind forecast appraises dues/relief, not the newly sourced admission fee. No src/, data/, DESIGN.md or cognition changes were made.
`;
}
