# D-SOC-1 — DESIGN §1.16 sourced rerun

Run status: REFUSED
Source SHA256: 22b63182617ab2abef6b43f5c38b6840364b6ce65e12428bb41fbca4a12b19df
Study inputs SHA256: 4a421718ec8e1091d5f39fedcd9449b57c330ed2a6400363411258b352f80228
Seed count: 30
Seeds: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
Completed runs: 0 / 150
Results SHA256: none (preflight refusal; no new results.json)
Diagnostic illness-only condition remains excluded from gate calculations.

D1: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D2: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D3: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D3b: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D4: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D5: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D6: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.
D7: FAIL not demonstrated: §1.16 preflight refused required null source rows; no current simulation evidence.

FAIL means the demonstration did not establish the requirement; it is not a measured reversal or an engine regression. No previous PASS is carried forward as a sourced result. The same seeds 1–30, five conditions and 20 quarterly ticks were requested. No RNG or simulation state was created.

- economy.json row labourer_household_annual_income: required finite nonnegative number; got null
- economy.json row craftsman_days_worked_per_year: required finite nonnegative number; got null
- economy.json row smallholder_net_produce_money_value: required finite nonnegative number; got null
- economy.json row household_annual_subsistence_cost: required finite nonnegative number; got null
- economy.json row rent_cottage_or_holding: required finite nonnegative number; got null
- economy.json row illness_incidence_per_person_year: required finite nonnegative number; got null
- economy.json row wages_lost_to_sickness_wage_earners: required finite nonnegative number; got null
- economy.json row crude_death_rate_non_plague_years: required finite nonnegative number; got null
- economy.json row bad_harvest_frequency_1370_1400: required finite nonnegative number; got null

Reproduce: npm run bench:dsoc1 (expected nonzero exit while these inputs are missing). The runner records results/sourced-refusal.json in the gitignored results folder. Any existing results/results.json is the previous §1.15 experiment, not evidence for these inputs. It is preserved, never relabelled or overwritten with invented runs. See DIAGNOSIS.md for prior findings and remaining limitations.
