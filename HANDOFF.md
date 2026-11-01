# HANDOFF: society

## State
- 2836-2839: Approved DESIGN; package scaffold/smoke/fences; shared records, Kernel ids, composable validation; network/clocks/exposure/decay/observer measures; 24 sourced historical compositions and vocabulary gaps.
- 2840-2844: Reference verification; authority/obligations/atomic resource-view ports; collective choice/tie-breaks/pairwise cycle witnesses; intention-led founding/lifecycle, observer-only institution label; CHECK.md independent invariants (unit lists unchecked).
- 2913: Null diagnostics, typed institution evidence, declared-parameter DUP-58 (3) check.
- 5053: 5 DESIGN 1.14 rulings implemented/tested in `test/rulings.test.ts`.
- 5054: 27 references: `source_silent`; per-row `validateReference` and fixture-filled `validateCharter` in `test/charter-reference.test.ts` (166 tests, no todos).
- Keeper approved annotated null-type references (DESIGN 1.14.1, 5c470ea). Pending: tagged `@rex/cognition` pin; independent-data validation.
- 5055: `src/affordance.ts`, kernel row `society.affordance.offer`; households and migration are typed empty extension points.
- 5056: `bench/d-soc-1/` host with fixture beliefs; `@rex/cognition` devDependency `file:../cognition`; D3b exercised via refusal at `pay`.
- 5057: 120 runs (30 fixed seeds x four paired conditions), 250 baseline minds, 5 fixture years, household ledger, Cognition-chosen component-product drafts, saved evidence. D1-D4/D3b PASS; D5-D7 FAIL despite integrity checks. Prior: 17 tests/3 gate files + tsc passed; src/DESIGN/Cognition unchanged. Limits: `bench/d-soc-1/REPORT.md`.
- 2982-2984/2992: Fixture village reference/generator (deterministic), CHECK-3; male/female spouses retain sex totals; regenerated default retains age structure.
- 2995-2997: 27 charters; 24 OCR-rechecked via WebFetch windows (not character-by-character); 3 independent societies: Great Hucklow 1787, Tideswell 1764, Glass-Makers Newcastle 1755.
README.md.

## Next
- Research: source/vocabulary gaps, executable inputs without invented history.
- D-SOC-1 bench run and REPORT (5057): acceptance failures, then independent-data validation.

## Blocked
- 5065 kernel-at-tag pin: Node refuses kernel `.ts` stripping under node_modules, breaking `scripts/build-village.mjs`; needs Kernel keeper.
- `@rex/cognition` live-link hazard (I-1048) until Cognition tags a release.

## Gotchas
- `scripts/build-village.d.mts` types the generator; `test/fixture-village.test.ts` imports `.mjs`, resolving these declarations.
- Compiler-API test: 60_000 timeout/cached program. Fence bans grievance/unrest/rebellion/legitimacy/source_credibility/mind.belief anywhere in src (comments too); src imports: @rex/kernel/relative only. Units add processes/reads/writes to kernel.json.
- Components: type discriminant, kind/name ignored; arrays: events/ports/procedures. Transfers/goods: settlement.ledger/economy.inventory; occupation declares fact port, kin uses Society relations. Missing numbers are null/invalid; no defaults.
- validateCharter takes typed drafts, requires admission; others optional. Filling/amendment share decision union; terms may be indefinite. Money terms are never Society balances/holdings.
- API notes (5053)
Historical:
the old `founding.minimum` field is replaced by `min_members`, with no alias/default.
Council majorities carry `base` on their nested majority procedure; council scope is applied first.
`validateReference` accepts section-tagged research rows or charter-shaped references; null annotations use
`source_silent: true` plus `note`/`notes` on the containing object or ancestor within that component.
Null/unknown component types are still errors. The classifier is also exported from the package barrel.
The pre-existing per-day rate and realised-hours limiters passed the new 30-day verification unchanged.
Multi-kind decay now uses active exposures' maximum half-life; a residual tie with no kinds retains its last
half-life until pruning, preserving §1.1 decay without inventing a parameter. Cognition integration remains pending.
