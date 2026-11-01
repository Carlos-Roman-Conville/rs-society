# D-SOC-1: a parish forms its fraternities

Acceptance: FAIL. Integrity of a recorded FAIL is not acceptance of P6.

Source SHA256: fd700f2c3d850b225919b0eef976d8506d2550194ab6686b9d81720961f7fe6b
Study inputs SHA256: 1be5ecbf103840d469851acc309ba0ac3056d3ae5f2b7b4de41a6a4245668811
Cognition src SHA256: b73a4f2e3fc97779435f8d34fa7cba926d76d5e08cd1396f1168693a0b335f17
Seed count: 30
Seeds: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
Results SHA256: 63e955e27caf079af71e9b7a30723230aa3dbe493994c28af1610be18cea5805
Village SHA256: c3c90b770a34905874eab8a8a71e7828260918e7181cf9f66bb37aad6953b414

Duration: 1800 simulated days (five fixture 360-day years), 20 quarterly Kernel ticks per run; 120 paired runs, 2400 audited steps. This permits repeated dues, founding opportunities and deaths and separates first-year from older exposure. It is a short feasibility study, not the suggested 50-year generational validation; births, migration and aging are absent. Five years was fixed before seeing any verdict; no fixture was calibrated to a yardstick.

D1: PASS initial organisations=0; foundings=8286; untraced founders/consents=0; Cognition intentions=57708. Source creation-boundary check is in test/dsoc1-report.test.ts.
D2: PASS membership errors=0; closed-ledger errors=0; population errors=0; transfers=380505; deaths=2217; births=immigration=emigration=0; money per run=1000720.
D3: PASS hour violations=0; max offered contact hours/person/day=0.75; max rate hours/person/day=0.00375; capacity=2; mandatory service/attendance hours=0; unfunded debits=0.
D3b: PASS social attempts=34352; attempt refusals=9833; causally delivered refusals=9833; unresolved intentions=0; baseline wrong-term payment refusals=14; baseline misleading reports=1003.
D4: PASS N=30; distinct final count/normalised-size-distribution/charter-composition outcomes=14/28/30; yardstick=all three nondegenerate, graded, not tuned.
D5: FAIL overlap run-steps=307; joins=354; exits including death=807; executed dues/benefit amendments=0; intention-traced amendment-induced transfers=0; sign=NA. The engine has no executable amendment action; overlap or ordinary exits do not establish this counterfactual.
D6: FAIL relief foundings baseline/high=1017/646, delta=-371, per village-year=6.78/4.30667 (expected positive); young/older dissolution hazard per org-quarter=0.00413/0.04164 (expected decreasing); duration correlation with inside ties=-0.28196 (expected positive), overlap=-0.17428 (expected negative); occupation match=0.38657 vs null=0.32773, kin match=0.49082 vs null=0.01078 (expected higher). Yardsticks only, not tuned.
D7: FAIL no-network cross-household organisation snapshots=0; relief foundings baseline/no-shocks=1017/1549; delta=-532 (required positive).

## Protocol and evidence limits

The committed village contains 60 households and 250 people, not 300. All 250 have Cognition baseline minds with hunger, safety and social connection. A fixed rotating schedule lets 12 adults deliberate per quarter; pending founders also hear requests for consent. Children have minds but do not take social decisions. Four draft-topic slots and eight organisation-topic slots have ignorant priors declared at initialization; newly encountered organisations are bound to free topics on perception. Topics beyond that vocabulary stay unknown. Social connection accumulates between deliberations; the fixture forecasts social rewards but supplies no realised positive-interaction reset tags. Outcome episodes are encoded, while charter-term latent learning is absent in this study (the separate three-person regression does exercise it). Network opportunities carry testimony but do not reinforce tie strength here. These omissions, sparse cadence and finite vocabulary limit ecological interpretation. Households are fixture relations and shared purses, not pre-created OrganisationStore actors.

