# HANDOFF: society

## State
- 5242: DESIGN §1.16 sourcing/refusal, 252 sourced component compositions and meeting summons implemented in D-SOC-1 only. Same 30 seeds × 5 attempted; 0/150 runs because 9 required economy rows are null. REPORT/DIAGNOSIS now explicitly record REFUSED; prior §1.15 results remain gitignored historical evidence. All current D lines FAIL/not demonstrated, not new measured reversals. Exact Gate passed: 26 tests pass, 2 historical-artifact checks skip; tsc passes. Bench exit 1 is the required null refusal.
- 5194: DESIGN 1.15: 30 seeds x 5; D1-D4/D3b PASS, D5-D7 FAIL, no tuning. See bench/d-soc-1/{REPORT,DIAGNOSIS}.md. Gate: 25 tests/3 files + tsc; absent: 7 pass/2 skip.
- 5193: optional decision_interval (positive safe integer Kernel ms); propose { decision } opens, attend/support/oppose/abstain target proposal id, advanceTo closes in mint order; absent interval=same tick. Detached store.proposals/attendance; test/open-proposals.test.ts.
- 5162: numeric obligation/benefit amendments, offers/tallies/dues/claims; test/amendment.test.ts. #propose now shares offers' proposalProcedure: admit uses admission vote; elect/sanction without position or valid index refuse, no decision_procedure fallback. Awaiting keeper ruling (fix 46); see DESIGN 1.15 / bench/d-soc-1/DIAGNOSIS.md.
- 5163: transport/evidence: same verdicts, no src/tuning; DESIGN 1.15 / bench/d-soc-1/DIAGNOSIS.md.
- 2836-2844: see CHECK.md / DESIGN (unit lists unchecked).
- 2913-2997: diagnostics/DUP-58 (3), village/CHECK-3 (sex totals/default ages preserved); 27 charters, 24 OCR window-checked, not characterwise; independent Hucklow/Tideswell/Newcastle sources. See CHECK.md / DESIGN.
- 5053-5057: DESIGN 1.14 rulings/reference validation tested (166/no todos); null types keeper OK (5c470ea); affordance.offer, households/migration typed empty. Cognition file:../cognition devDependency; bench fixtures/evidence: bench/d-soc-1/REPORT.md.
- 5065: kernel pinned at v0.1.1 from the mirror, 9fd4997

## Next
- Research source/vocabulary gaps, no invented history; D5-D7 mechanisms then independent-data validation; see bench/d-soc-1/DIAGNOSIS.md.

## Blocked
- 5242 / §1.16: `labourer_household_annual_income`, `craftsman_days_worked_per_year`, `smallholder_net_produce_money_value`, `household_annual_subsistence_cost`, `rent_cottage_or_holding`, `illness_incidence_per_person_year`, `wages_lost_to_sickness_wage_earners`, `crude_death_rate_non_plague_years`, `bad_harvest_frequency_1370_1400` are null in economy.json. Research belongs in data/ (read-only for this task); no substitutes. Actual occupation-to-post assignments and household versus worker income definitions need keeper resolution. All reference amendment procedures lack executable quorum/role inputs; these are excluded, so sourced D5 remains blocked even after economy research. Weekly relief recurrence/qualifying periods need a design/API decision; the bench only composes stated single-payment amounts. Mind forecasts still appraise dues/relief, not admission fees. No src or data changes made.
- D5: sparse expressed attendance/votes, neutral term appraisal, missing paired-transfer experiment; no manufactured votes; structural benefit removal unsupported.
- D6/D7: retain purse squeeze/affordability (DESIGN 1.15.3); reversed insurance directions are fixture findings, no hazard/cost/seed tuning. Contact resets/inside-peer retention done; cadence, censoring/composition and missing life-cycle mechanisms limit age/ties. See bench/d-soc-1/DIAGNOSIS.md.
- Bench lacks split/secession transport; Cognition live-link hazard I-1048 until release tag.

## Gotchas
- 5242: `npm run bench:dsoc1` currently exits 1 intentionally, writes gitignored `results/sourced-refusal.json` plus REFUSED reports, and preserves any old results.json. Tests validate refusal instead of treating old results as current. Required 30-seed protocol is unchanged. `composition.ts` omits null amounts, foreign currency, unsupported events/schedules and incomplete procedures; sources travel as component IDs in each draft purpose. Meetings deduplicate with rotating/consent slots and never supply attendance/votes.
- 5194: bench/d-soc-1/results/results.json: gitignored; rebuild: npm run bench:dsoc1. Old 89 MB blob stays in history; rewriting is Rex's call. Artifact/hash tests skip if absent; structure checks run. Contacts reset both minds at contact time, delivered next tick; ballot attempts immediate, closure separate; horizon ballots censored, never filled. Two-quarter interval/peer-count forecasts are fixtures (fix 49).
- 5193: [proposal.t, closesAt); close before boundary obligations; procedure/duration captured at opening, membership/offices rechecked at vote/close. Accepted opening survives proposer's departure (awaiting keeper ruling, fix 49); removed members cannot restore ballot by rejoining. One expressed ballot/person; consumers reuse original proposal identity/content.
- Generator .mjs: scripts/build-village.d.mts; compiler API: 60_000/cached program. Fences incl. comments: codex/RULES.md; kernel.json: processes/reads/writes.
- Components: type, not kind/name; events/ports/procedures arrays. Ports/fences/null numbers: codex/RULES.md; occupation fact port, kin Society relations.
- validateCharter: typed drafts, only admission required; filling/amendment decision union, indefinite terms. founding.minimum -> min_members (no alias/default); council majority base nested, scope first. validateReference: section-tagged/charter rows; null: source_silent:true + ancestor/component notes; unknown types fail; classifier exported. Rate/hour limiters: 30-day verified. Decay: max active half-life; kindless ties retain last until pruning.
