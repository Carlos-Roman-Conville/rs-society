# HANDOFF: society

## State
Package scaffolded (unit 2836): package.json, tsconfig, empty barrel `src/index.ts`, empty `kernel.json`,
smoke and fence tests, README. DESIGN approved 2026-10-31 (SOC-Q1..Q8).

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
