# Independent check: society lane (2844)

Checked against `codex/RULES.md` and DESIGN §0–§1.4. Read: `src/**`, `test/**`, `kernel.json`, `DESIGN.md` §0–§1.4.
Vitest run once over the eight listed files: 8 files passed, 315 tests passed, 24 todo, 0 failed.

1. **PASS.** No `src/` module reads or writes a belief, need, trust or mind parameter (rule 2). A case-insensitive
   search for belief/need/trust/mind/grievance/unrest/cohesion/legitimacy in `src/` matches only a doc comment at
   `src/charter.ts:6` ("untrusted"). Mind inputs are intentions only (`src/types.ts:21-38`, `src/organisation.ts:227-263`).

2. **PASS.** No meter exists. The only creation site is `OrganisationStore.found` → `found()`, which is driven by a
   named `found` intention (`src/formation.ts:39-85`, `src/organisation.ts:151-178`). The sole `organisations.push`
   is at `src/organisation.ts:172`. The only `threshold` is a vote threshold supplied by the charter
   (`src/choice.ts:164`, `src/types.ts:82`), not a population, wealth or date trigger.

3. **PASS.** No branch reads a kind label or charter name. `charter.kind` and `charter.name` appear only in the type
   (`src/types.ts:136-137`). `classifyInstitution` (`src/institution.ts:9-19`) reads positions, members and event
   payloads, and its result is observer-only. `kind` comparisons in `src/` are on intention and event kinds, not
   organisation labels (e.g. `src/organisation.ts:227`, `src/choice.ts:104`). The rename test at
   `test/organisation.test.ts:419-438` covers this.

4. **PASS.** No money is held in Society state. `State` (`src/organisation.ts:58-69`) has no balance field, and the
   test at `test/organisation.test.ts:427` asserts that. Every transfer goes through the ledger port:
   `src/organisation.ts:170`, `:301`, `:322`, `:396`, `:437`. Goods go through the inventory port at `:395`.

5. **PASS.** Every import in `src/` is `@rex/kernel` or a relative `./…ts` path. Confirmed on all nine files
   (`src/network.ts:1`, `src/organisation.ts:1`, `src/ports.ts:1`, `src/types.ts:1`, and the rest). The fence test
   `test/fence.test.ts:24` checks this too.

6. **PASS, with notes.** Every model parameter is an input. Missing values throw or refuse:
   `src/network.ts:81-87` (`number()`), `:121-134`, `src/choice.ts:53-59`, `src/charter.ts:21-30`. Three literals
   are not model parameters. `src/network.ts:242` (`Number.EPSILON / 2`) is a floating-point guard. `src/choice.ts:180`
   (`draw < 1 / 2`) is the fair draw that DESIGN §1.3 defines for equal lots. `src/network.ts:295` uses kernel `DAY`,
   a unit. None is an invented constant.

7. **PASS.** `grep` for `Math.random`, `Date.now`, `new Date` and `performance.now` in `src/` finds nothing. The only
   stochastic draws are contact arrival at `src/network.ts:307-311` (per-tie stream
   `streams.get(NETWORK_PROCESS, tie.id)`) and lots at `src/choice.ts:176-180` (per-organisation stream). Map
   iteration follows insertion order, and canonical sorting is applied before output (`src/network.ts:132`, `:207`;
   `src/organisation.ts:188`).

8. **PASS against DESIGN invariants; the unit lists were not checked.** The DUP-60 tests exist and assert their stated
   content: one writer and no content write (`test/network.test.ts:96-107`); a cut tie or person stops all three content
   types (`:79-87`); the payload is never read or written (`:59-77`). The DUP-58 tests exist and assert their stated
   content: one id delivered to views and membership detached (`test/organisation.test.ts:95-113`); dissolve/close
   once (`:114-125`); merge repoints businesses and rolls back (`:149-170`); membership identity (`:381`); and no money
   in state (`:419-438`). **Gap:** units 2838 and 2841 are outside this unit's Read list, so I could not compare the
   test names against their named lists. DUP-58 test 3 (no Economy or Settlement mechanism decides membership) is only
   partly covered: `test/organisation.test.ts:111-112` checks the absence of `setMembers` and `setLeader`, not the
   Economy and Settlement mechanisms themselves.

9. **PASS.** `kernel.json` declares every process that writes a `society.*` quantity. `society.comm_network` is written
   only by `society.network.communication` (`kernel.json:14-27`). `society.organisation`, `society.membership` and
   `society.organisation_event` are written by `society.institution.formation_dissolution` (`:4-7`) and
   `society.organisation.actors` (`:9-12`). `society.organisation_event` is also written by
   `society.organisation.collective_choice` (`:30-33`). The manifest test at `test/organisation.test.ts:439-444`
   checks the actor entry.

Verdict: PASS
