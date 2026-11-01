# Rules for Codex, Composer and any belt worker in `Toolchain/society`

1. Read `DESIGN.md` (the sections your task names) first. It is the spec. Disagree by parking in `HANDOFF.md`
   Blocked, never by changing DESIGN.md.
2. **Society acts on what people do, never on what they think** (DESIGN §0, Rex 2026-10-31). Inputs from minds are
   intentions and interaction episodes only; never read or write a belief, need, trust value or mind parameter.
   Outputs to minds are affordances (the actions open now) and observable events, never a belief or a score.
3. **No meters, no assigned types.** No grievance, unrest, rebellion, cohesion or legitimacy quantity. No code
   creates an organisation, an institution or a collective event at a threshold of population, wealth, hunger or
   date: every one traces to named persons' intentions. **No mechanism reads an organisation's kind label.**
4. **Charters are compositions** (DESIGN §1.2a, Rex): components are executable rules; a charter is valid when every
   component's inputs exist; historical charters are reference compositions, never a closed menu. Never branch on a
   charter's name or historical type.
5. **Money is never Society state.** Dues, relief and spending are transfers on Settlement's ledger through a port
   (`settlement.ledger_row` / `settlement.balance_changes`), committed in one kernel transaction with the Society
   event. Goods move through Economy's inventories through a port. Tests use a stub port; `src/` never imports an
   engine. Transfer ports are `settlement.ledger` (money) and `economy.inventory` (goods).
   `test/fence.test.ts` bans `mind.belief`, `source_credibility`, `grievance`, `unrest`, `rebellion`
   and `legitimacy` in `src/`, even inside comments.
6. `src/` imports only `@rex/kernel` and its own files. Never an engine, a game or pirate-ship. Bench fixtures live
   in `bench/` and import `src/`, never the reverse.
7. **No constants invented.** Every parameter (`λ0_k`, `α_k`, `T_k`, `w_min`, …) is an input; a missing one is
   `null` and the function refuses to run with a clear error. Tests use values labelled `// fixture (test only)`.
8. Deterministic: no `Math.random`, no `Date.now`; randomness only from kernel streams (`streams(seed).get(mechanismId,
   entityId)`) and only where DESIGN says a mechanism is stochastic (contact arrival, §1.1). Iterate records in mint
   order, never over unordered keys where order reaches the output.
9. Every formula carries a comment with its DESIGN section and source; every parameter carries its source or
   "to research (DESIGN §x)".
10. Style: TypeScript, ES modules with `.ts` import suffixes, small files, one test file per source file in `test/`,
    test titles naming the rule they check. Verification tests check each formula as stated, boundary cases,
    conservation (membership, population, money through the stub ledger) and numerical stability (DESIGN §4).
11. Run only your own tests while working (`npx vitest run test/<file>.test.ts`); the runner runs the Gate.
12. One commit, not pushed, ending with the trailer your task names. Nothing left uncommitted. Close with a short
    report: done or parked, tests, commit hash.
