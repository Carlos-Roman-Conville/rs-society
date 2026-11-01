import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { FIXTURES as F } from "./fixtures.ts";
import { studyInputHash, treeHash } from "./integrity.ts";
import type { StudyResult } from "./study.ts";

const sum = (rows: StudyResult[], field: keyof StudyResult) => rows.reduce((n, row) => n + Number(row[field]), 0);
const format = (n: number | null) => n === null || !Number.isFinite(n) ? "NA" : Number(n.toFixed(5)).toString();
const verdict = (pass: boolean) => pass ? "PASS" : "FAIL";
const rate = (n: number, d: number) => d ? n / d : null;
const distribution = (values: readonly (string | number)[]) => {
  const counts = new Map<string | number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return JSON.stringify([...counts].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([value, count]) => [value, count / values.length]));
};

/** Observer-only Pearson association; completed spells only, with censoring
 * separately disclosed. A zero variance/empty sample has no sign, never PASS. */
function correlation(pairs: number[][]): number | null {
  if (pairs.length < 2) return null;
  const x = pairs.reduce((n, p) => n + p[0], 0) / pairs.length, y = pairs.reduce((n, p) => n + p[1], 0) / pairs.length;
  const numerator = pairs.reduce((n, p) => n + (p[0] - x) * (p[1] - y), 0);
  const denominator = Math.sqrt(pairs.reduce((n, p) => n + (p[0] - x) ** 2, 0) * pairs.reduce((n, p) => n + (p[1] - y) ** 2, 0));
  return denominator ? numerator / denominator : null;
}

