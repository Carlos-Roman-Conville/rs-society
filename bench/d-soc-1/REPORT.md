# D-SOC-1: a parish forms its fraternities

Acceptance: FAIL. Integrity of a recorded FAIL is not acceptance of P6.

Source SHA256: e436ca00aa2cb5ad4f43b4c5905418a410d037f2b1103bf261b792f52fe56d3c
Study inputs SHA256: a235d1aa29e78ce13a97a17655f90e1b66d669c95e91d99a37be1e2979b0cac6
Cognition src SHA256: b73a4f2e3fc97779435f8d34fa7cba926d76d5e08cd1396f1168693a0b335f17
Seed count: 30
Seeds: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
Results SHA256: 80e64db7abaa5823b2f47fb686cc8ccf4f3ec47b4d1241ac79e4837f7d772372
Village SHA256: c3c90b770a34905874eab8a8a71e7828260918e7181cf9f66bb37aad6953b414

Duration: 1800 simulated days (five fixture 360-day years), 20 quarterly Kernel ticks per run; 150 paired runs, 3000 audited steps. This permits repeated dues, founding opportunities and deaths and separates first-year from older exposure. It is a short feasibility study, not the suggested 50-year generational validation; births, migration and aging are absent. Five years was fixed before seeing any verdict; no fixture was calibrated to a yardstick.

D1: PASS initial organisations=0; foundings=5933; untraced founders/consents=0; Cognition intentions=54665. Source creation-boundary check is in test/dsoc1-report.test.ts.
D2: PASS membership errors=0; closed-ledger errors=0; population errors=0; transfers=364861; deaths=2217; births=immigration=emigration=0; money per run=1000720.
D3: PASS hour violations=0; max offered contact hours/person/day=0.75; max rate hours/person/day=0.00375; capacity=2; mandatory service/attendance hours=0; unfunded debits=0.
D3b: PASS social attempts=27049; attempt refusals=9562; causally delivered refusals=9562; unresolved intentions=0; baseline wrong-term payment refusals=10; baseline misleading reports=631.
D4: PASS N=30; distinct final count/normalised-size-distribution/charter-composition outcomes=16/27/30; yardstick=all three nondegenerate, graded, not tuned.
D5: FAIL overlap run-steps=176; joins=252; exits including death=410; amendment proposals=446; expressed ballots=31; executed dues/benefit amendments=0; intention-traced amendment-induced transfers=0; sign=NA. Amendment transport is executable; these runs do not establish an amendment-induced membership transfer or its counterfactual.
D6: FAIL relief foundings baseline/high=720/435, delta=-285, per village-year=4.8/2.9 (expected positive); young/older dissolution hazard per org-quarter=0.00508/0.03033 (expected decreasing); duration correlation with inside ties=-0.22787 (expected positive), overlap=NA (expected negative); occupation match=0.42087 vs null=0.32773, kin match=0.45545 vs null=0.01078 (expected higher). Yardsticks only, not tuned.
D7: FAIL no-network cross-household organisation snapshots=0; relief foundings baseline/no-shocks=720/1075; delta=-355 (required positive).

Diagnostic illness-only (excluded from gate calculations): relief foundings baseline/illness-only=720/969; delta=-249; illnesses=0; deaths baseline/illness-only=739/739; harvest losses unchanged.
Contact outcomes: realised contacts=209296; positive_interaction deliveries=418592; open ballots at horizon=430.

## Protocol and evidence limits

The committed village contains 60 households and 250 people, not 300. All 250 have Cognition baseline minds with hunger, safety and social connection. A fixed rotating schedule lets 12 adults deliberate per quarter; pending founders also hear requests for consent. Children have minds but do not take social decisions. Four draft-topic slots and eight organisation-topic slots have ignorant priors declared at initialization; newly encountered organisations are bound to free topics on perception. Topics beyond that vocabulary stay unknown. Social connection accumulates over elapsed time and each realised network contact resets both minds through Cognition at the original contact time (delivered at the next host tick). Found/join/attend forecast company from perceived other members; leave forecasts the loss of recognised inside contacts. The saturating peer-count forecast is an explicit fixture, not a calibrated contact model. Outcome episodes are encoded, while charter-term latent learning is absent in this study (the separate three-person regression does exercise it). Network opportunities carry testimony but do not reinforce tie strength here. These omissions, sparse cadence and finite vocabulary limit ecological interpretation. Households are fixture relations and shared purses, not pre-created OrganisationStore actors.

