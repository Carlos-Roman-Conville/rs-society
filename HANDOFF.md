# HANDOFF: society

## State
- 5162: executable `propose` / `action: "amend"` for existing numeric obligation/benefit parameters, decided only by the charter's amendment procedure; validated before execution, numeric offers and observable change/tally evidence. Later dues/claims read the amended charter. Regression coverage in `test/amendment.test.ts`.
- 2836-2839: Approved DESIGN; package scaffold/smoke/fences; shared records, Kernel ids, composable validation; network/clocks/exposure/decay/observer measures; 24 sourced historical compositions and vocabulary gaps.
- 2840-2844: Reference verification; authority/obligations/atomic resource-view ports; collective choice/tie-breaks/pairwise cycle witnesses; intention-led founding/lifecycle, observer-only institution label; CHECK.md independent invariants (unit lists unchecked).
- 2913: Null diagnostics, typed institution evidence, declared-parameter DUP-58 (3) check.
- 5053: 5 DESIGN 1.14 rulings implemented/tested in `test/rulings.test.ts`.
- 5054: 27 references: `source_silent`; per-row `validateReference` and fixture-filled `validateCharter` in `test/charter-reference.test.ts` (166 tests, no todos).
- Keeper approved annotated null-type references (DESIGN 1.14.1, 5c470ea).
- 5055: `src/affordance.ts`, kernel row `society.affordance.offer`; households and migration are typed empty extension points.
- 5056: `bench/d-soc-1/` host with fixture beliefs; `@rex/cognition` devDependency `file:../cognition`; D3b exercised via refusal at `pay`.
- 5057: 120 runs (30 seeds x four conditions), 250 minds, 5 fixture years; household ledger, Cognition-chosen drafts, saved evidence. D1-D4/D3b PASS; D5-D7 FAIL. Prior: 17 tests/3 gate files + tsc passed. Limits: `bench/d-soc-1/REPORT.md`.
- 2982-2984/2992: Fixture village reference/generator (deterministic), CHECK-3; male/female spouses retain sex totals; regenerated default retains age structure.
- 2995-2997: 27 charters; 24 OCR-rechecked via WebFetch windows (not character-by-character); 3 independent societies: Great Hucklow 1787, Tideswell 1764, Glass-Makers Newcastle 1755.

## Next
- Research: source/vocabulary gaps, executable inputs without invented history.
- D-SOC-1 follow-ups: keeper rulings on D5 execution/transport and D6/D7 model/fixture design (Blocked), then independent-data validation. REPORT.md records Acceptance: FAIL on D5, D6, D7.
- 5065: pending kernel pin to v0.1.1; waits on kernel unit 5153.

## Blocked
- D5: engine amendment execution is available (5162); bench host transport and rerun remain for 5163. Proposal payload: `{ action: "amend", section: "obligations" | "benefits", component: index, parameter: "amount" | "quantity" | "hours" | "repayment_period", value: number | null }`. Missing values refuse; offers supply the current numeric `terms.value`, leaving the proposed value to the member. Structural component/schedule replacement is outside this proposal shape. As with existing payments, unpaid dues use the charter amount at payment time.
- split/secession not transported by the bench host.
- D6/D7 inverted signs (relief foundings above baseline): fixture permits solitary founding and shock costs drain the founding purse; model/fixture design question for the keeper, not tuning.
- bench/d-soc-1/results.json is 21.5 MB and committed (the report test hashes it): keeper rules whether it stays in git.
- `@rex/cognition` live-link hazard (I-1048) until Cognition tags a release.

## Gotchas
- `scripts/build-village.d.mts` types the generator; `test/fixture-village.test.ts` imports `.mjs`, resolving these declarations.
- Compiler-API test: 60_000 timeout/cached program. Fence bans grievance/unrest/rebellion/legitimacy/source_credibility/mind.belief anywhere in src (comments too); src imports: @rex/kernel/relative only. Units add processes/reads/writes to kernel.json.
- Components: type discriminant, kind/name ignored; arrays: events/ports/procedures. Transfers/goods: settlement.ledger/economy.inventory; occupation declares fact port, kin uses Society relations. Missing numbers are null/invalid; no defaults.
- validateCharter takes typed drafts, requires admission; others optional. Filling/amendment share decision union; terms may be indefinite. Money terms are never Society balances/holdings.
- API notes (5053): `founding.minimum` -> `min_members`, no alias/default; council majority `base` is nested, scope first. `validateReference` accepts section-tagged or charter-shaped rows; nulls need `source_silent: true` and ancestor/component `note`/`notes`; unknown types still error. Classifier exported from barrel. Rate/hour limiters passed 30-day verification unchanged. Multi-kind decay uses maximum active half-life; kindless residual ties retain last half-life until pruning.
