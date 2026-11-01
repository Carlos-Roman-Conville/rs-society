# D-SOC-1 diagnosis (5194, DESIGN §1.15)

Evidence: results.json SHA256 80e64db7abaa5823b2f47fb686cc8ccf4f3ec47b4d1241ac79e4837f7d772372. Rebuild with `npx tsx bench/d-soc-1/diagnose.ts`. All 150 runs use the same 30 seeds and the original numeric hazards, budgets, horizon, thresholds and decision cadence. No failed direction was tuned. The §1.15 changes alter action/perception sequences; this is a paired rerun, not byte identity or an isolated estimate of each ruling's effect.

## What each §1.15 ruling changed

1. Company/contact: 209296 realised contacts deliver 418592 positive_interaction tags, two per contact (previous run: zero tags). Found/join/attend now use perceived peer counts; leave uses perceived previously contacted inside peers. Solitary drafts advertise zero other founders. Prior baseline relief foundings=1008 and social-dominant founders=1008; now relief=720, social-dominant=0. This is the combined rerun effect, not attribution to one code change.
2. Open proposals: charter decision interval=2 quarters, reusing the existing founding window as a labelled fixture. Baseline proposal/ballot/amendment counts were 736/3/0; now 446/31/0. Attendance and votes are individually chosen at the unchanged cadence. Baseline open ballots at the horizon=79; these are censored, never auto-closed or filled.
3. Purse/consent: illness cost=3, normal/bad-harvest income=4/1, subsistence=3; join/pay still require believed balance >= believed dues. Prior baseline/high-illness unaffordable-consent checks=3363/5561; now 2723/4998. Amounts and the predicate are unchanged; frequencies respond to the altered choices.
4. Knockouts: bundled D7 remains unchanged. Diagnostic illness-only (never a gate): relief foundings=969, baseline minus illness-only=-249, illnesses=0, deaths=739. Named deaths and income transfers match baseline exactly; harvest losses remain enabled. Prior bundled baseline/no-shocks relief=1008/1463; current=720/1075.
5. Retention of evidence: 150 runs (same 30 seeds, now five conditions) live in gitignored results/results.json. The previously committed file is removed from the index, without history changes. REPORT.md records the exact SHA-256; tests check it and rebuild reports when local results exist, and skip those artifact-dependent checks on a clean checkout.

D5: FAIL overlap run-steps=176; joins=252; exits including death=410; amendment proposals=446; expressed ballots=31; executed dues/benefit amendments=0; intention-traced amendment-induced transfers=0; sign=NA. Amendment transport is executable; these runs do not establish an amendment-induced membership transfer or its counterfactual.
D6: FAIL relief foundings baseline/high=720/435, delta=-285, per village-year=4.8/2.9 (expected positive); young/older dissolution hazard per org-quarter=0.00508/0.03033 (expected decreasing); duration correlation with inside ties=-0.22787 (expected positive), overlap=NA (expected negative); occupation match=0.42087 vs null=0.32773, kin match=0.45545 vs null=0.01078 (expected higher). Yardsticks only, not tuned.
D7: FAIL no-network cross-household organisation snapshots=0; relief foundings baseline/no-shocks=720/1075; delta=-355 (required positive).


The observer retains decisions before diagnostic compaction. Society never receives these mind records. Founding events link to decisions by person, target and original intention time; the stored intention ID then identifies the Cognition emission. Shock records contain named illness/death episodes by quarter. Ledger aggregates come from actual transfers. These are fixture mechanisms and descriptive paired comparisons, not identified historical causal effects.

## D7

FAIL: baseline relief foundings 720, no-shocks 1075, delta -355. No-network cross-household snapshots=0; that half of the knockout holds. No-shocks has more relief foundings in 30/30 paired seeds.

### What the founders were responding to

The following counts refer to the original found intention for every **successful relief founding**, not its later consent. The proposal column also includes drafts that never became organisations. Social-dominant means its predicted decrease in the inside of Cognition's drive function exceeds each other need's decrease, with no fitted threshold. Drive-power changes are w*(before^n-after^n); the root and loss aversion make utility nonlinear, so these are not additive utility contributions or exclusive psychological causes.

| Condition | Relief drafts chosen | Relief foundings | Social-dominant | Actually ill | Observed danger yes | Matching remembered action episode | Mean hunger deficit | Mean safety deficit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 1897 | 720 | 0 | 74 | 74 | 0 | 0.20729 | 0.09751 |
| high-illness | 2004 | 435 | 0 | 84 | 84 | 0 | 0.26092 | 0.18207 |
| no-shocks | 1918 | 1075 | 0 | 0 | 0 | 0 | 0.06109 | 0 |
| illness-only | 1858 | 969 | 0 | 0 | 0 | 0 | 0.05315 | 0 |

