# HANDOFF: society

## State
Package scaffolded (unit 2836): package.json, tsconfig, empty barrel `src/index.ts`, empty `kernel.json`,
smoke and fence tests, README. DESIGN approved 2026-10-31 (SOC-Q1..Q8).

Unit 2837 implemented: shared records and Kernel-backed `mintId`, composable charter component types,
and `validateCharter` exported through the public barrel. Validation checks component inputs and references,
not historical labels. The schema has verification tests; engine execution/integration belongs to later units.

Unit 2838 implemented: `CommunicationNetwork` in `src/network.ts`, exported by the barrel, with a single
directed tie store and `society.network.communication` declared in `kernel.json`. Includes structural exposure
inputs, per-tie Kernel exponential clocks, endpoint rate scaling plus realised daily hour caps, opaque payload
pass-through, reinforcement/decay, seek/avoid, cuts and observer graph measures. See README for the public API.
Multi-kind convention: each episode names its kind; its T controls scalar decay until the next episode or seek.
Poisson statistics apply when capacity is nonbinding; capped output is deliberately censored. Observer degree,
clustering and components use the undirected projection. Clustering/homophily validation is specified in a test
comment for later independent-data runs; host-engine integration is not claimed by this unit.

Unit 2842 implemented: `collectiveChoice` and `pairwiseCollectiveChoice` in `src/choice.ts`, exported by
the barrel and declared in `kernel.json`. Includes position-holder, majority, qualified, unanimity and
nested council execution, complete tallies, explicit no-act reasons, chartered casting-holder/lots
tie-breaks, and pairwise cycle witnesses. `DecisionProcedure.simple_majority` now accepts optional
`tie_break`; charter validation checks it. See README for targeting, attendance and denominator semantics.
May verification covers fully expressed binary ballots; abstentions/silence count in the declared
head-count denominator. No empirical validation is claimed: consequences remain D-SOC-1.

Unit 2841 implemented: `OrganisationStore` and outbound ledger/inventory/views interfaces, exported
through the barrel; `society.organisation.actors` declares the three Society writes. Includes current-state
attempts, charter-composed admission with collective-choice votes, Kernel-time obligations, atomic resource
transfers and events, conditional benefits, elected offices/sanctions, removal and dissolution, and mergers
approved by both actors. Tests use stub ports and verify membership identity, ledger conservation, rollback,
one actor id, lifecycle notifications and label independence. See README for host API and timing conventions.
Real engine adapters, migration re-entry and loan-account servicing remain with
their owning units; this store supplies the actor authority and transaction boundary.

Unit 2843 implemented: lifecycle algorithms in `src/formation.ts`, reached through the store's atomic
`found`, `split`, `secede`, `merge` and existing dissolution paths. The public `create` bypass is removed;
callers must provide a draft identity, named founders, their own targeted joins, purpose, executable charter
with `founding.window`/`founding.minimum`, and the current communication network. Directed mutual reachability
allows paths through non-founders. Founding charges declared entry fees through the ledger. New successors
must themselves be founded; split choices partition members, while resources use the permitted unsettled
claims fallback. `secede` covers minority exits followed by founding, with explicit split provenance.
Observer-only `classifyInstitution` is exported at `@rex/society/institution`, never through the mechanism
barrel; successful sanctions now emit application evidence distinct from vote approval. See README for
batch founding, inclusive window, secession-failure and split-admission conventions. Real adapter integration
and D-SOC-1 liability-of-newness/density-dependence validation are not claimed.

## Next
Units 2837–2844 in order (see DESIGN §6): registry rows and quantities; network §1.1; organisations, collective
choice and formation §1.2–§1.4; charter-forms data file; affordance port with Cognition; fixture village and
D-SOC-1 bench; Haiku check.

## Blocked
**2840 reference validation:** all 24 `data/charters/reference.json` rows fail `validateCharter` as faithful
compositions (null schedules and amounts where the source is silent, missing admission components on five gild
returns, `procedure: null` on sanctions/amendments, and positions with `type: null` — the validator throws on null
`procedure.type`). See `test/charter-reference.test.ts` (`it.todo` per entry id with the first error bundle). Unblock
when DESIGN §1.2a accepts researched null parameters on schedules or the reference file gains executable values without
inventing history.

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
