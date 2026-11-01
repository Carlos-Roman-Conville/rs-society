# @rex/society

Society is the engine for collective life: the one transmission network, organisations as actors, institution
formation and dissolution, collective action, households, norms and class. Culture is never stored as a property;
it is the pattern in who links to whom, which organisations exist, and what travels. Design: `DESIGN.md`.

## The fence (DESIGN §0)

- Society acts on what people do (intentions, completed episodes), never on what they think: no reads of beliefs,
  needs or mind parameters.
- No rebellion, unrest or legitimacy meter, and no assigned government type; authority distribution is computed.
- Pure function of inputs plus kernel streams: imports only `@rex/kernel`, no `Math.random`, no `Date.now`.

## Test

```
npm install
npm test          # vitest run
npm run typecheck # tsc --noEmit
```

`test/fence.test.ts` checks the fence over `src/`.

## Package state and charter validation

Units 2836–2844 delivered the package scaffold, shared records/schema, network, historical charter research,
reference verification, organisation store, collective choice, formation and the independent check. DESIGN
was approved on 2026-10-31 (SOC-Q1–Q8). `kernel.json` declares the network, collective-choice, actor and
formation processes and their reads/writes; actor and lifecycle processes share the three Society writes.
Each later mechanism must add its own manifest contract. The scaffold's smoke and import-fence tests remain.

Shared records and Kernel-backed `mintId` are exported through `src/index.ts`; mint counters belong to the caller.
`validateCharter(charter, capabilities)` checks executable component inputs and references, never historical
labels. Its TypeScript interface accepts typed drafts; JSON-shaped missing/null fields return path-qualified
errors rather than throwing. Null parameters remain invalid, and no schedule, amount or procedure is supplied
by default. Omitted optional mechanisms remain valid, but an explicitly null mechanism is an incomplete draft.
Observer `kind`/`name` metadata is ignored even on nested components. Drafts require `founding.window` and
`founding.min_members` (positive safe integers); majority rules
require an explicit `base`. Validation does not execute a charter.

`validateReference(reference)` separately checks structural evidence under DESIGN §1.14 1. It accepts a
research row with section-tagged `components` or a charter-shaped reference, without requiring admission,
founding terms or capability ports. Component types must be known. Every null needs `source_silent: true`
and a nonempty `note` (or `notes`) on its containing object or an ancestor within the same component.
Annotations never make a null component type valid or turn a reference into an executable draft.

The 27 historical compositions in `data/charters/reference.json` retain researched sources and vocabulary gaps.
Their annotations and reference-to-draft tests remain unit 5054's work; unit 5053 does not alter research data.
`test/charter-reference.test.ts` retains 27 executable-validation todos. `test/charter-nulls.test.ts` exercises
null/missing fields across every executable component shape.

Unit 2844's independent review is recorded in `CHECK.md` (historical result: 315 passed, 24 todo). It checked
DESIGN invariants, not the original unit lists, and noted that DUP-58 (3) only checked two absent setters.
The strengthened organisation test resolves all public barrel exports and their declared function, constructor
and public method parameters, recursively checking nested adapter contracts. Synthetic unsafe exports prove it
detects membership/leadership decision ports. This verifies Society's public boundary; real engine integration,
migration re-entry and loan servicing remain with their owning units.

## Communication network (DESIGN §1.1)

`CommunicationNetwork` is exported from the package barrel. Construct it with caller-owned Kernel
`streams(seed)`, mint counters, a start time, people and available hours, and explicit `kinds` parameters
(`lambda0`, `alpha`, `T`), `w_min` and contact duration `d`. Missing/null parameters throw. Times are Kernel
integer milliseconds, `T` is days, `lambda0` is contacts/day per exposure unit, and `d` is hours/contact.
Use the returned `counters` when sharing the tie-id namespace with another caller.

`setExposures` replaces structural input data: directed shared-hours rows, undirected household/kin links,
and co-membership meeting attendance. Repeated shared rows and meeting records add; attendance must describe
actual co-attendance. An absent Settlement port is explicitly `sharedHours: null` and appears in `trace`.
Household and kin links contribute one exposure in each direction. No fallback graph is generated.

Call `nextOpportunity(until, payloads)` to get one event and act at its timestamp, or `advanceTo(until, payloads)`
to collect a batch. Payload lists pass through unchanged and are never inspected or retained. The host resolves
place and physical channel from the endpoints. `recordEpisode(i, j, network.now, kind?)` strengthens a tie;
opportunities themselves do not. For multi-kind ties, the episode must name its kind to select reinforcement
`alpha`; decay uses the longest half-life among currently held kinds (DESIGN §1.14 5). An ended exposure
removes its kind unless another structural or sought exposure of that kind remains. Changes decay the
preceding interval before switching half-lives. If all exposures end, residual strength retains its last
half-life until pruning. Single-kind episodes may omit `kind`.

