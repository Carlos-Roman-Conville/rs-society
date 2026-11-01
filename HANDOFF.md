# HANDOFF: society

## State
Package scaffolded (unit 2836): package.json, tsconfig, empty barrel `src/index.ts`, empty `kernel.json`,
smoke and fence tests, README. DESIGN approved 2026-10-31 (SOC-Q1..Q8).

Unit 2837 implemented: shared records and Kernel-backed `mintId`, composable charter component types,
and `validateCharter` exported through the public barrel. Validation checks component inputs and references,
not historical labels. The schema has verification tests; engine execution/integration belongs to later units.

## Next
Units 2837–2844 in order (see DESIGN §6): registry rows and quantities; network §1.1; organisations, collective
choice and formation §1.2–§1.4; charter-forms data file; affordance port with Cognition; fixture village and
D-SOC-1 bench; Haiku check.

## Blocked
Nothing.

## Gotchas
- The fence test fails on the words `grievance`, `unrest`, `rebellion`, `legitimacy`, `source_credibility` and
  `mind.belief` anywhere in `src/`, comments included.
- `src/` may import only `@rex/kernel` and relative paths.
- Each later unit adds its processes, reads and writes to `kernel.json`.
- Charter components discriminate on `type`; `kind` and `name` are ignored by validation. Capabilities are
  arrays named `events`, `ports`, and `procedures`. Port names for transfers and goods are `settlement.ledger`
  and `economy.inventory`; occupation admission explicitly declares its fact port. Kinship uses Society's own
  relations. Missing numeric parameters are `null` and invalid; there are no default amounts or procedures.
- `validateCharter` accepts typed drafts, not arbitrary JSON. Admission must be nonempty; other mechanisms
  may be omitted. Position filling and amendment use the same decision-procedure union. Position terms may
  explicitly be `indefinite`. Monetary values are rule terms, never balances or holdings in Society state.
