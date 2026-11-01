# CHECK-2: independent check of round-3 fixes and charter-reference tasks

Ran once: `npx vitest run test/charter-nulls.test.ts test/institution-typed.test.ts test/organisation.test.ts test/fence.test.ts test/charter-reference.test.ts`
Result: 5 files passed, 447 tests passed, 27 todo.

1. PASS. `validateCharter` returns errors instead of throwing for null inputs. `src/charter.ts:9` is the entry point, and `src/charter.ts:13` rejects null or non-object values. `test/charter-nulls.test.ts:54-66` rejects null at every path of an executable fixture and expects `not.toThrow()`. `test/charter-nulls.test.ts:79-90` covers the researched null `procedure` and null position `type` regressions.
2. PASS. `src/institution.ts` has no "sanction applied" or "dues paid" string (grep of `src/**` matches only in `src/organisation.ts` emitters). `classifyInstitution` (`src/institution.ts:9`) reads typed fields such as `payload`. `test/institution-typed.test.ts:26-27` shows the result is unchanged when `cause` is renamed or blanked, and `:54-57` checks the typed payload fields.
3. PASS. `test/organisation.test.ts:113-117` checks `publicAuthority()` over every public callable's declared adapters, expecting zero violations. `test/organisation.test.ts:119-124` checks that the export/parameter check flags renamed functions (`renamedChoice`) and nested ports (`innocuous.options.ports`, `InnocuousStore.update.input.views`, `InnocuousStore.configure.views`). The check covers parameters, not only the absence of `setMembers`/`setLeader`.
4. PASS. `HANDOFF.md` is 3771 bytes (under 4096). Headings are `## State` (line 3), `## Next` (line 23), `## Blocked` (line 31), `## Gotchas` (line 43). The 2840 Blocked entry is intact at line 9 and line 33.
5. PASS. `data/charters/reference.json` has 27 entries, all with `ocr_checked: true`. No entry has "page not extracted" without a `searched:` note. Entries whose first author is neither Toulmin Smith nor Brentano number 10 (Westlake ids 16-20, Eden ids 21-22, friendly-society ids 24-26). `test/charter-reference.test.ts:152-153` pins 27. Every entry has `evidence: 3`. The new entries (ids 24-26, `fs-*`) carry archive.org source URLs.
6. PASS. `test/fence.test.ts` passed in the run above, so `src/**` imports only `@rex/kernel` and relative paths.

Verdict: PASS