`seek_contact(i, j, now, kind, exposure)` supplies intentional exposure and strengthens the tie; repeated seeks
replace that exposure rather than accumulating hours. `avoid_contact(i, j, now)` drops all directed exposure.
Later structural input can restore exposure. `cutTie(i, j)` removes that direction and its pending event;
`cutPerson(id)` removes all incident ties and unregisters the person. Advance to an act's time before applying it.

Rates count both incoming and outgoing costs and scale to the tighter endpoint's budget. A second check caps
realised offered hours in each epoch-aligned Kernel day; consequently, emitted counts are censored when capacity
binds, while unconstrained proposals follow the Poisson law. `setAvailableHours` can change capacity at the
current time, but cannot retract already-offered hours. Partial initial days receive the supplied daily budget.
`ties()` returns detached records. `measures()` gives degree, local clustering and connected components on the
simple undirected projection, including registered isolates. These are observer outputs only.

Verification: `npx vitest run test/network.test.ts`. Independent clustering/homophily validation and integration
with Cognition/Settlement/Reality remain later work under DESIGN §4; the validation experiment is recorded in
the test file. Test calibration is fixture data, not researched historical calibration.

## Collective choice (DESIGN §1.3)

`collectiveChoice(input)` applies the supplied `DecisionProcedure` to an organisation's membership,
position assignments (including vacancies), attendance, proposal, and expressed ballots. It is exported
from the package barrel. The proposal must target the organisation; ballots must target the explicit
`proposalId`. Supply a resolved snapshot with at most one ballot per person and a decision time after
the proposal and ballots. Invalid parameters, duplicate ballots and mismatched targets throw. The
proposal does not implicitly cast a support vote. Payloads are opaque and never inspected.

The returned `OrganisationEvent` has `kind: "act"` and `payload.outcome: "accepted" | "rejected"` for a
completed decision. Consumers must check the outcome before executing the proposed action. No-act
results use `kind: "refused"`, `payload.outcome: "no_act"`, and a reason (`no quorum`,
`tie with no tie-break`, `ineligible proposer`, or `no decision` for a holder without a decisive vote).
Every result retains the source intentions and a tally listing eligible/present/electorate persons,
support, opposition, abstention, unexpressed votes, excluded ballots with reasons, denominator and quorum.
Person records are emitted in numeric mint order.

Under DESIGN §1.14 2, simple and qualified majorities require `base: "cast" | "present" | "members"` with no
default. `cast` counts support plus opposition; `present` counts eligible attendance; `members` counts all
eligible members. Abstentions and silence count only in the latter two denominators. `electorate` still
controls who may cast a ballot. Simple majority requires more than half the selected denominator; qualified
majority requires at least the supplied fraction; unanimity requires every elector's explicit support.
Councils apply the required base on their nested majority rule after restricting eligibility to office holders.
All-member ballots can be remote, but quorum counts eligible attendance. Voting eligibility also controls
proposal eligibility. Councils
restrict membership before applying their nested procedure, with one vote per person even if they hold
multiple offices. For a position-holder procedure, any member of that scope may propose; the named
holder must be present and explicitly support or oppose. These conventions resolve details not stated
in DESIGN §1.3. May's conditions are verified on fully expressed binary ballots; head-count rules with
abstentions are not claimed to satisfy the symmetric binary theorem.

Simple-majority components may explicitly declare `tie_break: { type: "position_holder", role }` or
`tie_break: { type: "lots" }`; omission leaves ties unresolved. A casting holder must be an eligible,
present voter with a decisive ballot. Lots choose equally between acceptance and rejection, consuming
one draw from the caller's `streams.get("society.organisation.collective_choice", org)` only on a tie
after eligibility and quorum checks. Qualified/unanimity rules do not use this override.

`pairwiseCollectiveChoice(input)` takes proposed alternatives in creation order and exactly one ballot
snapshot for each unordered pair. A ballot targets that comparison's `first` proposal: support chooses
first, opposition chooses second. It requires simple majority without a tie-break, returns every pair's
tally, and reports a directed majority cycle as a no-act with a closed cycle witness. Without a cycle,
only a proposal beating every other proposal is returned as the winner; unresolved relations produce
`no pairwise winner`. The helper never supplies an agenda or silently resolves pairwise ties.

