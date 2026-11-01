# D-SOC-1: a parish forms its fraternities

Acceptance: FAIL. Integrity of a recorded FAIL is not acceptance of P6.

Source SHA256: 70eaa0718606a145ec8b3bc4d4e950f26152fc939e760bb99f5071bff379f9a4
Study inputs SHA256: 2ec2b9092545bd9a77e26ea0aa7fe8b98c0675e5b7d74a6a4142b6f5f602606f
Cognition src SHA256: b73a4f2e3fc97779435f8d34fa7cba926d76d5e08cd1396f1168693a0b335f17
Seed count: 30
Seeds: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
Results SHA256: d36a7082a2f7e366c87d065f1e8812eb4158fdeeff036d62cb4915976ecfc5e6
Village SHA256: c3c90b770a34905874eab8a8a71e7828260918e7181cf9f66bb37aad6953b414

Duration: 1800 simulated days (five fixture 360-day years), 20 quarterly Kernel ticks per run; 120 paired runs, 2400 audited steps. This permits repeated dues, founding opportunities and deaths and separates first-year from older exposure. It is a short feasibility study, not the suggested 50-year generational validation; births, migration and aging are absent. Five years was fixed before seeing any verdict; no fixture was calibrated to a yardstick.

D1: PASS initial organisations=0; foundings=8126; untraced founders/consents=0; Cognition intentions=57039. Source creation-boundary check is in test/dsoc1-report.test.ts.
D2: PASS membership errors=0; closed-ledger errors=0; population errors=0; transfers=381013; deaths=2217; births=immigration=emigration=0; money per run=1000720.
D3: PASS hour violations=0; max offered contact hours/person/day=0.75; max rate hours/person/day=0.00375; capacity=2; mandatory service/attendance hours=0; unfunded debits=0.
D3b: PASS social attempts=34762; attempt refusals=12424; causally delivered refusals=12424; unresolved intentions=0; baseline wrong-term payment refusals=12; baseline misleading reports=1006.
D4: PASS N=30; distinct final count/normalised-size-distribution/charter-composition outcomes=16/29/30; yardstick=all three nondegenerate, graded, not tuned.
D5: FAIL overlap run-steps=294; joins=353; exits including death=614; amendment proposals=736; expressed ballots=3; executed dues/benefit amendments=0; intention-traced amendment-induced transfers=0; sign=NA. Amendment transport is executable; these runs do not establish an amendment-induced membership transfer or its counterfactual.
D6: FAIL relief foundings baseline/high=1008/643, delta=-365, per village-year=6.72/4.28667 (expected positive); young/older dissolution hazard per org-quarter=0.00417/0.02949 (expected decreasing); duration correlation with inside ties=-0.26652 (expected positive), overlap=-0.179 (expected negative); occupation match=0.38959 vs null=0.32773, kin match=0.47524 vs null=0.01078 (expected higher). Yardsticks only, not tuned.
D7: FAIL no-network cross-household organisation snapshots=0; relief foundings baseline/no-shocks=1008/1463; delta=-455 (required positive).

## Protocol and evidence limits

The committed village contains 60 households and 250 people, not 300. All 250 have Cognition baseline minds with hunger, safety and social connection. A fixed rotating schedule lets 12 adults deliberate per quarter; pending founders also hear requests for consent. Children have minds but do not take social decisions. Four draft-topic slots and eight organisation-topic slots have ignorant priors declared at initialization; newly encountered organisations are bound to free topics on perception. Topics beyond that vocabulary stay unknown. Social connection accumulates between deliberations; the fixture forecasts social rewards but supplies no realised positive-interaction reset tags. Outcome episodes are encoded, while charter-term latent learning is absent in this study (the separate three-person regression does exercise it). Network opportunities carry testimony but do not reinforce tie strength here. These omissions, sparse cadence and finite vocabulary limit ecological interpretation. Households are fixture relations and shared purses, not pre-created OrganisationStore actors.

Found offers are the Cartesian product of dues 1/3 and sick-relief 0/6, composed with open admission, a meeting and an explicit majority rule. Cognition chooses among whole compositions, including the no-relief choice; this is a fixture proposal vocabulary, not generative charter writing. Each draft now explicitly uses that same majority rule for amendments. Members may propose existing positive fixture amounts (dues 1/3, benefits 1/3/6), excluding the current amount; removing a benefit component is outside the amendment API. Ballots close at the end of the host tick, without additional decisions or synthetic attendance. The existing neutral proposal/ballot forecast has no term-sensitive reward. No reference charter name or institutional kind drives behavior. Founding and consent are separate intentions. Recruitment testimony travels only over actual contact opportunities; no-network removes every exposure. Numeric terms reach minds through perception, not an offer-term lookup. Every attempted organisation action uses the host's Society attempt boundary; automatic unpaid dues are excluded from D3b's attempted refusals. Wrong reports are fixture speech and are not a historical error-rate claim.