Found offers are the Cartesian product of dues 1/3 and sick-relief 0/6, composed with open admission, a meeting and an explicit majority rule. Cognition chooses among whole compositions, including the no-relief choice; this is a fixture proposal vocabulary, not generative charter writing. Each draft now explicitly uses that same majority rule for amendments. Members may propose existing positive fixture amounts (dues 1/3, benefits 1/3/6), excluding the current amount; removing a benefit component is outside the amendment API. Ballots stay open for two quarterly meeting periods, the explicitly labelled charter decision interval. Society closes them at that boundary, without additional decisions or synthetic attendance/votes. Each opening, attendance and ballot attempt receives its own outcome; participants also observe the closing tally. Ballots still open at the fixed horizon are reported as censored, not resolved by the host. The existing neutral proposal/ballot forecast has no term-sensitive reward. No reference charter name or institutional kind drives behavior. Founding and consent are separate intentions. Recruitment testimony travels only over actual contact opportunities; no-network removes every exposure. Numeric terms reach minds through perception, not an offer-term lookup. Every attempted organisation action uses the host's Society attempt boundary; automatic unpaid dues are excluded from D3b's attempted refusals. Wrong reports are fixture speech and are not a historical error-rate claim.

All shocks, sensory values, forecasts, budgets and clocks are explicitly labelled fixture with reasons in fixtures.ts. Life hazard draws use per-person Kernel streams and remain paired across treatments. No-shocks disables illness, death and harvest losses together; it does not identify illness alone. High-illness changes only the illness probability. Household income, consumption, illness expense, dues and benefits are transfers to/from a closed stub ledger, including its external-sector account. Estates stay on that ledger after death. The membership observer independently reconstructs each roster from events after every tick; source intentions are matched back to Cognition emissions. Offered hours are grouped by actual contact timestamp/day, not delivery tick. Charters impose dues but no mandatory time obligations; compulsory-service enforcement is therefore not demonstrated.

Young is age <= one fixture year. Young/older dissolution counts=28/306; exposure org-quarters=5514/10089. Coarse within-quarter risk exposure is descriptive, not a survival model. Completed membership spells=410, right-censored=1267; correlations use completed spells and ties/overlap at entry. Censoring and entry-time covariates can bias those correlations; NA means no usable variation. Homophily uses all observed within-organisation pair snapshots (1706) against exact enumeration of all initial adult village pairs, equivalent to uniform draws from the eligible recruitment cohort. Deaths change that cohort later; the comparison does not correct for this or for network exposure. Occupation is an explicitly synthetic work-post-index proxy with 3 classes; missing occupations never match. Kin uses fixture genealogy. This is not independent-data validation.

Yardsticks are those specified in DESIGN §3: van Leeuwen (2016), mutual insurance demand; Freeman, Carroll & Hannan (1983), liability of newness; Popielarz & McPherson (1995), ties/niche overlap and duration; McPherson et al. (2001), homophily. No empirical numerical estimates are asserted here. Splits observed=0; the host does not transport split decisions. Amendment proposals and ballots are transported through the charter amendment component; attendance and the ordinary decision cadence are unchanged. Zero is a missing demonstration, not evidence against those phenomena. D5 remains undemonstrated, regardless of the other gates.

Reproduce: npm run bench:dsoc1. The bench writes REPORT.md, DIAGNOSIS.md and gitignored results/results.json; the test checks the exact results SHA-256 and reconstructs the evidence only when that file exists. A clean checkout still checks report structure and source freshness. results.json retains per-run counts, entry/exit spells, founding events with named consent, decision evidence, per-step shocks/purses, ledger aggregates, amendment events, exits and dissolutions. See DIAGNOSIS.md for the failed directions. A bench wrapper calls the unchanged Cognition reducer on the addressed mind and preserves global counters/streams; stock-runner equivalence is tested. Completed cognitive diagnostics are compacted after causal accounting; beliefs, needs, episodes, unresolved intentions and random state are retained. No tuning or seed selection occurs in the runner.

