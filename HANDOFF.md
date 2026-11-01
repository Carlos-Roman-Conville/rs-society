# HANDOFF: society

## State

- 2836: Package scaffold, smoke/fence tests; DESIGN approved.
- 2837: Shared records, Kernel ids and composable charter validation.
- 2838: Communication network, clocks, exposure, decay and observer measures.
- 2839: 24 sourced historical charter compositions and vocabulary gaps.
- 2840: Reference verification; 27 executable-validation todos remain blocked.
- 2841: Organisation authority, obligations and atomic resource/view ports.
- 2842: Collective choice, explicit tie-breaks and pairwise cycle witnesses.
- 2843: Intention-driven founding/lifecycle and observer-only institution label.
- 2844: Independent invariant check in CHECK.md; unit lists not checked.
- 2913: Null diagnostics, typed institution evidence and declared-parameter DUP-58 (3) check.
- 5053: All five DESIGN §1.14 rulings implemented and covered in `test/rulings.test.ts`.
  Gate: 266 tests passed, including DUP-58/DUP-60; typecheck passed. Additional charter null/reference
  checks: 422 passed, 27 existing todos for 5054.

- 2982–2984: Fixture village reference, deterministic generator and CHECK-3 review.
- 2992: Male/female spouse pairs preserve sex totals; default village regenerated, age structure retained.

- 2995-2997: 27 reference charters; 24 OCR-rechecked through WebFetch windows (`ocr_checked: true` means re-read in windows, not compared character by character); 3 independent friendly societies: Great Hucklow 1787, Tideswell 1764, Glass-Makers Newcastle 1755.

Details, API conventions and verification limits: README.md.

## Next

- 5054: Annotate historical references and validate their structural evidence plus completed fixture drafts.
- Charter research fixes: source/vocabulary gaps and executable inputs without invented history.
- Affordance port with Cognition, requiring the Cognition keeper's agreement.
- D-SOC-1 bench (waits on the Cognition affordance port) and independent-data validation.

## Blocked

**2840 / 5054 reference validation:** historical rows still need source-silent annotations and known
component types before passing `validateReference`; executable drafts additionally need all missing inputs,
admission, `founding: { window, min_members }`, and explicit majority `base`. The 27 reference-validation todos
remain for unit 5054. Unit 5053 leaves `data/` unchanged. The null exceptions were fixed by 2913.

5053 API notes: the old `founding.minimum` field is replaced by `min_members`, with no alias/default.
Council majorities carry `base` on their nested majority procedure; council scope is applied first.
`validateReference` accepts section-tagged research rows or charter-shaped references; null annotations use
`source_silent: true` plus `note`/`notes` on the containing object or ancestor within that component.
Null/unknown component types are still errors. The classifier is also exported from the package barrel.
The pre-existing per-day rate and realised-hours limiters passed the new 30-day verification unchanged.
Multi-kind decay now uses active exposures' maximum half-life; a residual tie with no kinds retains its last
half-life until pruning, preserving §1.1 decay without inventing a parameter. Cognition integration remains pending.

## Gotchas
- A test that uses the TypeScript compiler API sets an explicit timeout (60_000) and reuses one cached program.
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