Baseline successful relief founders have social deficit range 0.00474/1. The company forecast is now deficit/(1 + believed other members), with no fixed socialAfter reward and no company reward for pay. Leaving forecasts a saturated loss from believed inside contacts. Safety still falls by perceived relief; hunger rises by perceived dues/12. Contact resets use Cognition's reducer, with elapsed time counted once between contact and decision. Illness remains a current sight cue, not a dedicated action-outcome memory episode. New draft identities give each found action a new action ID; matching episodes show whether prior outcomes entered that action's expectation. Action selection remains stochastic.

Named examples (the observations, need powers and matching episodes are stored in decisions[].founding):

- baseline, seed 1, org.0002: person.0002, int.0002, draft.person.0002.1.0.1, decision quarter 1, consent/founding quarter 2. Purse=10; illness=true; observed danger=yes; deficits={"hunger":0.16666666666666663,"safety":0.9999999998822442,"social_connection":1}; drive-power changes={"hunger":-0.0033844192982319474,"safety":0.918442503887744,"social_connection":0}; chosen probability=0.30284; matching episode IDs=[].
- high-illness, seed 1, org.0002: person.0002, int.0002, draft.person.0002.1.0.1, decision quarter 1, consent/founding quarter 2. Purse=4; illness=true; observed danger=yes; deficits={"hunger":0.6666666666666667,"safety":0.9999999998822442,"social_connection":1}; drive-power changes={"hunger":-0.12551497868302836,"safety":0.918442503887744,"social_connection":0}; chosen probability=0.30806; matching episode IDs=[].
- no-shocks, seed 1, org.0002: person.0002, int.0002, draft.person.0002.1.0.1, decision quarter 1, consent/founding quarter 2. Purse=13; illness=false; observed danger=no; deficits={"hunger":0,"safety":1.4537753717066222e-12,"social_connection":1}; drive-power changes={"hunger":-0.00005791742386882694,"safety":4.102430223350468e-48,"social_connection":0}; chosen probability=0.23537; matching episode IDs=[].
- illness-only, seed 1, org.0002: person.0002, int.0002, draft.person.0002.1.0.1, decision quarter 1, consent/founding quarter 2. Purse=13; illness=false; observed danger=no; deficits={"hunger":0,"safety":1.4537753717066222e-12,"social_connection":1}; drive-power changes={"hunger":-0.00005791742386882694,"safety":4.102430223350468e-48,"social_connection":0}; chosen probability=0.23537; matching episode IDs=[].

### Shock → purse → consent and survival

| Condition | Illness events | Deaths | Selected-but-dead slots | Income paid | Illness expense paid | Dues paid | Relief paid | Mean total household purse per step | Empty household-step purses | Consent opportunities | Consent checks failing affordability |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 11435 | 739 | 440 | 116351 | 22501 | 13709 | 2346 | 341.85833 | 7637 | 6591 | 2723 |
| high-illness | 22753 | 739 | 448 | 116351 | 33066 | 6760 | 1878 | 212.30333 | 14388 | 7283 | 4998 |
| no-shocks | 0 | 0 | 0 | 144000 | 0 | 35256 | 0 | 898.285 | 0 | 6390 | 376 |
| illness-only | 0 | 739 | 442 | 116351 | 0 | 25329 | 0 | 622.32833 | 2244 | 6160 | 833 |

| Condition | Mean successful relief founder purse at proposal | Mean purse at that founding's consent | Deaths of people who had already founded any organisation |
| --- | ---: | ---: | ---: |
| baseline | 10.12778 | 9.31806 | 85 |
| high-illness | 9.2069 | 7.87586 | 52 |
| no-shocks | 17.18512 | 17.8614 | 0 |
| illness-only | 13.86687 | 13.80289 | 104 |

Illness costs up to 3 from the shared household purse per sick person, including children. Every fourth quarter harvest income falls 4→1 while subsistence asks 3. These precede that quarter's decisions; automatic dues precede the tick's income/shocks. Expense shortfalls are capped to available cash, so paid expense understates requested expense in impoverished runs. In models.ts founding has **no affordability precondition**, but its separate join consent requires believed balance >= believed dues. The original four draft topics are reused across successive drafts, so perceived amounts may differ from true terms. The observed failed consent checks above are that exact predicate, not a proxy for poverty. Higher cash is not needed by Society to register the founder; it is needed by this fixture's mind-side consent filter. min_members=1 permits self-consent and solitary founding.

