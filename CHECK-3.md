# CHECK-3: independent check of the fixture village (2982, 2983)

Ran once each: `npx vitest run test/fixture-village.test.ts test/fence.test.ts` (2 files, 12 tests passed);
`node scripts/build-village.mjs --check` (exit 0, no output).

1. **Citations and nulls: holds.** `data/fixtures/village/reference.json`: `mean_household_size` is 4.17 with a
   citation and an https URL (repository bitstream). The five null rows (`households_per_parish`,
   `household_size_distribution`, `complex_household_share`, `age_structure_five_year`, `sex_ratio`) each carry
   a citation of "none usable; see SOURCES.md (2982) searched line", and each key has a matching
   `(2982) searched:` line in `data/fixtures/village/SOURCES.md` (the "Searched, not usable" section).

2. **Numbers come from reference or FIXTURE: holds.** `scripts/build-village.mjs:8-28` is the only block of
   literal numbers, and each entry has `fixture: true` and a note. Outside it, the body uses only the
   destructured `zero`/`one`/`pair`/`indent` (line 31, from `FIXTURE.mechanics`), `FIXTURE.*` references and
   reference values. No other literal sets a count, share or rate. Test
   `test/fixture-village.test.ts:106` enforces this for every numeric literal outside the block.

3. **`--check` never writes: holds.** `scripts/build-village.mjs:158-165`: the `check` branch only reads and
   compares; `writeFileSync` is in the `else` branch alone. `node scripts/build-village.mjs --check` exits 0.

4. **village.json invariants: holds.** Checked by script: no organisation keys or `organi[sz]ation` text
   (`serialize` is also tested at `test/fixture-village.test.ts:95`); 250 persons, all in households, and none
   in more than one (`notExactlyOne: 0`); 60 households. `households_per_parish` is null in the reference, so
   the fixture fallback of 60 applies (`FIXTURE.households_per_parish`, script line 8), and the count matches.
   Mean 250/60 = 4.17, equal to the reference value.

5. **Named checks covered by tests (`test/fixture-village.test.ts`):**
   - household count: "conserves household counts, size distribution and the researched mean" (line 19)
   - mean size: same test, line 22 (within 10% of the reference mean)
   - one household per person: "puts each minted person in exactly one household with one unique residence" (line 46)
   - symmetric spouse/sibling edges: "records symmetric spouse/sibling and inverse parent/child edges with older parents" (line 60)
   - parent older than child: same test, line 67
   - one residence per household: "puts each minted person in exactly one household with one unique residence" (lines 54-57)
   - no organisations: "assigns every adult a work post and labels every unique grid parcel as fixture" (line 95)
   - seed determinism: "reproduces committed bytes and changes substantive data for another seed" (line 98)
   - fixture labelling: "keeps every unsourced numeric literal in the labelled FIXTURE block" (line 106) and the
     parcel label check in the work-post test (line 91)

6. **HANDOFF.md: holds.** 3295 bytes (under 4096). Headings `## State` (line 3), `## Next` (18),
   `## Blocked` (26) and `## Gotchas` (38) are present. The 2840 Blocked entry is kept (line 28).

Verdict: PASS
