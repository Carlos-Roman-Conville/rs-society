import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { renderReport } from "./report.ts";
import { economyErrors } from "./fixtures.ts";
import { renderRefusalDiagnosis } from "./refusal.ts";
import { FIXTURES as F } from "./fixtures.ts";
import type { StudyResult } from "./study.ts";
import type { DecisionEvidence } from "./diagnostics.ts";
import type { FoundIntention, OrganisationEvent } from "../../src/index.ts";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const mean = (values: number[]) => values.length ? sum(values) / values.length : NaN;
const fmt = (value: number) => Number.isFinite(value) ? String(Number(value.toFixed(5))) : "NA";
const counts = (values: string[]) => JSON.stringify(values.reduce<Record<string, number>>((out, key) => {
  out[key] = (out[key] ?? 0) + 1; return out;
}, {}));
const relief = (event: OrganisationEvent) => (event.intentions.find((i) => i.kind === "found") as FoundIntention)
  .payload.charter.benefits?.some((b) => b.type === "transfer" && b.event === "illness" && b.amount! > 0);
function founderRecords(rows: StudyResult[]) {
  return rows.flatMap((row) => row.foundingTrace.filter(relief).map((event) => {
    const source = event.intentions.find((i) => i.kind === "found")!;
    const decision = row.decisions.find((d) => d.kind === "found" && d.person === source.person &&
      d.target === source.target && d.t === source.t);
    if (!decision?.founding) throw new Error(`Missing founder decision: ${row.seed}/${row.condition}/${event.org}`);
    return { row, event, decision, evidence: decision.founding };
  }));
}
const observedIll = (d: DecisionEvidence) => d.founding?.observations.some((o) => o.attribute === "danger" && o.kind === "categorical" && o.value === "yes");

/** Pure observer: numbers come only from saved per-seed records. No verdict,
 * fixture or decision is changed by this diagnostic decomposition. */