Available contact hours remain 2/person/day and body capacity remains 1 in every condition; illness never reduces either. Actual maximum offered hours baseline/high/no-shocks/illness-only=0.75/0.75/0.75/0.75. Death removes people, cuts their ties and prevents their later decisions; it does not close their ledger estates. No-shocks jointly removes illness, harvest losses **and death**, so the relief delta cannot be attributed solely to an insurance-demand effect. Death identity/order in baseline and high-illness is exactly paired: true. The tables separate observed survival loss from liquidity and choice evidence; they do not claim a numerical mediation fraction from this bundled knockout.

§1.15.3 deliberately retains the shared-purse expense and affordability-gated consent path. Any remaining reversed insurance direction is a fixture result, not evidence that shocks reduce historical mutual insurance demand. The tables distinguish paid expenses, refusals and survival; they do not identify a mediation fraction. No cost or hazard is tuned to reverse it.

## D6

The individual directions and their combined verdict are retained in REPORT.md. High illness relief foundings 435 versus 720 baseline (delta -285); high illness is lower in 30/30 pairs. The same founder-need and observed-episode decomposition above applies here. Baseline/high deaths are identical, hours and capacity are fixed, while more illness expenses and affordability refusals accompany fewer completed foundings. Thus the concrete suppressing path is the purse/consent fixture, despite any higher subjective safety reward. This paired treatment isolates illness probability, but does not separately identify its expenditure and appraisal pathways.

### Age and dissolution

Young deaths/exposure=28/5514, hazard=0.00508; older=306/10089, hazard=0.03033 per org-quarter. Young causes={"last member death":28}; older causes={"last member left":260,"last member death":46}. Mean actual purse at a last-member voluntary exit, young/older=NA/1.03462. All voluntary leave decisions=323; their mean purse=1.1548.

For 1425 baseline founding events, the founder's next recorded decision after consent occurs within four quarters in 0 cases, later in 1140, and is absent before the horizon/death in 285. These are per-founding counts, not unique people. This directly exposes the cadence-induced delay in the opportunity to leave a new organisation.

Every dissolution is traced to its recorded last-member event. These drafts contain no age-dependent survival mechanism; unpaid dues do not themselves dissolve an organisation. The fixed rotating schedule and initially solitary founders delay opportunities to choose leave; persistent organisations accrue further dues against household purses. An aggregate age gradient from these events does not demonstrate a liability-of-newness mechanism. The five-year horizon, within-quarter exposure convention and surviving-cohort selection also limit this descriptive hazard. A credible adaptation/retention or early-failure mechanism is a design question for the keeper; do not reverse the age sign by changing a hazard.

### Inside ties, overlap and membership duration

| Inside ties at entry | Founder/recruit spells | Completed spells | Censored spells | Mean completed duration (quarters) | Mean completed entry quarter | Mean all entry quarter | Completed exit causes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| zero | 1425/4 | 367 | 1062 | 8.6049 | 6.0218 | 7.79846 | {"death":77,"accepted leave":290} |
| positive | 0/248 | 43 | 205 | 6.46512 | 9.02326 | 13.10081 | {"accepted leave":33,"death":10} |

Completed-spell entry overlap distribution={"0":410}; right-censored positive-overlap spells=55. The overlap yardstick is unmeasurable when the completed-spell distribution has only one value: a zero-variance correlation is NA.

Founders enter alone with zero inside ties; positive-tie entries are recruits into existing organisations. Recruitment, entry time, mortality, voluntary leave and censoring therefore differ across the groups above. The reported correlation uses only completed spells, not a survival model. The §1.15 leave forecast now includes perceived inside contacts; the entry-tie statistic measures structural ties, not the identical subjective count. Contact resets and peer observations provide a retention pathway, but neither that pathway nor the structural association guarantees a positive completed-spell correlation. Network contact carries testimony without reinforcing tie strength. The observed association also reflects entry/completion composition and censoring; it does not identify a causal tie effect. Overlap and occupation/kin comparisons remain separately reported in REPORT.md. Any failed age direction still lacks an organisational life-cycle mechanism; no src change is made here.

## D5

FAIL: no executed amendment, hence no amendment-induced member transfer. Baseline proposal decisions=446, proposer roles={"founder":406,"other member":40}, closed proposal sections={"obligations":200,"benefits":167}, expressed ballot decisions=31, executed amendments=0. Closed proposals=367; resolved reasons/outcomes={"no quorum":349,"tie with no tie-break":17,"rejected":1}. Overlap run-steps=176.

