# HANDOFF: society

## State

- 2836: Package scaffold, smoke/fence tests; DESIGN approved.
- 2837: Shared records, Kernel ids and composable charter validation.
- 2838: Communication network, clocks, exposure, decay and observer measures.
- 2839: 24 sourced historical charter compositions and vocabulary gaps.
- 2840: Reference verification; 27 reference rows annotated and covered in `test/charter-reference.test.ts` (5054).
- 2841: Organisation authority, obligations and atomic resource/view ports.
- 2842: Collective choice, explicit tie-breaks and pairwise cycle witnesses.
- 2843: Intention-driven founding/lifecycle and observer-only institution label.
- 2844: Independent invariant check in CHECK.md; unit lists not checked.
- 2913: Null diagnostics, typed institution evidence and declared-parameter DUP-58 (3) check.
- 5053: All five DESIGN §1.14 rulings implemented and covered in `test/rulings.test.ts`.
- 5054: `source_silent` annotations on all 27 reference rows; per-row `validateReference` and fixture-filled
  `validateCharter` coverage in `test/charter-reference.test.ts` (166 tests, no todos).
- 5057: D-SOC-1 fixture study on the 5056 host: `npm run bench:dsoc1`, 30 fixed seeds in four paired
  conditions, all 250 village residents with baseline minds, five fixture years, household ledger accounting,
  component-product drafts chosen by Cognition, and saved per-run evidence. Read `bench/d-soc-1/REPORT.md`
  for acceptance; a passing report-integrity test does not override a FAIL verdict.
  Verification: full 120-run bench completed; the requested gate's three test files passed all 17 tests;
  `npx tsc --noEmit` passed. `src/`, DESIGN and Cognition were not modified.

- 2982–2984: Fixture village reference, deterministic generator and CHECK-3 review.
- 2992: Male/female spouse pairs preserve sex totals; default village regenerated, age structure retained.

- 2995-2997: 27 reference charters; 24 OCR-rechecked through WebFetch windows (`ocr_checked: true` means re-read in windows, not compared character by character); 3 independent friendly societies: Great Hucklow 1787, Tideswell 1764, Glass-Makers Newcastle 1755.

Details, API conventions and verification limits: README.md.

## Next

- Charter research fixes: source/vocabulary gaps and executable inputs without invented history.
- Affordance port with Cognition, requiring the Cognition keeper's agreement.
- D-SOC-1 acceptance blockers below, then independent-data validation.

## Blocked

5057 D-SOC-1 limits and follow-up (no `src/` changes made by this unit):

- Final study: D1/D2/D3/D3b/D4 PASS; D5/D6/D7 FAIL. D7's network knockout has zero cross-household
  organisation snapshots, but removing shocks raises relief-chartered foundings from 1,017 to 1,549
  (required direction is lower). The fixture permits solitary founding and forecasts social rewards even
  without shocks, while illness/harvest costs reduce the purse available for founding consent. This protocol
  therefore does not establish shock-driven mutual-insurance demand. No parameter was changed to reverse it.
- D6 is a graded failure: high illness gives 646 relief foundings versus 1,017 baseline; older dissolution
  hazard is 0.04164 versus 0.00413 per org-quarter for the young; duration/inside-tie correlation is -0.28196.
  Overlap (-0.17428), occupation and kin homophily have the expected signs. These short-run, censored fixture
  measurements do not validate the historical yardsticks. D3b does have 14 baseline wrong-term payment
  refusals; all 9,833 attempted-action refusals across the study reach minds, with no unresolved intentions.
- D5 cannot test an incumbent lowering dues or increasing relief: the schema has amendment procedures,
  but `OrganisationStore.#propose` only executes act/dissolve/elect/sanction. A charter-amendment execution
  path with an expressed proposal, ballots and transactional effects needs a separate source unit. The host
  must then transport those intentions. Ordinary joins/exits are not counted as amendment-induced competition.
- The current host does not transport split/secession decisions; the study does not manufacture disputes,
  ballots, splits or dissolution to make expected phenomena appear. Singleton exits/deaths can dissolve actors.
- The fixture is deliberately limited: four component-product drafts, eight known-organisation topics per
  mind, quarterly rotating adult decisions, no births/migration/aging. It forecasts social rewards without
  passing positive-interaction reset tags, and sends testimony without reinforcing network ties. Outcome
  episodes are encoded; charter-term latent learning remains only in the existing three-person regression.
  These are explicit model/host limitations, not empirical conclusions about fraternities. Extending them is
  separate model work; do not alter their values to make D4-D6 pass.
- Initial wiring checks caught undeclared belief supports and an unbounded Gaussian safety appraisal.
  The study now declares ignorant topic priors at initialization and uses the baseline categorical safety
  appraisal. Hazard, purse, contact and choice parameters were not adjusted to yardsticks. The final 120 runs
  use one fixed protocol. The bench-only sparse runner calls the unchanged Cognition reducer and is checked
  against the stock runner; completed diagnostics are compacted without changing beliefs, needs or episodes.

The older integration notes below describe the state at 5053; the 5056 host and 5057 bench now exist.

5053 API notes: the old `founding.minimum` field is replaced by `min_members`, with no alias/default.
Council majorities carry `base` on their nested majority procedure; council scope is applied first.
`validateReference` accepts section-tagged research rows or charter-shaped references; null annotations use
`source_silent: true` plus `note`/`notes` on the containing object or ancestor within that component.
Null/unknown component types are still errors. The classifier is also exported from the package barrel.
The pre-existing per-day rate and realised-hours limiters passed the new 30-day verification unchanged.
Multi-kind decay now uses active exposures' maximum half-life; a residual tie with no kinds retains its last
half-life until pruning, preserving §1.1 decay without inventing a parameter. Cognition integration remains pending.

## Gotchas
- A test that uses the TypeScript compiler API sets an explicit timeout (60_000) and reuses one cached program.
- The fence test fails on the words `grievance`, `unrest`, `rebellion`, `legitimacy`, `source_credibility` and
  `mind.belief` anywhere in `src/`, comments included.
- `src/` may import only `@rex/kernel` and relative paths.
- Each later unit adds its processes, reads and writes to `kernel.json`.
- Charter components discriminate on `type`; `kind` and `name` are ignored by validation. Capabilities are
  arrays named `events`, `ports`, and `procedures`. Port names for transfers and goods are `settlement.ledger`
  and `economy.inventory`; occupation admission explicitly declares its fact port. Kinship uses Society's own
  relations. Missing numeric parameters are `null` and invalid; there are no default amounts or procedures.
- `validateCharter` accepts typed drafts, not arbitrary JSON. Admission must be nonempty; other mechanisms
  may be omitted. Position filling and amendment use the same decision-procedure union. Position terms may
  explicitly be `indefinite`. Monetary values are rule terms, never balances or holdings in Society state.
