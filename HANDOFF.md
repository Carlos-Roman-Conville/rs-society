# HANDOFF: society

## State
- 5193: open ballots via optional charter `decision_interval` (positive safe integer Kernel ms). `attempt(propose, { decision })` opens; `attend`/`support`/`oppose`/`abstain` target the proposal id; `advanceTo` closes at proposal time + interval, in mint order. No interval preserves same-tick decisions. `test/open-proposals.test.ts`.
- 5193: interval attendance, current eligibility, leave/death exclusions, observable close results and amendment application; admission/split/merge consume closed approvals with their existing explicit intentions. `store.proposals` and `store.attendance` are detached affordance inputs. Gate: 113 tests/5 files + tsc; 28 new tests.
- 5163: D-SOC-1 transport/evidence rerun; D1-D4/D3b PASS, D5-D7 FAIL; see DIAGNOSIS.md. Gate 22 tests/3 files + tsc; no src/numeric tuning.
- 5162: numeric obligation/benefit `propose`/`action: "amend"`; validated, amendment procedure; offers/change/tallies; dues/claims use amended charter. `test/amendment.test.ts`.
- 5162 changed #propose to share proposalProcedure with offers (admit proposals use the admission vote; elect/sanction with no position or bad index now refuse instead of falling back to decision_procedure); awaiting keeper ruling (review fix 46).
- 2836-2844: Approved DESIGN; scaffold/smoke/fences; records/Kernel ids/composable validation; network/clocks/exposure/decay/observers; 24 sourced compositions/vocabulary gaps; reference verification; authority/obligations/atomic resource-view ports; choice/ties/cycle witnesses; intention-led founding/lifecycle, observer-only institution label; CHECK.md invariants (unit lists unchecked).
- 2913: Null diagnostics, typed institution evidence, declared-parameter DUP-58 (3) check.
- 2982-2984/2992: deterministic village reference/generator, CHECK-3; spouses preserve sex totals; regenerated default preserves ages.
- 2995-2997: 27 charters, 24 OCR-rechecked via WebFetch windows (not each character); independent Great Hucklow 1787, Tideswell 1764, Glass-Makers Newcastle 1755.
- 5053-5055: five DESIGN 1.14 rulings tested (`rulings.test.ts`); 27 `source_silent` references, per-row validateReference/fixture-filled validateCharter (`charter-reference.test.ts`: 166 tests, no todos); keeper OK null types (1.14.1, 5c470ea). `src/affordance.ts`/`society.affordance.offer`; households/migration typed empty.
- 5056-5057: bench host/fixture beliefs; Cognition devDependency `file:../cognition`, chosen drafts; D3b refusal at `pay`; household ledger/evidence; 30 seeds x 4 conditions, 250 minds, 5 fixture years. D1-D4/D3b PASS, D5-D7 FAIL; prior gate 17 tests/3 files + tsc. Limits: bench/d-soc-1/REPORT.md.
- 5065: kernel pinned at v0.1.1 from the mirror, 9fd4997

## Next
- Research source/vocabulary gaps; no invented history.
- Keeper D5-D7 rulings, then independent-data validation; REPORT.md: FAIL.

## Blocked
- D5 (5163/5193): cross-tick API implemented; bench adoption/rerun, appraisal/paired-transfer rulings remain; no manufactured votes; structural benefit removal unsupported; see bench/d-soc-1/DIAGNOSIS.md
- D6/D7 (5163): keeper liquidity/consent/insurance model ruling; no hazard/cost/seed tuning; see bench/d-soc-1/DIAGNOSIS.md
- D6 age/ties (5163): cadence, censoring/composition, missing interaction/retention/life-cycle mechanisms need keeper ruling; see bench/d-soc-1/DIAGNOSIS.md
- Bench host lacks split/secession transport.
- bench/d-soc-1/results.json: 89.0 MB (89,026,649 B), committed, report-test hashed; past GitHub's 50 MB warning, near 100 MB limit; Keeper/Rex rules git retention (review fix 44); no session rewrites history or runs the bench again until ruled.
- Cognition live-link hazard I-1048 until release tag.

## Gotchas
- 5193: interval is [proposal.t, closesAt); close precedes obligations due at that boundary. Procedure/duration captured at opening; active membership/offices rechecked for votes and close. Proposer's accepted opening survives their departure; removed members cannot restore that ballot by rejoining. One expressed ballot/person; duplicates refused. Admission/lifecycle consumers pass the original proposal identity/content, not a newly dated proposal.
- Generator test `.mjs` resolves `scripts/build-village.d.mts`.
- Compiler-API: 60_000 timeout/cached program. Fence bans grievance/unrest/rebellion/legitimacy/source_credibility/mind.belief even in src comments; imports @rex/kernel/relative only. kernel.json: processes/reads/writes.
- Components: type, ignore kind/name; arrays: events/ports/procedures. Transfer/goods ports: settlement.ledger/economy.inventory; occupation fact port, kin Society relations. Missing numbers null/invalid, no defaults.
- validateCharter: typed drafts, admission required; others optional; filling/amendment decision union; indefinite terms. Money never Society state.
- 5053 API: founding.minimum -> min_members, no alias/default; council majority base nested, scope first. validateReference: section-tagged/charter rows; null needs source_silent:true + ancestor/component note(s); unknown types fail. Classifier in barrel. Rate/hour limiters: 30-day verified unchanged. Decay: max active half-life; kindless ties retain last until pruning.