Example: seed 1, org.0001, quarter 13, proposal fixture.proposal.1: {"proposalId":"fixture.proposal.1","outcome":"no_act","tally":{"eligible":["person.0001"],"present":[],"electorate":["person.0001"],"support":[],"oppose":[],"abstain":[],"unexpressed":["person.0001"],"excluded":[],"denominator":1,"quorumRequired":1},"reason":"no quorum"}. Its proposal is an expressed Cognition decision; the host fills neither attendance nor ballots.

The host opens proposals through the 5193 API and offers attendance and support/oppose/abstain throughout the charter interval. Society closes them on advanceTo; the host sends the closing observation to the proposer and expressed ballot participants. Opening and individual ballot attempts get their own causal outcomes, so an open ballot at the horizon is not an unresolved attempted action. Regression tests cover cross-tick attendance/support and no-quorum closure. Production keeps one decision per selected person per quarter; a two-quarter interval does not guarantee that a particular member is selected again. Proposal and ballot forecasts remain neutral, without term-sensitive gain. The remaining D5 limitation is sparse expressed participation plus missing term appraisal and a paired transfer counterfactual; ordinary exits cannot establish amendment-induced competition. No extra deliberations, funds or better forecasts were injected to pass.

## Per-seed checks

| Seed | Baseline relief | High illness relief | No shocks relief | Illness-only relief | Baseline unaffordable consent checks | High illness checks | No shocks checks | Illness-only checks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 27 | 10 | 45 | 39 | 95 | 194 | 19 | 36 |
| 2 | 25 | 13 | 36 | 36 | 101 | 168 | 9 | 17 |
| 3 | 24 | 15 | 38 | 34 | 98 | 194 | 4 | 31 |
| 4 | 27 | 16 | 41 | 38 | 89 | 172 | 7 | 28 |
| 5 | 14 | 8 | 29 | 22 | 89 | 178 | 18 | 26 |
| 6 | 25 | 15 | 38 | 34 | 96 | 182 | 13 | 30 |
| 7 | 23 | 13 | 32 | 28 | 88 | 160 | 10 | 24 |
| 8 | 24 | 10 | 35 | 32 | 89 | 169 | 11 | 23 |
| 9 | 23 | 12 | 31 | 29 | 86 | 175 | 20 | 30 |
| 10 | 22 | 12 | 34 | 28 | 63 | 123 | 19 | 35 |
| 11 | 26 | 18 | 35 | 34 | 95 | 166 | 18 | 21 |
| 12 | 22 | 11 | 33 | 32 | 95 | 147 | 2 | 19 |
| 13 | 20 | 12 | 37 | 33 | 93 | 166 | 10 | 33 |
| 14 | 26 | 20 | 37 | 35 | 103 | 179 | 13 | 34 |
| 15 | 23 | 16 | 37 | 32 | 75 | 140 | 6 | 14 |
| 16 | 27 | 17 | 35 | 33 | 78 | 178 | 8 | 18 |
| 17 | 18 | 10 | 27 | 24 | 96 | 186 | 9 | 33 |
| 18 | 16 | 8 | 32 | 28 | 83 | 146 | 3 | 15 |
| 19 | 25 | 13 | 44 | 41 | 100 | 157 | 18 | 34 |
| 20 | 22 | 11 | 31 | 26 | 89 | 177 | 14 | 22 |
| 21 | 31 | 19 | 39 | 35 | 81 | 169 | 15 | 21 |
| 22 | 30 | 20 | 36 | 36 | 77 | 149 | 12 | 35 |
| 23 | 31 | 24 | 39 | 38 | 87 | 157 | 28 | 37 |
| 24 | 24 | 11 | 36 | 32 | 83 | 167 | 12 | 31 |
| 25 | 25 | 18 | 38 | 32 | 115 | 170 | 10 | 25 |
| 26 | 28 | 20 | 45 | 39 | 90 | 147 | 26 | 38 |
| 27 | 28 | 23 | 41 | 38 | 104 | 165 | 12 | 28 |
| 28 | 20 | 14 | 29 | 28 | 107 | 170 | 5 | 23 |
| 29 | 22 | 15 | 34 | 30 | 95 | 162 | 13 | 37 |
| 30 | 22 | 11 | 31 | 23 | 83 | 185 | 12 | 35 |

Trace locations: foundingTrace → decisions (person/target/t); decisions[].founding.observations for the actual danger/purse cue and matchingEpisodes for action-outcome memory; shockTrace for named illness/death and purse snapshots; ledgerTotals for paid flows; dissolutionTrace and exitTrace for deaths/leave; spells for duration/censoring; amendmentTrace for payloads and tallies. Counts of opportunities/refusals are repeated decision checks, not distinct people. Purses are measured after income and shocks, before individual decisions. All numerical limitations and failed directions remain visible.