All shocks, sensory values, forecasts, budgets and clocks are explicitly labelled fixture with reasons in fixtures.ts. Life hazard draws use per-person Kernel streams and remain paired across treatments. No-shocks disables illness, death and harvest losses together; it does not identify illness alone. High-illness changes only the illness probability. Household income, consumption, illness expense, dues and benefits are transfers to/from a closed stub ledger, including its external-sector account. Estates stay on that ledger after death. The membership observer independently reconstructs each roster from events after every tick; source intentions are matched back to Cognition emissions. Offered hours are grouped by actual contact timestamp/day, not delivery tick. Charters impose dues but no mandatory time obligations; compulsory-service enforcement is therefore not demonstrated.

Young is age <= one fixture year. Young/older dissolution counts=32/460; exposure org-quarters=7677/15600. Coarse within-quarter risk exposure is descriptive, not a survival model. Completed membership spells=614, right-censored=1693; correlations use completed spells and ties/overlap at entry. Censoring and entry-time covariates can bias those correlations; NA means no usable variation. Homophily uses all observed within-organisation pair snapshots (2767) against exact enumeration of all initial adult village pairs, equivalent to uniform draws from the eligible recruitment cohort. Deaths change that cohort later; the comparison does not correct for this or for network exposure. Occupation is an explicitly synthetic work-post-index proxy with 3 classes; missing occupations never match. Kin uses fixture genealogy. This is not independent-data validation.

Yardsticks are those specified in DESIGN §3: van Leeuwen (2016), mutual insurance demand; Freeman, Carroll & Hannan (1983), liability of newness; Popielarz & McPherson (1995), ties/niche overlap and duration; McPherson et al. (2001), homophily. No empirical numerical estimates are asserted here. Splits observed=0; the host does not transport split decisions. Amendment proposals and ballots are transported through the charter amendment component; attendance and the ordinary decision cadence are unchanged. Zero is a missing demonstration, not evidence against those phenomena. D5 remains undemonstrated, regardless of the other gates.

Reproduce: npm run bench:dsoc1. The bench writes REPORT.md and results.json; the test reads their verdicts and integrity, not the full study. results.json retains per-run counts, entry/exit spells, founding events with named consent, decision evidence, per-step shocks/purses, ledger aggregates, amendment events, exits and dissolutions. See DIAGNOSIS.md for the failed directions. A bench wrapper calls the unchanged Cognition reducer on the addressed mind and preserves global counters/streams; stock-runner equivalence is tested. Completed cognitive diagnostics are compacted after causal accounting; beliefs, needs, episodes, unresolved intentions and random state are retained. No tuning or seed selection occurs in the runner.

## Per-seed results