Found offers are the Cartesian product of dues 1/3 and sick-relief 0/6, composed with open admission, a meeting and an explicit majority rule. Cognition chooses among whole compositions, including the no-relief choice; this is a fixture proposal vocabulary, not generative charter writing. No reference charter name or institutional kind drives behavior. Founding and consent are separate intentions. Recruitment testimony travels only over actual contact opportunities; no-network removes every exposure. Numeric terms reach minds through perception, not an offer-term lookup. Every attempted organisation action uses the host's Society attempt boundary; automatic unpaid dues are excluded from D3b's attempted refusals. Wrong reports are fixture speech and are not a historical error-rate claim.

All shocks, sensory values, forecasts, budgets and clocks are explicitly labelled fixture with reasons in fixtures.ts. Life hazard draws use per-person Kernel streams and remain paired across treatments. No-shocks disables illness, death and harvest losses together; it does not identify illness alone. High-illness changes only the illness probability. Household income, consumption, illness expense, dues and benefits are transfers to/from a closed stub ledger, including its external-sector account. Estates stay on that ledger after death. The membership observer independently reconstructs each roster from events after every tick; source intentions are matched back to Cognition emissions. Offered hours are grouped by actual contact timestamp/day, not delivery tick. Charters impose dues but no mandatory time obligations; compulsory-service enforcement is therefore not demonstrated.

Young is age <= one fixture year. Young/older dissolution counts=32/623; exposure org-quarters=7739/14961. Coarse within-quarter risk exposure is descriptive, not a survival model. Completed membership spells=807, right-censored=1518; correlations use completed spells and ties/overlap at entry. Censoring and entry-time covariates can bias those correlations; NA means no usable variation. Homophily uses all observed within-organisation pair snapshots (2561) against exact enumeration of all initial adult village pairs, equivalent to uniform draws from the eligible recruitment cohort. Deaths change that cohort later; the comparison does not correct for this or for network exposure. Occupation is an explicitly synthetic work-post-index proxy with 3 classes; missing occupations never match. Kin uses fixture genealogy. This is not independent-data validation.

Yardsticks are those specified in DESIGN §3: van Leeuwen (2016), mutual insurance demand; Freeman, Carroll & Hannan (1983), liability of newness; Popielarz & McPherson (1995), ties/niche overlap and duration; McPherson et al. (2001), homophily. No empirical numerical estimates are asserted here. Splits observed=0; the host does not transport split decisions or executable amendments. Zero is a missing demonstration, not evidence against those phenomena. D5 remains untested, regardless of the other gates.

Reproduce: npm run bench:dsoc1. The bench writes REPORT.md and results.json; the test reads their verdicts and integrity, not the full study. results.json retains per-run counts, entry/exit spells and founding events with named consent. A bench wrapper calls the unchanged Cognition reducer on the addressed mind and preserves global counters/streams; stock-runner equivalence is tested. Completed cognitive diagnostics are compacted after causal accounting; beliefs, needs, episodes, unresolved intentions and random state are retained. No tuning or seed selection occurs in the runner.

## Per-seed results