export function renderReport(rows: StudyResult[]): string {
  const gateRows = rows.filter((r) => r.condition !== "illness-only");
  const baseline = rows.filter((r) => r.condition === "baseline"), high = rows.filter((r) => r.condition === "high-illness");
  const noNetwork = rows.filter((r) => r.condition === "no-network"), noShocks = rows.filter((r) => r.condition === "no-shocks");
  const illnessOnly = rows.filter((r) => r.condition === "illness-only");
  const baseRelief = sum(baseline, "reliefFoundings"), highRelief = sum(high, "reliefFoundings"), noRelief = sum(noShocks, "reliefFoundings");
  const youngRate = rate(sum(baseline, "youngDeaths"), sum(baseline, "youngExposure"));
  const oldRate = rate(sum(baseline, "oldDeaths"), sum(baseline, "oldExposure"));
  const spells = baseline.flatMap((r) => r.spells), ended = spells.filter((s) => !s.censored);
  const ties = correlation(ended.map((s) => [s.ties, s.end - s.start])), overlap = correlation(ended.map((s) => [s.overlap, s.end - s.start]));
  const occupation = rate(sum(baseline, "sameOccupation"), sum(baseline, "memberPairs")), kin = rate(sum(baseline, "kinPairs"), sum(baseline, "memberPairs"));
  const occupationNull = baseline[0].randomOccupation, kinNull = baseline[0].randomKin;
  const countVariants = new Set(baseline.map((r) => r.endSizes.length)).size;
  const sizeVariants = new Set(baseline.map((r) => distribution(r.endSizes))).size;
  const charterVariants = new Set(baseline.map((r) => distribution(r.endCharters))).size;
  const d1 = sum(gateRows, "initialOrganisations") === 0 && sum(gateRows, "ancestryErrors") === 0 && sum(gateRows, "foundings") > 0;
  const d2 = sum(gateRows, "membershipErrors") + sum(gateRows, "moneyErrors") + sum(gateRows, "populationErrors") === 0;
  const d3 = sum(gateRows, "hourErrors") + sum(gateRows, "moneyErrors") === 0;
  const d3b = sum(gateRows, "refusals") === sum(gateRows, "deliveredRefusals") && sum(gateRows, "unresolved") === 0 && sum(baseline, "mistakenPayments") > 0;
  const d4 = Math.min(countVariants, sizeVariants, charterVariants) > 1;
  const amendments = baseline.flatMap((r) => r.amendmentTrace).filter((e) => e.payload?.amendmentApplied);
  const proposals = baseline.flatMap((r) => r.decisions).filter((d) => d.kind === "propose").length;
  const ballots = baseline.flatMap((r) => r.decisions).filter((d) => ["support", "oppose", "abstain"].includes(d.kind)).length;
  const d6 = highRelief > baseRelief && youngRate !== null && oldRate !== null && oldRate < youngRate
    && ties !== null && ties > 0 && overlap !== null && overlap < 0 && occupation !== null && occupation > occupationNull && kin !== null && kin > kinNull;
  const d7 = sum(noNetwork, "crossHousehold") === 0 && baseRelief > noRelief;
  const gates = [d1, d2, d3, d3b, d7].every(Boolean);
  const table = rows.map((r) => `| ${r.seed} | ${r.condition} | ${r.foundings} | ${r.reliefFoundings} | ${r.dissolutions} | ${r.endSizes.length} | ${r.endSizes.join(",") || "none"} | ${r.deaths} | ${r.mistakenPayments} |`).join("\n");
  return `# D-SOC-1: a parish forms its fraternities

Acceptance: ${gates ? "PASS" : "FAIL"}. Integrity of a recorded FAIL is not acceptance of P6.

Source SHA256: ${treeHash("src")}
Study inputs SHA256: ${studyInputHash()}
Cognition src SHA256: ${treeHash("../cognition/src")}
Seed count: ${F.calendar.seeds.length}
Seeds: ${F.calendar.seeds.join(", ")}
Results SHA256: ${createHash("sha256").update(JSON.stringify(rows, null, 2) + "\n").digest("hex")}
Village SHA256: ${createHash("sha256").update(readFileSync("data/fixtures/village/village.json", "utf8").replace(/\r\n/g, "\n")).digest("hex")}

Duration: ${F.calendar.steps * F.calendar.period / F.calendar.day} simulated days (five fixture 360-day years), ${F.calendar.steps} quarterly Kernel ticks per run; ${rows.length} paired runs, ${sum(rows, "steps")} audited steps. This permits repeated dues, founding opportunities and deaths and separates first-year from older exposure. It is a short feasibility study, not the suggested 50-year generational validation; births, migration and aging are absent. Five years was fixed before seeing any verdict; no fixture was calibrated to a yardstick.

D1: ${verdict(d1)} initial organisations=${sum(gateRows, "initialOrganisations")}; foundings=${sum(gateRows, "foundings")}; untraced founders/consents=${sum(gateRows, "ancestryErrors")}; Cognition intentions=${sum(gateRows, "sourceIntentions")}. Source creation-boundary check is in test/dsoc1-report.test.ts.
D2: ${verdict(d2)} membership errors=${sum(gateRows, "membershipErrors")}; closed-ledger errors=${sum(gateRows, "moneyErrors")}; population errors=${sum(gateRows, "populationErrors")}; transfers=${sum(gateRows, "transfers")}; deaths=${sum(gateRows, "deaths")}; births=immigration=emigration=0; money per run=${rows[0].finalMoney}.
D3: ${verdict(d3)} hour violations=${sum(gateRows, "hourErrors")}; max offered contact hours/person/day=${format(Math.max(...gateRows.map((r) => r.maxOfferedHours)))}; max rate hours/person/day=${format(Math.max(...gateRows.map((r) => r.maxRateHours)))}; capacity=${F.network.hours}; mandatory service/attendance hours=0; unfunded debits=${sum(gateRows, "moneyErrors")}.
D3b: ${verdict(d3b)} social attempts=${sum(gateRows, "attempts")}; attempt refusals=${sum(gateRows, "refusals")}; causally delivered refusals=${sum(gateRows, "deliveredRefusals")}; unresolved intentions=${sum(gateRows, "unresolved")}; baseline wrong-term payment refusals=${sum(baseline, "mistakenPayments")}; baseline misleading reports=${sum(baseline, "misreports")}.
D4: ${verdict(d4)} N=${baseline.length}; distinct final count/normalised-size-distribution/charter-composition outcomes=${countVariants}/${sizeVariants}/${charterVariants}; yardstick=all three nondegenerate, graded, not tuned.
D5: FAIL overlap run-steps=${sum(baseline, "overlapSteps")}; joins=${sum(baseline, "joins")}; exits including death=${sum(baseline, "leaves")}; amendment proposals=${proposals}; expressed ballots=${ballots}; executed dues/benefit amendments=${amendments.length}; intention-traced amendment-induced transfers=0; sign=NA. Amendment transport is executable; these runs do not establish an amendment-induced membership transfer or its counterfactual.
D6: ${verdict(d6)} relief foundings baseline/high=${baseRelief}/${highRelief}, delta=${highRelief - baseRelief}, per village-year=${format(baseRelief / (baseline.length * F.calendar.steps / 4))}/${format(highRelief / (high.length * F.calendar.steps / 4))} (expected positive); young/older dissolution hazard per org-quarter=${format(youngRate)}/${format(oldRate)} (expected decreasing); duration correlation with inside ties=${format(ties)} (expected positive), overlap=${format(overlap)} (expected negative); occupation match=${format(occupation)} vs null=${format(occupationNull)}, kin match=${format(kin)} vs null=${format(kinNull)} (expected higher). Yardsticks only, not tuned.
D7: ${verdict(d7)} no-network cross-household organisation snapshots=${sum(noNetwork, "crossHousehold")}; relief foundings baseline/no-shocks=${baseRelief}/${noRelief}; delta=${baseRelief - noRelief} (required positive).

Diagnostic illness-only (excluded from gate calculations): relief foundings baseline/illness-only=${baseRelief}/${sum(illnessOnly, "reliefFoundings")}; delta=${baseRelief - sum(illnessOnly, "reliefFoundings")}; illnesses=${sum(illnessOnly, "illnesses")}; deaths baseline/illness-only=${sum(baseline, "deaths")}/${sum(illnessOnly, "deaths")}; harvest losses unchanged.
Contact outcomes: realised contacts=${sum(rows, "networkContacts")}; positive_interaction deliveries=${sum(rows, "positiveInteractions")}; open ballots at horizon=${sum(rows, "openBallots")}.

## Protocol and evidence limits

The committed village contains 60 households and 250 people, not 300. All 250 have Cognition baseline minds with hunger, safety and social connection. A fixed rotating schedule lets ${F.calendar.decisionsPerStep} adults deliberate per quarter; pending founders also hear requests for consent. Children have minds but do not take social decisions. Four draft-topic slots and eight organisation-topic slots have ignorant priors declared at initialization; newly encountered organisations are bound to free topics on perception. Topics beyond that vocabulary stay unknown. Social connection accumulates over elapsed time and each realised network contact resets both minds through Cognition at the original contact time (delivered at the next host tick). Found/join/attend forecast company from perceived other members; leave forecasts the loss of recognised inside contacts. The saturating peer-count forecast is an explicit fixture, not a calibrated contact model. Outcome episodes are encoded, while charter-term latent learning is absent in this study (the separate three-person regression does exercise it). Network opportunities carry testimony but do not reinforce tie strength here. These omissions, sparse cadence and finite vocabulary limit ecological interpretation. Households are fixture relations and shared purses, not pre-created OrganisationStore actors.

Found offers are the Cartesian product of dues ${F.charter.dues.join("/")} and sick-relief ${F.charter.sickRelief.join("/")}, composed with open admission, a meeting and an explicit majority rule. Cognition chooses among whole compositions, including the no-relief choice; this is a fixture proposal vocabulary, not generative charter writing. Each draft now explicitly uses that same majority rule for amendments. Members may propose existing positive fixture amounts (dues 1/3, benefits 1/3/6), excluding the current amount; removing a benefit component is outside the amendment API. Ballots stay open for two quarterly meeting periods, the explicitly labelled charter decision interval. Society closes them at that boundary, without additional decisions or synthetic attendance/votes. Each opening, attendance and ballot attempt receives its own outcome; participants also observe the closing tally. Ballots still open at the fixed horizon are reported as censored, not resolved by the host. The existing neutral proposal/ballot forecast has no term-sensitive reward. No reference charter name or institutional kind drives behavior. Founding and consent are separate intentions. Recruitment testimony travels only over actual contact opportunities; no-network removes every exposure. Numeric terms reach minds through perception, not an offer-term lookup. Every attempted organisation action uses the host's Society attempt boundary; automatic unpaid dues are excluded from D3b's attempted refusals. Wrong reports are fixture speech and are not a historical error-rate claim.

All shocks, sensory values, forecasts, budgets and clocks are explicitly labelled fixture with reasons in fixtures.ts. Life hazard draws use per-person Kernel streams and remain paired across treatments. No-shocks disables illness, death and harvest losses together; it does not identify illness alone. High-illness changes only the illness probability. Household income, consumption, illness expense, dues and benefits are transfers to/from a closed stub ledger, including its external-sector account. Estates stay on that ledger after death. The membership observer independently reconstructs each roster from events after every tick; source intentions are matched back to Cognition emissions. Offered hours are grouped by actual contact timestamp/day, not delivery tick. Charters impose dues but no mandatory time obligations; compulsory-service enforcement is therefore not demonstrated.

Young is age <= one fixture year. Young/older dissolution counts=${sum(baseline, "youngDeaths")}/${sum(baseline, "oldDeaths")}; exposure org-quarters=${sum(baseline, "youngExposure")}/${sum(baseline, "oldExposure")}. Coarse within-quarter risk exposure is descriptive, not a survival model. Completed membership spells=${ended.length}, right-censored=${spells.length - ended.length}; correlations use completed spells and ties/overlap at entry. Censoring and entry-time covariates can bias those correlations; NA means no usable variation. Homophily uses all observed within-organisation pair snapshots (${sum(baseline, "memberPairs")}) against exact enumeration of all initial adult village pairs, equivalent to uniform draws from the eligible recruitment cohort. Deaths change that cohort later; the comparison does not correct for this or for network exposure. Occupation is an explicitly synthetic work-post-index proxy with ${F.settlement.occupationClasses} classes; missing occupations never match. Kin uses fixture genealogy. This is not independent-data validation.

Yardsticks are those specified in DESIGN §3: van Leeuwen (2016), mutual insurance demand; Freeman, Carroll & Hannan (1983), liability of newness; Popielarz & McPherson (1995), ties/niche overlap and duration; McPherson et al. (2001), homophily. No empirical numerical estimates are asserted here. Splits observed=${sum(baseline, "splits")}; the host does not transport split decisions. Amendment proposals and ballots are transported through the charter amendment component; attendance and the ordinary decision cadence are unchanged. Zero is a missing demonstration, not evidence against those phenomena. D5 remains undemonstrated, regardless of the other gates.

Reproduce: npm run bench:dsoc1. The bench writes REPORT.md, DIAGNOSIS.md and gitignored results/results.json; the test checks the exact results SHA-256 and reconstructs the evidence only when that file exists. A clean checkout still checks report structure and source freshness. results.json retains per-run counts, entry/exit spells, founding events with named consent, decision evidence, per-step shocks/purses, ledger aggregates, amendment events, exits and dissolutions. See DIAGNOSIS.md for the failed directions. A bench wrapper calls the unchanged Cognition reducer on the addressed mind and preserves global counters/streams; stock-runner equivalence is tested. Completed cognitive diagnostics are compacted after causal accounting; beliefs, needs, episodes, unresolved intentions and random state are retained. No tuning or seed selection occurs in the runner.

## Per-seed results

| Seed | Condition | Foundings | Relief | Dissolutions | Final count | Final sizes | Deaths | Wrong-term refusals |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${table}
`;
}