| Seed | Condition | Foundings | Relief | Dissolutions | Final count | Final sizes | Deaths | Wrong-term refusals |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | baseline | 73 | 39 | 20 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 20 | 0 |
| 1 | high-illness | 29 | 16 | 8 | 21 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 20 | 0 |
| 1 | no-network | 72 | 36 | 22 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 1 | no-shocks | 109 | 54 | 15 | 94 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3 | 0 | 0 |
| 2 | baseline | 59 | 28 | 17 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 26 | 0 |
| 2 | high-illness | 34 | 17 | 7 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 2 | no-network | 64 | 31 | 16 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 2 | no-shocks | 96 | 48 | 12 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 3 |
| 3 | baseline | 67 | 32 | 19 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3,3 | 30 | 0 |
| 3 | high-illness | 46 | 22 | 17 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 30 | 1 |
| 3 | no-network | 74 | 33 | 26 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 3 | no-shocks | 100 | 44 | 9 | 91 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,5 | 0 | 1 |
| 4 | baseline | 63 | 27 | 18 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2 | 29 | 0 |
| 4 | high-illness | 40 | 17 | 13 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 29 | 0 |
| 4 | no-network | 72 | 32 | 24 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 29 | 0 |
| 4 | no-shocks | 93 | 43 | 10 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 0 | 1 |
| 5 | baseline | 65 | 33 | 15 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2 | 26 | 0 |
| 5 | high-illness | 35 | 17 | 6 | 29 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 26 | 0 |
| 5 | no-network | 69 | 38 | 13 | 56 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 26 | 0 |
| 5 | no-shocks | 110 | 57 | 15 | 95 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3 | 0 | 1 |
| 6 | baseline | 62 | 28 | 18 | 44 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2 | 30 | 1 |
| 6 | high-illness | 37 | 19 | 14 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,3 | 30 | 0 |
| 6 | no-network | 64 | 29 | 19 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 30 | 0 |
| 6 | no-shocks | 89 | 43 | 12 | 77 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 1 |
| 7 | baseline | 65 | 48 | 17 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3 | 23 | 0 |
| 7 | high-illness | 43 | 32 | 15 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 23 | 0 |
| 7 | no-network | 66 | 47 | 18 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 23 | 0 |
| 7 | no-shocks | 95 | 61 | 13 | 82 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 1 |
| 8 | baseline | 67 | 39 | 13 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 21 | 0 |
| 8 | high-illness | 42 | 26 | 10 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 21 | 0 |
| 8 | no-network | 69 | 40 | 14 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 8 | no-shocks | 93 | 55 | 10 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,6 | 0 | 1 |
| 9 | baseline | 64 | 38 | 14 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3 | 18 | 2 |
| 9 | high-illness | 40 | 23 | 10 | 30 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 18 | 0 |
| 9 | no-network | 65 | 37 | 17 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 1 |
| 9 | no-shocks | 91 | 51 | 11 | 80 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,6 | 0 | 1 |
| 10 | baseline | 67 | 35 | 15 | 52 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2 | 28 | 0 |
| 10 | high-illness | 48 | 29 | 10 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 28 | 0 |
| 10 | no-network | 69 | 35 | 16 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 0 |
| 10 | no-shocks | 95 | 53 | 12 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4,4 | 0 | 3 |
| 11 | baseline | 66 | 31 | 10 | 56 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,4 | 21 | 0 |
| 11 | high-illness | 48 | 23 | 8 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 21 | 0 |
| 11 | no-network | 74 | 37 | 15 | 59 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 0 |
| 11 | no-shocks | 90 | 44 | 9 | 81 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,4,6 | 0 | 1 |
| 12 | baseline | 68 | 37 | 23 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 31 | 1 |
| 12 | high-illness | 40 | 21 | 18 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 31 | 0 |
| 12 | no-network | 70 | 40 | 31 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 31 | 0 |
| 12 | no-shocks | 105 | 56 | 10 | 95 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,5 | 0 | 2 |
| 13 | baseline | 59 | 27 | 12 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3,3 | 28 | 0 |
| 13 | high-illness | 35 | 17 | 10 | 25 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 28 | 0 |
| 13 | no-network | 62 | 26 | 17 | 45 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 28 | 0 |
| 13 | no-shocks | 101 | 44 | 10 | 91 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3 | 0 | 0 |
| 14 | baseline | 67 | 33 | 13 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3 | 21 | 0 |
| 14 | high-illness | 42 | 23 | 10 | 32 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 21 | 0 |
| 14 | no-network | 72 | 34 | 18 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 1 |
| 14 | no-shocks | 97 | 46 | 14 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,5 | 0 | 1 |
| 15 | baseline | 75 | 34 | 19 | 56 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 32 | 1 |
| 15 | high-illness | 43 | 16 | 15 | 28 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 32 | 1 |
| 15 | no-network | 75 | 33 | 23 | 52 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 32 | 0 |
| 15 | no-shocks | 96 | 44 | 17 | 79 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3 | 0 | 0 |
| 16 | baseline | 66 | 36 | 17 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,4 | 21 | 2 |
| 16 | high-illness | 41 | 24 | 10 | 31 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2 | 21 | 2 |
| 16 | no-network | 68 | 36 | 20 | 48 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 1 |
| 16 | no-shocks | 100 | 56 | 14 | 86 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,4 | 0 | 0 |
| 17 | baseline | 59 | 30 | 17 | 42 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2 | 34 | 0 |
| 17 | high-illness | 32 | 18 | 12 | 20 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2 | 34 | 1 |
| 17 | no-network | 63 | 33 | 20 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 17 | no-shocks | 92 | 49 | 14 | 78 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,4,5 | 0 | 3 |
| 18 | baseline | 59 | 31 | 12 | 47 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2 | 34 | 0 |
| 18 | high-illness | 35 | 18 | 9 | 26 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 34 | 0 |
| 18 | no-network | 61 | 31 | 10 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 34 | 0 |
| 18 | no-shocks | 98 | 55 | 10 | 88 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3 | 0 | 0 |
| 19 | baseline | 63 | 31 | 13 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,4 | 27 | 0 |
| 19 | high-illness | 31 | 14 | 5 | 26 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,4 | 27 | 0 |
| 19 | no-network | 67 | 32 | 17 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 27 | 0 |
| 19 | no-shocks | 94 | 46 | 5 | 89 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,6 | 0 | 1 |
| 20 | baseline | 63 | 32 | 13 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3 | 25 | 0 |
| 20 | high-illness | 42 | 21 | 7 | 35 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 25 | 1 |
| 20 | no-network | 69 | 35 | 19 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 20 | no-shocks | 92 | 42 | 8 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3 | 0 | 2 |
| 21 | baseline | 68 | 39 | 22 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3 | 22 | 1 |
| 21 | high-illness | 40 | 27 | 13 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 22 | 0 |
| 21 | no-network | 72 | 38 | 23 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 21 | no-shocks | 93 | 46 | 13 | 80 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4 | 0 | 2 |
| 22 | baseline | 70 | 32 | 15 | 55 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2 | 22 | 0 |
| 22 | high-illness | 53 | 22 | 13 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 22 | 0 |
| 22 | no-network | 73 | 33 | 22 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 22 | no-shocks | 96 | 47 | 13 | 83 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4 | 0 | 2 |
| 23 | baseline | 68 | 37 | 17 | 51 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3,3,3 | 25 | 1 |
| 23 | high-illness | 49 | 29 | 11 | 38 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2 | 25 | 0 |
| 23 | no-network | 72 | 40 | 18 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 23 | no-shocks | 106 | 58 | 10 | 96 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4 | 0 | 1 |
| 24 | baseline | 72 | 33 | 19 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 25 | 0 |
| 24 | high-illness | 44 | 21 | 11 | 33 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 25 | 0 |
| 24 | no-network | 75 | 33 | 25 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 25 | 0 |
| 24 | no-shocks | 101 | 43 | 9 | 92 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4 | 0 | 1 |
| 25 | baseline | 61 | 31 | 22 | 39 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2 | 20 | 0 |
| 25 | high-illness | 41 | 20 | 14 | 27 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 20 | 0 |
| 25 | no-network | 64 | 32 | 21 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 20 | 0 |
| 25 | no-shocks | 93 | 46 | 9 | 84 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3 | 0 | 2 |
| 26 | baseline | 60 | 36 | 11 | 49 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,3,3 | 22 | 3 |
| 26 | high-illness | 45 | 27 | 11 | 34 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,3 | 22 | 1 |
| 26 | no-network | 66 | 38 | 20 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 22 | 0 |
| 26 | no-shocks | 96 | 55 | 14 | 82 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,4 | 0 | 3 |
| 27 | baseline | 70 | 34 | 20 | 50 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,3 | 15 | 0 |
| 27 | high-illness | 48 | 23 | 12 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 15 | 0 |
| 27 | no-network | 73 | 35 | 19 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 15 | 0 |
| 27 | no-shocks | 96 | 44 | 14 | 82 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3 | 0 | 0 |
| 28 | baseline | 57 | 25 | 20 | 37 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,3 | 18 | 0 |
| 28 | high-illness | 39 | 18 | 17 | 22 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2 | 18 | 0 |
| 28 | no-network | 64 | 31 | 21 | 43 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 18 | 0 |
| 28 | no-shocks | 87 | 39 | 15 | 72 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4 | 0 | 2 |
| 29 | baseline | 68 | 36 | 14 | 54 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,4 | 24 | 0 |
| 29 | high-illness | 45 | 23 | 9 | 36 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,4 | 24 | 0 |
| 29 | no-network | 70 | 36 | 17 | 53 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 24 | 0 |
| 29 | no-shocks | 99 | 47 | 12 | 87 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,5 | 0 | 1 |
| 30 | baseline | 63 | 36 | 17 | 46 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3 | 21 | 0 |
| 30 | high-illness | 32 | 20 | 9 | 23 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3 | 21 | 0 |
| 30 | no-network | 63 | 34 | 23 | 40 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 | 21 | 1 |
| 30 | no-shocks | 93 | 47 | 15 | 78 | 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,5 | 0 | 1 |