| Seed | Condition | Foundings | Relief | Dissolutions | Final count | Final sizes | Deaths | Wrong-term refusals |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | baseline | 75 | 39 | 23 | 52 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 20 | 0 |
| 1 | high-illness | 29 | 16 | 11 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 1 | no-network | 75 | 37 | 30 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 1 | no-shocks | 115 | 57 | 30 | 85 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3,3 | 0 | 3 |
| 2 | baseline | 59 | 29 | 20 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 26 | 0 |
| 2 | high-illness | 34 | 18 | 10 | 24 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 2 | no-network | 64 | 32 | 22 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 2 | no-shocks | 95 | 47 | 14 | 81 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,5 | 0 | 2 |
| 3 | baseline | 69 | 32 | 28 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3,3 | 30 | 1 |
| 3 | high-illness | 47 | 22 | 24 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 30 | 2 |
| 3 | no-network | 77 | 33 | 33 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 3 | no-shocks | 100 | 44 | 14 | 86 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,5 | 0 | 1 |
| 4 | baseline | 66 | 28 | 23 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 29 | 1 |
| 4 | high-illness | 41 | 17 | 14 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 29 | 0 |
| 4 | no-network | 73 | 32 | 27 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 29 | 0 |
| 4 | no-shocks | 98 | 49 | 15 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4 | 0 | 1 |
| 5 | baseline | 67 | 35 | 21 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2 | 26 | 0 |
| 5 | high-illness | 34 | 16 | 11 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 26 | 0 |
| 5 | no-network | 68 | 37 | 21 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 5 | no-shocks | 111 | 61 | 24 | 87 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3 | 0 | 0 |
| 6 | baseline | 62 | 27 | 21 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 30 | 1 |
| 6 | high-illness | 37 | 19 | 15 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,3 | 30 | 0 |
| 6 | no-network | 65 | 30 | 21 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 6 | no-shocks | 96 | 45 | 16 | 80 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,4,4 | 0 | 2 |
| 7 | baseline | 66 | 47 | 20 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 23 | 0 |
| 7 | high-illness | 44 | 32 | 19 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 23 | 0 |
| 7 | no-network | 67 | 46 | 28 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 23 | 0 |
| 7 | no-shocks | 99 | 62 | 11 | 88 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3 | 0 | 2 |
| 8 | baseline | 66 | 40 | 23 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 8 | high-illness | 41 | 25 | 16 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 8 | no-network | 68 | 41 | 25 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 8 | no-shocks | 97 | 59 | 13 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,5 | 0 | 0 |
| 9 | baseline | 66 | 41 | 22 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 18 | 2 |
| 9 | high-illness | 39 | 22 | 14 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 18 | 0 |
| 9 | no-network | 67 | 37 | 21 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 1 |
| 9 | no-shocks | 96 | 54 | 13 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,4,4,5 | 0 | 3 |
| 10 | baseline | 69 | 36 | 19 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 28 | 0 |
| 10 | high-illness | 49 | 29 | 15 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 28 | 0 |
| 10 | no-network | 73 | 37 | 21 | 52 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 0 |
| 10 | no-shocks | 103 | 55 | 15 | 88 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,4,4,4 | 0 | 0 |
| 11 | baseline | 68 | 32 | 18 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,4 | 21 | 0 |
| 11 | high-illness | 48 | 23 | 12 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 11 | no-network | 74 | 37 | 22 | 52 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 11 | no-shocks | 91 | 46 | 13 | 78 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,5 | 0 | 2 |
| 12 | baseline | 69 | 38 | 23 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 31 | 0 |
| 12 | high-illness | 40 | 21 | 17 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 31 | 0 |
| 12 | no-network | 71 | 41 | 31 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 31 | 1 |
| 12 | no-shocks | 110 | 63 | 19 | 91 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,5 | 0 | 2 |
| 13 | baseline | 59 | 26 | 12 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3 | 28 | 0 |
| 13 | high-illness | 35 | 17 | 10 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 28 | 0 |
| 13 | no-network | 64 | 28 | 18 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 0 |
| 13 | no-shocks | 104 | 46 | 13 | 91 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,5 | 0 | 1 |
| 14 | baseline | 66 | 33 | 18 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3 | 21 | 0 |
| 14 | high-illness | 42 | 24 | 13 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 21 | 0 |
| 14 | no-network | 71 | 33 | 21 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 14 | no-shocks | 99 | 48 | 17 | 82 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,5 | 0 | 1 |
| 15 | baseline | 75 | 34 | 25 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 32 | 0 |
| 15 | high-illness | 43 | 16 | 22 | 21 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 32 | 1 |
| 15 | no-network | 75 | 33 | 28 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 32 | 0 |
| 15 | no-shocks | 97 | 46 | 20 | 77 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 0 | 0 |
| 16 | baseline | 66 | 36 | 24 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,4 | 21 | 0 |
| 16 | high-illness | 41 | 24 | 12 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 21 | 1 |
| 16 | no-network | 68 | 36 | 25 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 16 | no-shocks | 103 | 58 | 17 | 86 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 0 |
| 17 | baseline | 59 | 29 | 24 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 34 | 0 |
| 17 | high-illness | 32 | 18 | 14 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 34 | 0 |
| 17 | no-network | 63 | 33 | 28 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 17 | no-shocks | 94 | 49 | 16 | 78 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 0 |
| 18 | baseline | 59 | 31 | 17 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 34 | 1 |
| 18 | high-illness | 35 | 18 | 9 | 26 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 34 | 1 |
| 18 | no-network | 61 | 31 | 16 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 18 | no-shocks | 100 | 54 | 9 | 91 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 1 |
| 19 | baseline | 62 | 31 | 19 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,4 | 27 | 1 |
| 19 | high-illness | 31 | 14 | 8 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,4 | 27 | 1 |
| 19 | no-network | 66 | 32 | 25 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 27 | 1 |
| 19 | no-shocks | 97 | 48 | 17 | 80 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,7 | 0 | 0 |
| 20 | baseline | 65 | 32 | 19 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 25 | 0 |
| 20 | high-illness | 42 | 21 | 10 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 25 | 0 |
| 20 | no-network | 69 | 36 | 25 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 20 | no-shocks | 93 | 43 | 12 | 81 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 0 | 2 |
| 21 | baseline | 70 | 40 | 27 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3 | 22 | 1 |
| 21 | high-illness | 40 | 27 | 18 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 22 | 0 |
| 21 | no-network | 73 | 39 | 26 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 21 | no-shocks | 102 | 54 | 17 | 85 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,5 | 0 | 2 |
| 22 | baseline | 70 | 32 | 25 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 22 | 0 |
| 22 | high-illness | 53 | 22 | 19 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 22 | 0 |
| 22 | no-network | 75 | 35 | 27 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 22 | no-shocks | 106 | 50 | 16 | 90 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4 | 0 | 0 |
| 23 | baseline | 68 | 38 | 25 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,3,3 | 25 | 3 |
| 23 | high-illness | 50 | 29 | 15 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 25 | 1 |
| 23 | no-network | 73 | 40 | 28 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 1 |
| 23 | no-shocks | 107 | 63 | 14 | 93 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4 | 0 | 4 |
| 24 | baseline | 72 | 34 | 25 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 25 | 0 |
| 24 | high-illness | 46 | 23 | 18 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 25 | 0 |
| 24 | no-network | 75 | 33 | 30 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 24 | no-shocks | 110 | 48 | 16 | 94 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,5 | 0 | 1 |
| 25 | baseline | 60 | 31 | 24 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 20 | 0 |
| 25 | high-illness | 41 | 20 | 23 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 20 | 0 |
| 25 | no-network | 64 | 31 | 28 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 25 | no-shocks | 100 | 51 | 17 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3 | 0 | 2 |
| 26 | baseline | 60 | 36 | 20 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,3 | 22 | 3 |
| 26 | high-illness | 46 | 27 | 16 | 30 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3 | 22 | 1 |
| 26 | no-network | 67 | 39 | 30 | 37 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 26 | no-shocks | 102 | 57 | 18 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 5 |
| 27 | baseline | 71 | 34 | 26 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 15 | 0 |
| 27 | high-illness | 48 | 23 | 18 | 30 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 15 | 0 |
| 27 | no-network | 73 | 35 | 27 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 15 | 0 |
| 27 | no-shocks | 99 | 46 | 18 | 81 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 0 | 1 |
| 28 | baseline | 58 | 26 | 23 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 18 | 0 |
| 28 | high-illness | 41 | 20 | 20 | 21 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 18 | 0 |
| 28 | no-network | 64 | 31 | 24 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 0 |
| 28 | no-shocks | 91 | 42 | 17 | 74 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4 | 0 | 0 |
| 29 | baseline | 67 | 35 | 20 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,4 | 24 | 0 |
| 29 | high-illness | 45 | 23 | 18 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 24 | 0 |
| 29 | no-network | 69 | 36 | 23 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 24 | 0 |
| 29 | no-shocks | 102 | 51 | 18 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4,5 | 0 | 2 |
| 30 | baseline | 62 | 35 | 21 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 21 | 0 |
| 30 | high-illness | 32 | 20 | 12 | 20 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 21 | 0 |
| 30 | no-network | 62 | 33 | 29 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 30 | no-shocks | 98 | 53 | 16 | 82 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4,4,4,5 | 0 | 1 |