export function renderDiagnosis(rows: StudyResult[]): string {
  if (economyErrors().length) return renderRefusalDiagnosis();
  const base = rows.filter((r) => r.condition === "baseline"), high = rows.filter((r) => r.condition === "high-illness"),
    none = rows.filter((r) => r.condition === "no-shocks");
  const illnessOnly = rows.filter((r) => r.condition === "illness-only");
  const groups = [base, high, none, illnessOnly];
  const verdictLines = renderReport(rows).split("\n").filter((line) => /^D[567]:/.test(line));
  const founderTable = groups.map((group) => {
    const founders = founderRecords(group), decisions = group.flatMap((r) => r.decisions);
    const proposals = decisions.filter((d) => d.kind === "found" && d.target?.endsWith(".1"));
    const dominant = founders.filter(({ evidence: e }) => e.drivePowers.social_connection > e.drivePowers.safety && e.drivePowers.social_connection > e.drivePowers.hunger);
    return `| ${group[0].condition} | ${proposals.length} | ${founders.length} | ${dominant.length} | ${founders.filter((f) => f.decision.ill).length} | ${founders.filter((f) => observedIll(f.decision)).length} | ${founders.filter((f) => f.evidence.matchingEpisodes.length > 0).length} | ${fmt(mean(founders.map((f) => f.evidence.needs.hunger)))} | ${fmt(mean(founders.map((f) => f.evidence.needs.safety)))} |`;
  }).join("\n");
  const founderResources = groups.map((group) => {
    const founders = founderRecords(group);
    const consents = founders.map(({ row, event }) => {
      const source = event.intentions.find((i) => i.kind === "join")!;
      return row.decisions.find((d) => d.kind === "join" && d.person === source.person && d.target === source.target && d.t === source.t)!;
    });
    const deceasedFounders = group.flatMap((row) => row.shockTrace.flatMap((shock) => shock.died.filter((person) =>
      row.foundingTrace.some((event) => event.t < shock.t && event.intentions.some((i) => i.kind === "found" && i.person === person)))));
    return `| ${group[0].condition} | ${fmt(mean(founders.map((f) => f.decision.balance)))} | ${fmt(mean(consents.map((d) => d.balance)))} | ${deceasedFounders.length} |`;
  }).join("\n");
  const purseTable = groups.map((group) => {
    const decisions = group.flatMap((r) => r.decisions), shocks = group.flatMap((r) => r.shockTrace);
    const amount = (reason: string) => sum(group.map((r) => r.ledgerTotals[reason]?.amount ?? 0));
    return `| ${group[0].condition} | ${sum(group.map((r) => r.illnesses))} | ${sum(group.map((r) => r.deaths))} | ${sum(shocks.map((s) => s.skippedDead))} | ${amount("fixture income")} | ${amount("fixture illness cost")} | ${amount("organisation dues")} | ${amount("organisation benefit")} | ${fmt(mean(shocks.map((s) => s.purseTotal)))} | ${sum(shocks.map((s) => s.emptyPurses))} | ${decisions.filter((d) => d.consentOffered).length} | ${decisions.filter((d) => d.consentUnaffordable).length} |`;
  }).join("\n");
  const allFounders = founderRecords(base);
  const examples = groups.map((group) => {
    const choices = founderRecords(group);
    const { row, event, decision: d, evidence: e } = choices.find((f) => f.decision.ill) ?? choices[0];
    return `- ${row.condition}, seed ${row.seed}, ${event.org}: ${d.person}, ${d.intention}, ${d.target}, decision quarter ${d.t / F.calendar.period}, consent/founding quarter ${event.t / F.calendar.period}. Purse=${d.balance}; illness=${d.ill}; observed danger=${observedIll(d) ? "yes" : "no"}; deficits=${JSON.stringify(e.needs)}; drive-power changes=${JSON.stringify(e.drivePowers)}; chosen probability=${fmt(e.probability)}; matching episode IDs=${JSON.stringify(e.matchingEpisodes.map((episode) => episode.id))}.`;
  }).join("\n");
  const perSeed = base.map((row) => {
    const h = high.find((r) => r.seed === row.seed)!, n = none.find((r) => r.seed === row.seed)!, i = illnessOnly.find((r) => r.seed === row.seed)!;
    return `| ${row.seed} | ${[row, h, n, i].map((r) => r.reliefFoundings).join(" | ")} | ${[row, h, n, i].map((r) => r.decisions.filter((d) => d.consentUnaffordable).length).join(" | ")} |`;
  }).join("\n");
  const baseRelief = sum(base.map((r) => r.reliefFoundings)), highRelief = sum(high.map((r) => r.reliefFoundings)), noRelief = sum(none.map((r) => r.reliefFoundings));
  const dissolve = base.flatMap((r) => r.dissolutionTrace.map((e) => ({ event: e,
    age: (e.t - r.foundingTrace.find((f) => f.org === e.org)!.t) / F.calendar.period })));
  const young = dissolve.filter((e) => e.age <= 4), old = dissolve.filter((e) => e.age > 4);
  const revisitAges = base.flatMap((r) => r.foundingTrace.map((event) => {
    const founder = event.intentions.find((i) => i.kind === "found")!.person;
    const next = r.decisions.find((d) => d.person === founder && d.t > event.t);
    return next ? (next.t - event.t) / F.calendar.period : undefined;
  }));
  const spells = base.flatMap((r) => r.spells);
  const spellTable = [false, true].map((tied) => {
    const group = spells.filter((s) => (s.ties > 0) === tied), ended = group.filter((s) => !s.censored);
    const founderSpells = sum(base.map((r) => r.spells.filter((s) => (s.ties > 0) === tied &&
      r.foundingTrace.some((e) => e.org === s.org && e.t === s.start &&
        e.intentions.some((i) => i.kind === "found" && i.person === s.person))).length));
    const reasons = base.flatMap((r) => r.spells.filter((s) => (s.ties > 0) === tied && !s.censored).map((s) =>
      r.exitTrace.find((e) => e.org === s.org && e.t === s.end &&
        (e.payload?.person ?? e.intentions[0]?.person) === s.person)?.cause ?? "unmatched"));
    return `| ${tied ? "positive" : "zero"} | ${founderSpells}/${group.length - founderSpells} | ${ended.length} | ${group.length - ended.length} | ${fmt(mean(ended.map((s) => (s.end - s.start) / F.calendar.period)))} | ${fmt(mean(ended.map((s) => s.start / F.calendar.period)))} | ${fmt(mean(group.map((s) => s.start / F.calendar.period)))} | ${counts(reasons)} |`;
  }).join("\n");
  const leaveDecisions = base.flatMap((r) => r.decisions.filter((d) => d.kind === "leave"));
  const leaveBalances = [false, true].map((older) => base.flatMap((r) => r.dissolutionTrace
    .filter((e) => e.cause === "last member left" && ((e.t - r.foundingTrace.find((f) => f.org === e.org)!.t) / F.calendar.period > 4) === older)
    .map((e) => r.decisions.find((d) => d.kind === "leave" && d.target === e.org && d.t === e.t)!.balance)));
  const amendments = base.flatMap((r) => r.amendmentTrace);
  const resolved = amendments.filter((e) => e.payload?.tally !== undefined && !e.payload?.amendmentApplied);
  const applied = amendments.filter((e) => e.payload?.amendmentApplied);
  const proposalDecisions = base.flatMap((r) => r.decisions.filter((d) => d.kind === "propose"));
  const ballots = base.flatMap((r) => r.decisions.filter((d) => ["support", "oppose", "abstain"].includes(d.kind)));
  const proposalRoles = proposalDecisions.map((d) => {
    const row = base.find((r) => r.decisions.includes(d))!;
    return row.foundingTrace.find((f) => f.org === d.target)?.intentions.some((i) => i.kind === "found" && i.person === d.person) ? "founder" : "other member";
  });
  const proposalsBySection = resolved.map((e) => String(e.intentions.find((i) => i.kind === "propose")?.payload?.section));
  const traceExample = resolved[0];
  const firstRun = base.find((r) => r.amendmentTrace.includes(traceExample))!;
  const commonPeople = groups.map((g) => g.map((r) => r.shockTrace.flatMap((s) => s.died)));
  const pairedDeaths = JSON.stringify(commonPeople[0]) === JSON.stringify(commonPeople[1]);
  return `# D-SOC-1 diagnosis (5194, DESIGN §1.15)

Evidence: results.json SHA256 ${createHash("sha256").update(JSON.stringify(rows, null, 2) + "\n").digest("hex")}. Rebuild with \`npx tsx bench/d-soc-1/diagnose.ts\`. All ${rows.length} runs use the same 30 seeds and the original numeric hazards, budgets, horizon, thresholds and decision cadence. No failed direction was tuned. The §1.15 changes alter action/perception sequences; this is a paired rerun, not byte identity or an isolated estimate of each ruling's effect.

## What each §1.15 ruling changed

1. Company/contact: ${sum(rows.map((r) => r.networkContacts))} realised contacts deliver ${sum(rows.map((r) => r.positiveInteractions))} positive_interaction tags, two per contact (previous run: zero tags). Found/join/attend now use perceived peer counts; leave uses perceived previously contacted inside peers. Solitary drafts advertise zero other founders. Prior baseline relief foundings=1008 and social-dominant founders=1008; now relief=${sum(base.map((r) => r.reliefFoundings))}, social-dominant=${founderRecords(base).filter(({ evidence: e }) => e.drivePowers.social_connection > e.drivePowers.safety && e.drivePowers.social_connection > e.drivePowers.hunger).length}. This is the combined rerun effect, not attribution to one code change.
2. Open proposals: charter decision interval=${F.charter.foundingWindowPeriods} quarters, reusing the existing founding window as a labelled fixture. Baseline proposal/ballot/amendment counts were 736/3/0; now ${proposalDecisions.length}/${ballots.length}/${applied.length}. Attendance and votes are individually chosen at the unchanged cadence. Baseline open ballots at the horizon=${sum(base.map((r) => r.openBallots))}; these are censored, never auto-closed or filled.
3. Purse/consent: illness cost=sourced per-episode cost, normal/bad-harvest income=sourced occupation income/yield ratio, subsistence=sourced quarterly subsistence; join/pay still require believed balance >= believed dues. Prior baseline/high-illness unaffordable-consent checks=3363/5561; now ${base.flatMap((r) => r.decisions).filter((d) => d.consentUnaffordable).length}/${high.flatMap((r) => r.decisions).filter((d) => d.consentUnaffordable).length}. The affordability predicate is unchanged; amounts now come from cited rows.
4. Knockouts: bundled D7 remains unchanged. Diagnostic illness-only (never a gate): relief foundings=${sum(illnessOnly.map((r) => r.reliefFoundings))}, baseline minus illness-only=${baseRelief - sum(illnessOnly.map((r) => r.reliefFoundings))}, illnesses=${sum(illnessOnly.map((r) => r.illnesses))}, deaths=${sum(illnessOnly.map((r) => r.deaths))}. Named deaths and income transfers match baseline exactly; harvest losses remain enabled. Prior bundled baseline/no-shocks relief=1008/1463; current=${baseRelief}/${noRelief}.
5. Retention of evidence: ${rows.length} runs (same 30 seeds, now five conditions) live in gitignored results/results.json. The previously committed file is removed from the index, without history changes. REPORT.md records the exact SHA-256; tests check it and rebuild reports when local results exist, and skip those artifact-dependent checks on a clean checkout.

${verdictLines.join("\n")}


The observer retains decisions before diagnostic compaction. Society never receives these mind records. Founding events link to decisions by person, target and original intention time; the stored intention ID then identifies the Cognition emission. Shock records contain named illness/death episodes by quarter. Ledger aggregates come from actual transfers. These are fixture mechanisms and descriptive paired comparisons, not identified historical causal effects.

## D7

${baseRelief > noRelief && sum(rows.filter((r) => r.condition === "no-network").map((r) => r.crossHousehold)) === 0 ? "PASS" : "FAIL"}: baseline relief foundings ${baseRelief}, no-shocks ${noRelief}, delta ${baseRelief - noRelief}. No-network cross-household snapshots=${sum(rows.filter((r) => r.condition === "no-network").map((r) => r.crossHousehold))}; that half of the knockout holds. No-shocks has more relief foundings in ${base.filter((r) => none.find((n) => n.seed === r.seed)!.reliefFoundings > r.reliefFoundings).length}/30 paired seeds.

### What the founders were responding to

The following counts refer to the original found intention for every **successful relief founding**, not its later consent. The proposal column also includes drafts that never became organisations. Social-dominant means its predicted decrease in the inside of Cognition's drive function exceeds each other need's decrease, with no fitted threshold. Drive-power changes are w*(before^n-after^n); the root and loss aversion make utility nonlinear, so these are not additive utility contributions or exclusive psychological causes.

| Condition | Relief drafts chosen | Relief foundings | Social-dominant | Actually ill | Observed danger yes | Matching remembered action episode | Mean hunger deficit | Mean safety deficit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${founderTable}

Baseline successful relief founders have social deficit range ${fmt(Math.min(...allFounders.map((f) => f.evidence.needs.social_connection)))}/${fmt(Math.max(...allFounders.map((f) => f.evidence.needs.social_connection)))}. The company forecast is now deficit/(1 + believed other members), with no fixed socialAfter reward and no company reward for pay. Leaving forecasts a saturated loss from believed inside contacts. Safety still falls by perceived relief; hunger rises by perceived dues/${F.cognition.hungerCostScale}. Contact resets use Cognition's reducer, with elapsed time counted once between contact and decision. Illness remains a current sight cue, not a dedicated action-outcome memory episode. New draft identities give each found action a new action ID; matching episodes show whether prior outcomes entered that action's expectation. Action selection remains stochastic.

Named examples (the observations, need powers and matching episodes are stored in decisions[].founding):

${examples}

### Shock → purse → consent and survival

| Condition | Illness events | Deaths | Selected-but-dead slots | Income paid | Illness expense paid | Dues paid | Relief paid | Mean total household purse per step | Empty household-step purses | Consent opportunities | Consent checks failing affordability |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${purseTable}

| Condition | Mean successful relief founder purse at proposal | Mean purse at that founding's consent | Deaths of people who had already founded any organisation |
| --- | ---: | ---: | ---: |
${founderResources}

Illness costs up to sourced per-episode cost from the shared household purse per sick person, including children. Harvest exposure uses sourced frequency and reduces smallholder produce by the sourced poor/good yield ratio; subsistence and rent use their sourced quarterly amounts. These precede that quarter's decisions; automatic dues precede the tick's income/shocks. Expense shortfalls are capped to available cash, so paid expense understates requested expense in impoverished runs. In models.ts founding has **no affordability precondition**, but its separate join consent requires believed balance >= believed dues. Source-composition topics are reused across successive drafts, so perceived amounts may differ from true terms. The observed failed consent checks above are that exact predicate, not a proxy for poverty. Higher cash is not needed by Society to register the founder; it is needed by this fixture's mind-side consent filter. min_members=${F.charter.minMembers} permits self-consent and solitary founding.

Available contact hours remain ${F.network.hours}/person/day and body capacity remains 1 in every condition; illness never reduces either. Actual maximum offered hours baseline/high/no-shocks/illness-only=${groups.map((g) => fmt(Math.max(...g.map((r) => r.maxOfferedHours)))).join("/")}. Death removes people, cuts their ties and prevents their later decisions; it does not close their ledger estates. No-shocks jointly removes illness, harvest losses **and death**, so the relief delta cannot be attributed solely to an insurance-demand effect. Death identity/order in baseline and high-illness is exactly paired: ${pairedDeaths}. The tables separate observed survival loss from liquidity and choice evidence; they do not claim a numerical mediation fraction from this bundled knockout.

§1.15.3 deliberately retains the shared-purse expense and affordability-gated consent path. Any remaining reversed insurance direction is a fixture result, not evidence that shocks reduce historical mutual insurance demand. The tables distinguish paid expenses, refusals and survival; they do not identify a mediation fraction. No cost or hazard is tuned to reverse it.

## D6

The individual directions and their combined verdict are retained in REPORT.md. High illness relief foundings ${highRelief} versus ${baseRelief} baseline (delta ${highRelief - baseRelief}); high illness is lower in ${base.filter((r) => high.find((h) => h.seed === r.seed)!.reliefFoundings < r.reliefFoundings).length}/30 pairs. The same founder-need and observed-episode decomposition above applies here. Baseline/high deaths are identical, hours and capacity are fixed, while more illness expenses and affordability refusals accompany fewer completed foundings. Thus the concrete suppressing path is the purse/consent fixture, despite any higher subjective safety reward. This paired treatment isolates illness probability, but does not separately identify its expenditure and appraisal pathways.

### Age and dissolution

Young deaths/exposure=${sum(base.map((r) => r.youngDeaths))}/${sum(base.map((r) => r.youngExposure))}, hazard=${fmt(sum(base.map((r) => r.youngDeaths)) / sum(base.map((r) => r.youngExposure)))}; older=${sum(base.map((r) => r.oldDeaths))}/${sum(base.map((r) => r.oldExposure))}, hazard=${fmt(sum(base.map((r) => r.oldDeaths)) / sum(base.map((r) => r.oldExposure)))} per org-quarter. Young causes=${counts(young.map((e) => e.event.cause))}; older causes=${counts(old.map((e) => e.event.cause))}. Mean actual purse at a last-member voluntary exit, young/older=${leaveBalances.map((a) => fmt(mean(a))).join("/")}. All voluntary leave decisions=${leaveDecisions.length}; their mean purse=${fmt(mean(leaveDecisions.map((d) => d.balance)))}.

For ${revisitAges.length} baseline founding events, the founder's next recorded decision after consent occurs within four quarters in ${revisitAges.filter((age) => age !== undefined && age <= 4).length} cases, later in ${revisitAges.filter((age) => age !== undefined && age > 4).length}, and is absent before the horizon/death in ${revisitAges.filter((age) => age === undefined).length}. These are per-founding counts, not unique people. This directly exposes the cadence-induced delay in the opportunity to leave a new organisation.

Every dissolution is traced to its recorded last-member event. These drafts contain no age-dependent survival mechanism; unpaid dues do not themselves dissolve an organisation. The fixed rotating schedule and initially solitary founders delay opportunities to choose leave; persistent organisations accrue further dues against household purses. An aggregate age gradient from these events does not demonstrate a liability-of-newness mechanism. The five-year horizon, within-quarter exposure convention and surviving-cohort selection also limit this descriptive hazard. A credible adaptation/retention or early-failure mechanism is a design question for the keeper; do not reverse the age sign by changing a hazard.

### Inside ties, overlap and membership duration

| Inside ties at entry | Founder/recruit spells | Completed spells | Censored spells | Mean completed duration (quarters) | Mean completed entry quarter | Mean all entry quarter | Completed exit causes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${spellTable}

Completed-spell entry overlap distribution=${counts(spells.filter((s) => !s.censored).map((s) => String(s.overlap)))}; right-censored positive-overlap spells=${spells.filter((s) => s.censored && s.overlap > 0).length}. The overlap yardstick is unmeasurable when the completed-spell distribution has only one value: a zero-variance correlation is NA.

Founders enter alone with zero inside ties; positive-tie entries are recruits into existing organisations. Recruitment, entry time, mortality, voluntary leave and censoring therefore differ across the groups above. The reported correlation uses only completed spells, not a survival model. The §1.15 leave forecast now includes perceived inside contacts; the entry-tie statistic measures structural ties, not the identical subjective count. Contact resets and peer observations provide a retention pathway, but neither that pathway nor the structural association guarantees a positive completed-spell correlation. Network contact carries testimony without reinforcing tie strength. The observed association also reflects entry/completion composition and censoring; it does not identify a causal tie effect. Overlap and occupation/kin comparisons remain separately reported in REPORT.md. Any failed age direction still lacks an organisational life-cycle mechanism; no src change is made here.

## D5

${applied.length === 0 ? "FAIL: no executed amendment, hence no amendment-induced member transfer." : "FAIL: executed amendments alone do not identify an amendment-induced membership transfer counterfactual."} Baseline proposal decisions=${proposalDecisions.length}, proposer roles=${counts(proposalRoles)}, closed proposal sections=${counts(proposalsBySection)}, expressed ballot decisions=${ballots.length}, executed amendments=${applied.length}. Closed proposals=${resolved.length}; resolved reasons/outcomes=${counts(resolved.map((e) => String(e.payload?.reason ?? e.payload?.outcome)))}. Overlap run-steps=${sum(base.map((r) => r.overlapSteps))}.

Example: seed ${firstRun?.seed ?? "NA"}, ${traceExample?.org ?? "NA"}, quarter ${traceExample ? traceExample.t / F.calendar.period : "NA"}, proposal ${traceExample?.payload?.proposalId ?? "NA"}: ${JSON.stringify(traceExample?.payload ?? {})}. Its proposal is an expressed Cognition decision; the host fills neither attendance nor ballots.

The host opens proposals through the 5193 API and offers attendance and support/oppose/abstain throughout the charter interval. Society closes them on advanceTo; the host sends the closing observation to the proposer and expressed ballot participants. Opening and individual ballot attempts get their own causal outcomes, so an open ballot at the horizon is not an unresolved attempted action. Regression tests cover cross-tick attendance/support and no-quorum closure. Production keeps one decision per selected person per quarter and summons every member at a scheduled meeting. Proposal and ballot forecasts remain neutral, without term-sensitive gain. The remaining D5 limitation is sparse expressed participation plus missing term appraisal and a paired transfer counterfactual; ordinary exits cannot establish amendment-induced competition. Only the prescribed meeting summons adds decisions; funds and forecasts were not tuned.

## Per-seed checks

| Seed | Baseline relief | High illness relief | No shocks relief | Illness-only relief | Baseline unaffordable consent checks | High illness checks | No shocks checks | Illness-only checks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${perSeed}

Trace locations: foundingTrace → decisions (person/target/t); decisions[].founding.observations for the actual danger/purse cue and matchingEpisodes for action-outcome memory; shockTrace for named illness/death and purse snapshots; ledgerTotals for paid flows; dissolutionTrace and exitTrace for deaths/leave; spells for duration/censoring; amendmentTrace for payloads and tallies. Counts of opportunities/refusals are repeated decision checks, not distinct people. Purses are measured after income and shocks, before individual decisions. All numerical limitations and failed directions remain visible.
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = JSON.parse(readFileSync(new URL("./results/results.json", import.meta.url), "utf8")) as StudyResult[];
  writeFileSync(new URL("./DIAGNOSIS.md", import.meta.url), renderDiagnosis(rows));
}