Verification: `npx vitest run test/choice.test.ts`. Procedure verification includes hand-worked boundaries,
May's three conditions and a Condorcet cycle. Consequence validation remains D-SOC-1 (DESIGN §3).

## Organisation store (DESIGN §1.2, §2.2–2.3)

`OrganisationStore` owns actor records, membership and observable events. Construct it with `start`,
Kernel `counters`, charter `capabilities`, and synchronous `ledger`/`views` ports. Supply `inventory`
for goods, current `facts` for sponsorship/kinship/occupation/service, and Kernel `streams` for
chartered lots. Adapters implement Kernel `Participant`: snapshots include balances, transfer rows
and notification queues; restore must not throw. No adapter receives authority to edit members or offices.
`get`, `organisations`, `memberships`, `events` and `obligations` return detached observations.

`found(intention, joins, network)` is the only creation entry point (the former `create` seam is removed).
The `FoundIntention` names a unique draft identity in `target` and carries `{ charter, founders, purpose,
businesses? }` in its payload. Every named founder, including the proposer, must express a `join` targeting
that draft. The charter must supply `founding: { window, min_members }`: a positive integer duration in Kernel
milliseconds and a positive integer membership minimum. The host accumulates joins and submits one resolved
attempt; joins must fall within the inclusive interval `[intention.t, intention.t + window]`, never after
the current clock. Incomplete submissions fail with `payload.errors` and `payload.missing`; a resolved draft
identity cannot be reused. Founders must be mutually reachable over existing directed network ties, including
paths through non-founders, with the network advanced to the store's clock. Single founders need no tie.
The draft passes `validateCharter` and current adapter checks before insertion. Declared admission fees are
charged to every founder through the ledger. The Society id, fees, event and `views.onCreated(id)` commit
together. Offices begin vacant and are filled by an election proposal. Founding does not require sponsors or
an admission vote by an organisation that does not yet exist; those admission components apply to later joins.

Call `advanceTo(ctx.t)` from the host's Kernel process before delivering intentions at that time.
No scheduling frequency is invented here: the host supplies its process period. All intervening dues
dates are visited in time/actor/member order. Obligations accrue strictly after joining (no charge
at the exact joining tick). An insufficient balance records unpaid dues without a sanction; a later
`pay` intention identifies `{ component, due_at }` in its payload. An adapter exception rolls back
the entire call, including time, events and transfers, so the host can retry. Attendance obligations
can be fulfilled by attendance later in the same tick.

`attempt(intention, { decision? })` handles join, leave, pay, attend and propose. Admissions combine
all components, querying current facts and current member sponsors. `attend` names `{ activity }`
and must match a chartered meeting time; only attendance in the current tick supplies quorum.
Vote admission requires a `DecisionRequest` with `proposalId`, an actual member's proposal whose
payload is `{ action: "admit", person: applicant }`, and expressed `ballots` targeting that proposal id.
A resolved proposal id cannot be reused, even if a later admission component refuses the attempt.

For `propose`, the attempted intention is authoritative; the decision context supplies the proposal
id and ballots. Payload actions are `act` (also used when action is omitted), `dissolve`,
`elect` with `{ role, person }`, or `sanction` with `{ component, person }`. Elections and sanctions
use their component's procedure; other acts use the charter's decision procedure. There is no
direct leadership or expulsion setter. Malformed transport inputs throw; valid refused attempts
produce events with reasons. A successful choice event means approval; inspect subsequent events
for execution failures such as an unfunded fine.

`claim({ org, person, eventId, event, t })` is a trusted host event ingress, not a member's assertion.
Transfer/loan benefits debit only the organisation's ledger account; goods use inventories. Repeated
event identities cannot pay again, including after a recorded resource failure. Loan repayment terms
remain in the benefit event for the owning adapter; this unit does not implement a credit ledger.
Deliver a death-conditioned claim before `removePerson(person, "death")` if a death benefit is due.
`removePerson(person, "death" | "departure")` removes all memberships and rejects later stale attempts
by that person. Arrival/re-entry policy belongs to the population/migration integration.

`merge(survivingId, sourceId, [survivorDecision, sourceDecision])` requires both current actors to pass
matching `{ action: "merge", survivor, source }` proposals. The survivor retains its charter and offices;
members are unioned and businesses are repointed by `views.onMerged(source, survivor)`. Historical
source obligations stay in the event/obligation record; settlement of claims remains with adapters.
Passed dissolution or the last member's removal calls `closeBusiness` exactly once per pointing
business and `onDissolved(id)`. All lifecycle notifications share the Kernel transaction.

Verification: `npx vitest run test/organisation.test.ts`. Ports are interfaces with stub tests;
real Settlement/Economy integration remains separate work.