## Per-seed results

| Seed | Condition | Foundings | Relief | Dissolutions | Final count | Final sizes | Deaths | Wrong-term refusals |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | baseline | 53 | 27 | 14 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 20 | 1 |
| 1 | high-illness | 22 | 10 | 7 | 15 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 1 | no-network | 60 | 30 | 16 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 1 | no-shocks | 82 | 45 | 11 | 71 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,4 | 0 | 0 |
| 1 | illness-only | 76 | 39 | 18 | 58 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3 | 20 | 1 |
| 2 | baseline | 43 | 25 | 9 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 26 | 1 |
| 2 | high-illness | 22 | 13 | 4 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 26 | 0 |
| 2 | no-network | 43 | 25 | 11 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 1 |
| 2 | no-shocks | 71 | 36 | 9 | 62 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 1 |
| 2 | illness-only | 69 | 36 | 10 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3 | 26 | 0 |
| 3 | baseline | 53 | 24 | 16 | 37 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,3 | 30 | 1 |
| 3 | high-illness | 30 | 15 | 15 | 15 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 3 | no-network | 56 | 26 | 20 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 3 | no-shocks | 79 | 38 | 9 | 70 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 0 | 0 |
| 3 | illness-only | 71 | 34 | 17 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,3,3 | 30 | 1 |
| 4 | baseline | 52 | 27 | 12 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2 | 29 | 0 |
| 4 | high-illness | 29 | 16 | 5 | 24 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 29 | 0 |
| 4 | no-network | 58 | 31 | 16 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 29 | 0 |
| 4 | no-shocks | 79 | 41 | 8 | 71 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 1 |
| 4 | illness-only | 73 | 38 | 10 | 63 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 29 | 0 |
| 5 | baseline | 42 | 14 | 12 | 30 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 26 | 1 |
| 5 | high-illness | 20 | 8 | 5 | 15 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 5 | no-network | 41 | 15 | 12 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 1 |
| 5 | no-shocks | 69 | 29 | 10 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,4 | 0 | 1 |
| 5 | illness-only | 59 | 22 | 13 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3 | 26 | 1 |
| 6 | baseline | 48 | 25 | 14 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 30 | 0 |
| 6 | high-illness | 26 | 15 | 12 | 14 | 1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 30 | 0 |
| 6 | no-network | 51 | 24 | 18 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 6 | no-shocks | 73 | 38 | 10 | 63 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 0 |
| 6 | illness-only | 67 | 34 | 14 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3 | 30 | 0 |
| 7 | baseline | 45 | 23 | 12 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3 | 23 | 0 |
| 7 | high-illness | 26 | 13 | 11 | 15 | 1,1,1,1,1,1,1,1,1,1,1,1,1,2,3 | 23 | 0 |
| 7 | no-network | 50 | 23 | 12 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 23 | 1 |
| 7 | no-shocks | 70 | 32 | 7 | 63 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4 | 0 | 1 |
| 7 | illness-only | 63 | 28 | 13 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 23 | 0 |
| 8 | baseline | 47 | 24 | 10 | 37 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 21 | 0 |
| 8 | high-illness | 26 | 10 | 8 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 8 | no-network | 51 | 26 | 13 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 8 | no-shocks | 74 | 35 | 10 | 64 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,4,4 | 0 | 0 |
| 8 | illness-only | 70 | 32 | 11 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,4 | 21 | 0 |
| 9 | baseline | 47 | 23 | 9 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 18 | 2 |
| 9 | high-illness | 22 | 12 | 5 | 17 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 18 | 0 |
| 9 | no-network | 48 | 21 | 8 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 1 |
| 9 | no-shocks | 61 | 31 | 10 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 2 |
| 9 | illness-only | 60 | 29 | 12 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,4 | 18 | 2 |
| 10 | baseline | 50 | 22 | 11 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 28 | 1 |
| 10 | high-illness | 32 | 12 | 8 | 24 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 28 | 1 |
| 10 | no-network | 57 | 27 | 16 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 1 |
| 10 | no-shocks | 77 | 34 | 15 | 62 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,4,4 | 0 | 0 |
| 10 | illness-only | 65 | 28 | 12 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3 | 28 | 0 |
| 11 | baseline | 51 | 26 | 7 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,4 | 21 | 1 |
| 11 | high-illness | 32 | 18 | 4 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 11 | no-network | 52 | 29 | 10 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 11 | no-shocks | 70 | 35 | 8 | 62 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3 | 0 | 3 |
| 11 | illness-only | 65 | 34 | 10 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3 | 21 | 1 |
| 12 | baseline | 40 | 22 | 14 | 26 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3 | 31 | 0 |
| 12 | high-illness | 28 | 11 | 13 | 15 | 1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 31 | 0 |
| 12 | no-network | 46 | 26 | 17 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 31 | 0 |
| 12 | no-shocks | 64 | 33 | 5 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,4 | 0 | 0 |
| 12 | illness-only | 56 | 32 | 12 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 31 | 0 |
| 13 | baseline | 46 | 20 | 10 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 28 | 0 |
| 13 | high-illness | 27 | 12 | 8 | 19 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 28 | 0 |
| 13 | no-network | 50 | 23 | 10 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 0 |
| 13 | no-shocks | 80 | 37 | 11 | 69 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 0 | 0 |
| 13 | illness-only | 69 | 33 | 14 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3 | 28 | 0 |
| 14 | baseline | 47 | 26 | 12 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 21 | 0 |
| 14 | high-illness | 30 | 20 | 8 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 14 | no-network | 49 | 26 | 12 | 37 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 14 | no-shocks | 69 | 37 | 7 | 62 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3 | 0 | 0 |
| 14 | illness-only | 66 | 35 | 13 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,3 | 21 | 0 |
| 15 | baseline | 49 | 23 | 16 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3 | 32 | 0 |
| 15 | high-illness | 31 | 16 | 12 | 19 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 32 | 0 |
| 15 | no-network | 52 | 24 | 17 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 32 | 0 |
| 15 | no-shocks | 78 | 37 | 11 | 67 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,4,4 | 0 | 1 |
| 15 | illness-only | 68 | 32 | 15 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3 | 32 | 0 |
| 16 | baseline | 49 | 27 | 11 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3 | 21 | 0 |
| 16 | high-illness | 27 | 17 | 6 | 21 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 21 | 0 |
| 16 | no-network | 55 | 27 | 10 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 16 | no-shocks | 72 | 35 | 6 | 66 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 0 |
| 16 | illness-only | 70 | 33 | 10 | 60 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,4 | 21 | 0 |
| 17 | baseline | 44 | 18 | 14 | 30 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 34 | 0 |
| 17 | high-illness | 21 | 10 | 7 | 14 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 17 | no-network | 52 | 23 | 20 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 17 | no-shocks | 68 | 27 | 3 | 65 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4 | 0 | 3 |
| 17 | illness-only | 62 | 24 | 13 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3 | 34 | 2 |
| 18 | baseline | 38 | 16 | 10 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 34 | 0 |
| 18 | high-illness | 22 | 8 | 6 | 16 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 34 | 0 |
| 18 | no-network | 37 | 16 | 12 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 18 | no-shocks | 69 | 32 | 10 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,4 | 0 | 1 |
| 18 | illness-only | 62 | 28 | 13 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3 | 34 | 1 |
| 19 | baseline | 48 | 25 | 8 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 27 | 0 |
| 19 | high-illness | 26 | 13 | 6 | 20 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 27 | 0 |
| 19 | no-network | 48 | 27 | 9 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 27 | 0 |
| 19 | no-shocks | 73 | 44 | 9 | 64 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,4,4 | 0 | 0 |
| 19 | illness-only | 67 | 41 | 9 | 58 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3 | 27 | 0 |
| 20 | baseline | 49 | 22 | 11 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 25 | 0 |
| 20 | high-illness | 28 | 11 | 6 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 20 | no-network | 51 | 23 | 11 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 20 | no-shocks | 72 | 31 | 6 | 66 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 0 | 0 |
| 20 | illness-only | 67 | 26 | 9 | 58 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3 | 25 | 0 |
| 21 | baseline | 57 | 31 | 11 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 22 | 0 |
| 21 | high-illness | 33 | 19 | 6 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 22 | 0 |
| 21 | no-network | 58 | 34 | 11 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 21 | no-shocks | 78 | 39 | 10 | 68 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,6 | 0 | 0 |
| 21 | illness-only | 67 | 35 | 16 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,4 | 22 | 0 |
| 22 | baseline | 54 | 30 | 10 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3,3 | 22 | 1 |
| 22 | high-illness | 37 | 20 | 12 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 22 | 0 |
| 22 | no-network | 58 | 32 | 17 | 41 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 22 | no-shocks | 69 | 36 | 13 | 56 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 0 |
| 22 | illness-only | 67 | 36 | 16 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3,3 | 22 | 0 |
| 23 | baseline | 54 | 31 | 11 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 25 | 0 |
| 23 | high-illness | 39 | 24 | 11 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 25 | 0 |
| 23 | no-network | 58 | 31 | 11 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 23 | no-shocks | 73 | 39 | 10 | 63 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 0 |
| 23 | illness-only | 69 | 38 | 16 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3 | 25 | 0 |
| 24 | baseline | 52 | 24 | 17 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 25 | 0 |
| 24 | high-illness | 29 | 11 | 9 | 20 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 25 | 0 |
| 24 | no-network | 52 | 26 | 18 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 24 | no-shocks | 77 | 36 | 15 | 62 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 0 |
| 24 | illness-only | 68 | 32 | 23 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3 | 25 | 0 |
| 25 | baseline | 43 | 25 | 12 | 31 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 20 | 0 |
| 25 | high-illness | 29 | 18 | 11 | 18 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 20 | 0 |
| 25 | no-network | 48 | 27 | 14 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 25 | no-shocks | 68 | 38 | 11 | 57 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3 | 0 | 1 |
| 25 | illness-only | 61 | 32 | 12 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3 | 20 | 0 |
| 26 | baseline | 42 | 28 | 8 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,4 | 22 | 1 |
| 26 | high-illness | 30 | 20 | 6 | 24 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 22 | 0 |
| 26 | no-network | 46 | 26 | 13 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 26 | no-shocks | 61 | 45 | 6 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4 | 0 | 1 |
| 26 | illness-only | 57 | 39 | 9 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4 | 22 | 1 |
| 27 | baseline | 51 | 28 | 11 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 15 | 0 |
| 27 | high-illness | 37 | 23 | 5 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 15 | 0 |
| 27 | no-network | 55 | 27 | 11 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 15 | 0 |
| 27 | no-shocks | 71 | 41 | 10 | 61 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 0 | 0 |
| 27 | illness-only | 67 | 38 | 12 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3 | 15 | 0 |
| 28 | baseline | 41 | 20 | 9 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,4 | 18 | 0 |
| 28 | high-illness | 25 | 14 | 4 | 21 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,3 | 18 | 0 |
| 28 | no-network | 45 | 18 | 10 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 1 |
| 28 | no-shocks | 63 | 29 | 6 | 57 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,5,6 | 0 | 2 |
| 28 | illness-only | 61 | 28 | 12 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3,3,4 | 18 | 0 |
| 29 | baseline | 47 | 22 | 9 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 24 | 0 |
| 29 | high-illness | 26 | 15 | 7 | 19 | 1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 24 | 0 |
| 29 | no-network | 49 | 25 | 13 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 24 | 0 |
| 29 | no-shocks | 76 | 34 | 13 | 63 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4 | 0 | 0 |
| 29 | illness-only | 69 | 30 | 14 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 24 | 0 |
| 30 | baseline | 43 | 22 | 4 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 21 | 0 |
| 30 | high-illness | 22 | 11 | 3 | 19 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 21 | 0 |
| 30 | no-network | 44 | 20 | 4 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 30 | no-shocks | 68 | 31 | 4 | 64 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,5 | 0 | 1 |
| 30 | illness-only | 56 | 23 | 3 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,3 | 21 | 0 |
