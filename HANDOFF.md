# HANDOFF: society

## State
- 5163: amendment proposal/ballot transport and observer evidence added to D-SOC-1; fixed-seed 120-run rerun complete. D1/D2/D3/D3b/D4 PASS; D5/D6/D7 FAIL. Baseline/high/no-shocks relief foundings=1008/643/1463; 736 baseline amendment proposals, 733 no-quorum refusals, 3 ties, 0 executed. DIAGNOSIS.md is regenerated from per-seed decisions, shock/purse records, ledger aggregates, exits and charter tallies. No src or numeric fixture tuning. Requested gate passed: 22 tests across the three gate files and tsc --noEmit.
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
- D-SOC-1 follow-ups: keeper rulings on D5 meeting cadence/appraisal and D6/D7 model/fixture design (Blocked), then independent-data validation. REPORT.md records Acceptance: FAIL; D5, D6 and D7 remain FAIL.
- 5065: pending kernel pin to v0.1.1; waits on kernel unit 5153.

## Blocked
- D5 (5163): engine amendment execution and bench proposal/ballot transport exist. The unchanged one-decision-per-selected-person quarterly cadence cannot let a solitary member attend, propose and support in the same tick. Society requires the original attempted proposal time to equal its clock, while quorum uses current attendance; host closes ballots that tick. Keeper must specify meeting/deliberation semantics and, for cross-tick proposals, a compatible src API. Neutral proposal/ballot forecasts and undeclared proposed-value beliefs do not model term-sensitive competition. A paired amendment/transfer counterfactual remains missing; do not manufacture votes, attendance or extra deliberations. See bench/d-soc-1/DIAGNOSIS.md. Structural removal of benefit components is still outside the amendment payload.
- split/secession not transported by the bench host.
- D6/D7 (5163): shared-purse illness/harvest costs feed a mind-side affordability condition on founding consent, while founding itself has no affordability filter. Company is forecast on every found/join but social deficits receive no positive-interaction resets. No illness effect on hours/body capacity exists. No-shocks also removes deaths, so its effect is bundled. Keeper must justify the liquidity/consent and insurance-demand model; no costs, hazards or seeds were tuned.
- D6 age/ties (5163): young dissolutions are all deaths (32); older include 383 last-member voluntary leaves and 77 deaths. No founder has another decision within four quarters after any of the 1954 baseline foundings: cadence prevents early voluntary departure. Drafts have no adaptation/retention mechanism. Founders enter alone, later recruits contribute positive-tie spells, and completed-spell correlations are censored/composition-sensitive. The leave forecast reads neither inside ties nor niche overlap; contact does not reinforce ties or reset social need. Interaction/retention and life-cycle mechanisms require a keeper design ruling, not hazard tuning.
- bench/d-soc-1/results.json is 89.0 MB with diagnostic evidence and committed (the report test hashes it): keeper rules whether it stays in git.
- `@rex/cognition` live-link hazard (I-1048) until Cognition tags a release.

## Gotchas
- `scripts/build-village.d.mts` types the generator; `test/fixture-village.test.ts` imports `.mjs`, resolving these declarations.
- Compiler-API test: 60_000 timeout/cached program. Fence bans grievance/unrest/rebellion/legitimacy/source_credibility/mind.belief anywhere in src (comments too); src imports: @rex/kernel/relative only. Units add processes/reads/writes to kernel.json.
- Components: type discriminant, kind/name ignored; arrays: events/ports/procedures. Transfers/goods: settlement.ledger/economy.inventory; occupation declares fact port, kin uses Society relations. Missing numbers are null/invalid; no defaults.
- validateCharter takes typed drafts, requires admission; others optional. Filling/amendment share decision union; terms may be indefinite. Money terms are never Society balances/holdings.
- API notes (5053): `founding.minimum` -> `min_members`, no alias/default; council majority `base` is nested, scope first. `validateReference` accepts section-tagged or charter-shaped rows; nulls need `source_silent: true` and ancestor/component `note`/`notes`; unknown types still error. Classifier exported from barrel. Rate/hour limiters passed 30-day verification unchanged. Multi-kind decay uses maximum active half-life; kindless residual ties retain last half-life until pruning.
