# D-SOC-1 host: Society ↔ Cognition (IF-46)

## Full fixture study (5057)

`npm run bench:dsoc1` runs 30 fixed seeds in four paired conditions (baseline,
higher illness, no network, no shocks), using all 250 people in the committed
60-household village. It writes `REPORT.md` and `results.json`. Runtime is longer
than the report test; four isolated simulation processes run concurrently.
`npm run typecheck` and `npx vitest run test/dsoc1-report.test.ts` verify the
committed evidence. A recorded FAIL is allowed by the integrity test and remains
a failed demonstration: read the report and HANDOFF rather than treating a green
integrity test as P6 acceptance.

`fixtures.ts` labels the unsupported Life, Economy and Settlement assumptions,
the five-year horizon and the subjective action vocabulary. `study.ts` composes
draft candidates from components for Cognition to choose and uses the existing
host for consent and every social attempt. Reference charters are not a menu.
`models.ts` gives every mind hunger, safety and social-connection needs with the
unmodified baseline cognitive parameters. All beliefs begin ignorant of charter
terms; eight organisation-topic slots and four draft-component slots declare
learnable support in advance. Unknown topics stay ignorant. The topic bindings
are host identity bookkeeping, not writes into mind beliefs. `ledger.ts` aliases
person accounts to household purses and closes all flows through an external
sector account. `report.ts` computes gates and graded signs from the saved runs.

The older three-person fixture below remains an interface regression example,
separate from the full study. The host now optionally accepts `drafts(person)`
so a mind can choose among component-product found offers; existing callers of
the single `draft(person)` callback retain their original behavior.

`host.ts` maps `offers()` to Cognition action definitions and binds emitted action
ids back to the original Society intentions. Numeric term leaves use dotted paths
(for example `charter.obligations.0.amount`); role names and other structured
arguments remain in host bindings. Action ids are opaque, stable within a host
run, and distinguish multiple payments or role proposals on one target.

`DSoc1Host` runs both stores and mind commands from one Kernel scheduler. The
caller supplies ports, body capacity, cadence, perception calibration, action
models, founding drafts and the circumstances in which people deliberate.
Organisation actions go through `OrganisationStore.attempt`; founding collects
separately chosen draft and join intentions before calling `found`. Contact
intentions use the network's public methods. Every resolved intention, including
a refusal, gets a causally linked Cognition `outcome` command. Open founding
circles are resolved on consent or expiry. Collective decision contexts must be
supplied by the caller; this adapter does not invent ballots or quorum.

Network opportunities retain their original times and are delivered on the next
host tick, with latency at most the supplied period. Network, perception and
decision randomness use Kernel streams keyed by mechanism and entity. All
charter evidence enters `perceive()` as sight or report stimuli. The host never
patches a mind's beliefs, and Society receives no mind state.

`beliefs.ts` is the labelled **fixture** vocabulary, ignorant initial supports,
subjective action models and observation-only outcome learning. Its precondition
closures use only the deciding mind's beliefs. Numeric offer terms do not teach
the mind anything. Report provenance records the member and the actual network
contact; report contents are fixture speech, including an intentionally wrong
account, rather than a model of communication encoding or source credibility.

`fixture.ts` exports `runThreePerson(seed)`, using the first three adults in the
existing village fixture and stub ledger/views ports. The first mind reads a
draft at a meeting place and chooses founding plus consent. The other two hear
the founder's account through network contacts and choose joining. The third
hears dues of 2 instead of 5, with a purse of 3. When dues fall due, Society's
automatic collection fails; the person then chooses to pay the unpaid obligation
based on the wrong account. `attempt` refuses that payment. The outcome includes
an observation of the posted amount, which Cognition learns; payment remains
offered but fails the mind's affordability precondition at the next decision.

All amounts, rates, sensory calibration and choice parameters are test fixtures.
This is the three-person interface integration, not the full 300-person,
30-seed/50-year D-SOC-1 competition and historical-validation experiment.

Verification: `npx vitest run test/dsoc1-host.test.ts` and `npx tsc --noEmit`.
Tests cover causal founding, report delivery, D3b learning, numeric-only mapping,
capacity filtering, a network knockout, accounting and byte-identical seeded
replay of the complete trace and final state.
