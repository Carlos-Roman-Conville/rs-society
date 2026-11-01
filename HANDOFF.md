# HANDOFF: society

## State

- 2836: Package scaffold, smoke/fence tests; DESIGN approved.
- 2837: Shared records, Kernel ids and composable charter validation.
- 2838: Communication network, clocks, exposure, decay and observer measures.
- 2839: 24 sourced historical charter compositions and vocabulary gaps.
- 2840: Reference verification; 24 executable-validation todos remain blocked.
- 2841: Organisation authority, obligations and atomic resource/view ports.
- 2842: Collective choice, explicit tie-breaks and pairwise cycle witnesses.
- 2843: Intention-driven founding/lifecycle and observer-only institution label.
- 2844: Independent invariant check in CHECK.md; unit lists not checked.
- 2913: Null diagnostics, typed institution evidence and declared-parameter DUP-58 (3) check.

Details, API conventions and verification limits: README.md.

## Next

- Keeper design: DESIGN §1.2a null parameters; §1.3 `tie_break` and abstention denominator;
  §1.4 founding window and `./institution` export; §1.1 per-day hours cap and multi-kind decay.
- Charter research fixes: source/vocabulary gaps and executable inputs without invented history.
- Affordance port with Cognition, requiring the Cognition keeper's agreement.
- Fixture village, then D-SOC-1 bench and independent-data validation.

## Blocked

**2840 reference validation:** all 24 `data/charters/reference.json` rows fail `validateCharter` as faithful
compositions (null schedules and amounts where the source is silent, missing admission components on five gild
returns, `procedure: null` on sanctions/amendments, and positions with `type: null` — the validator throws on null
`procedure.type`). See `test/charter-reference.test.ts` (`it.todo` per entry id with the first error bundle). Unblock
when DESIGN §1.2a accepts researched null parameters on schedules or the reference file gains executable values without
inventing history.

2913 fixes the exception mentioned above; nulls remain invalid. Keeper design decisions listed in Next
and the Cognition port agreement remain pending; this task does not change the spec or research data.

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