## Formation, splits and observer classification (DESIGN §1.4)

Lifecycle algorithms live in `src/formation.ts`; `OrganisationStore` supplies private state access and the
Kernel transaction boundary. `split({ source, successors, choices, cause }, decision)` requires a passed
`{ action: "split", successors }` proposal under the source's current procedure. Successors must already have
been founded by named intentions; the source can be one successor. Every current source member supplies
exactly one current `join` targeting a listed successor or `leave` targeting the source. Transfers to existing
successors check their admission rules, and conflicting overlapping memberships are refused. If an admission
fails, all membership changes and transfers roll back. Vote-based admission requires a separate accepted
join before the split, because this call carries only the source's split decision.

`secede({ source, intention, joins, exits, cause }, network)` records the alternative route: a strict minority
leaves by its own intentions and founds a successor through the same founding checks, without a majority vote.
If founding is refused, the accepted exits remain effective and the failed founding records its errors.
An adapter exception rolls back the whole call. Ordinary separate `leave` and `found` calls remain available.

Both split routes retain causes and source intentions. Their event payload contains `resourceClaims` with
the source, successor ids, source businesses and `status: "unsettled"`. This uses the specification's claims
fallback; Economy and Settlement decide resource allocation. Society creates no balances or inventories.
A split emptying the source also dissolves it. Merger and dissolution use the same lifecycle module and
existing transactional view notifications.

Observers import `classifyInstitution` from `@rex/society` or `@rex/society/institution`. It returns a boolean
from occupied recognised positions with chartered succession, an actually applied sanction, and actually
collected dues or admission fees. An approved but unfunded fine does not qualify. The package barrel
re-exports the observer (DESIGN §1.14 3); no `src/` mechanism imports or reads it.

Classification reads `OrganisationEventPayload.sanctionApplied === true` and a finite positive
`revenueCollected` amount, independent of human-readable `cause`, approval tallies or payment status text.
Successful fine/suspension/expulsion applications emit the flag; successful dues and admission-fee transfers
emit the amount in the same transaction. Founding revenue totals all founders' fees, while a joining event
records that joiner's fee. The older `admissionFeeCollected` field remains the per-person admission fee for
existing consumers; it is no longer classification evidence. Failed operations emit neither evidence field.
Lifecycle forwarding in `formation.ts` uses the same typed payload contract. Logs predating these fields need
typed evidence supplied by their producer to qualify; cause strings are never a fallback.

Verification: `npx vitest run test/formation.test.ts test/institution.test.ts`. Tests check the creation
boundary, founding consent/window/network, fees and rollback, split/merger membership conservation, and
identical traces under true/false classifier stubs. Liability of newness and density dependence remain
D-SOC-1 validation yardsticks; no empirical validation is claimed here.

Verification of the five keeper rulings: `npx vitest run test/rulings.test.ts`. This includes a seeded 30-day
check of rate-hours and realised offered hours on each kernel day, plus active-kind decay transitions.

## Social offers (DESIGN §1.13, §2.2 / IF-46)

`offers(person, t, state)` is the read-only projection for `society.affordance.offer`, the single writer of
`society.affordance`. Supply current organisation records (including membership), unpaid obligations,
attendance, pending proposals and founding circles, directed known-person pairs and network ties, a ledger
balance reader, current admission facts, and unavailable persons. Advance the owning stores to `t` first.
The host owns pending intention collections and marks resolved proposals/circles; this function caches nothing.
Results name their source row and identity, retain its terms, and carry action arguments in `payload` where
needed. Records are detached and emitted in numeric mint order within each source collection.

Admission components are conjunctive; a vote requirement offers an application without predicting approval.
Members can leave and pay actual unpaid dues, while active members can attend scheduled meetings, propose
under chartered procedures, and express eligible ballots on open proposals. Quorum and collective outcomes
remain attempt-time checks. A generic `found` candidate targets the formation process until the caller supplies
a fresh draft identity, charter, named founders and purpose; it never creates a draft or actor. Founding joins
name an open circle within its window. Contact seeking targets known persons (including incident tie endpoints);
the caller supplies explicit kind and exposure arguments when invoking the network. Avoidance names an outgoing
tie. Household and migration extension functions are typed but return nothing because those mechanisms are unbuilt.

Offering is not choosing. Cognition chooses an intention, and `OrganisationStore.attempt` checks current true
state again. The host must deliver charter knowledge separately through observations/testimony; descriptive
offer terms do not establish what a mind knows. Verification: `npx vitest run test/affordance.test.ts`, including
offer → stub choice → admission and a stale offer refused after the applicant can no longer pay.
