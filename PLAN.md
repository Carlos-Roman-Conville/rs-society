# Society: PLAN.md (Society keeper, successor, 2026-11-02; draft in HQ, not approved)

Consolidates `Toolchain/society/DESIGN.md` (approved, Rex 2026-10-31) per `HQ/handoffs/PLAN-SPEC.md`. DESIGN.md stays
as reference; this file cites it as `D§n`. Paths below are relative to `Toolchain/society/` unless stated.

## Pass 1 (one page)

**Mechanisms present (implemented, unit-tested; connected only to the D-SOC-1 bench host, never to live engines).**
Network `society.network.communication` (`src/network.ts:101` `CommunicationNetwork`: Poisson contacts, saturating
strength, half-life decay, hours limiter `:315`, `:454`). Organisation store `society.organisation.actors`
(`src/organisation.ts:86`; `attempt` `:297`, obligations `advanceTo` `:429`, benefit `claim` `:473`, `removePerson`
`:598`). Collective choice (`src/choice.ts:121`, pairwise `:229`; open proposals `src/open-proposals.ts`).
Formation/split/merge/dissolve (`src/formation.ts:39,195,241,181`). Charter validator (`src/charter.ts:9,223`) and
27 reference charters (`data/charters/reference.json`). Amendment (`src/amendment.ts`). Affordance offer
(`src/affordance.ts:117`). Payment acceptance (`src/acceptance.ts:36`). Institution classifier (`src/institution.ts:9`).

**Mechanisms missing.** Households and kinship `society.household.structure` (D§1.6: `householdOffers` is a stub
returning `[]`, `src/affordance.ts:65`; kinship is a host port, `src/ports.ts` `OrganisationFacts.kinship`).
Collective action (D§1.5). Demography (D§1.7, DUP-41). Migration (D§1.8; stub `src/affordance.ts:66`). Norms and
sanctions (D§1.9). Religion/doctrine (D§1.10). Class measure (D§1.11). The post-P7 rows (D§1.12).

**Quantities owned.** `society.comm_network`, `society.organisation`, `society.membership`,
`society.organisation_event`, `society.meeting_attendance`, `society.affordance`, `society.payment_acceptance_share`
(built); `society.household`, `society.kinship`, `society.population`, `society.collective_event` (designed).
All are counts, memberships, records or invariants; Society owns no mass, energy or money (`kernel.json`).

**External inputs.** `mind.intention`, `mind.episode` (Cognition); `settlement.assignment`, `post_holder`,
`post_filledby`, `labour.hours_assigned`, `balance_changes` (Settlement); `economy.events`, `contract.have` (Economy);
`body.crisis`, `body.medicine_outputs` (Life); `contract.available_hours` (host-composed). All via `kernel.json`.

**Outputs.** Contact opportunities and ties (Cognition encode, Reality transmission, K&T); affordances and outcome
events (Cognition); organisation ids (Economy and Settlement views, DUP-58); household ids (Economy budget view,
DUP-59; Settlement residence; Life birth placement).

**Contribution to M1a.** Small but real: the **household** is the owner of the food within reach. Society supplies
the household id and its member list; Economy's inventory under that id is the larder, Settlement's residence the
place, Life the body that eats. Society moves no food. M1a needs a minimal `household.structure` (membership by
event, one household per person, death removes a member) and a `HouseholdId` account kind, which `AccountId`
lacks today (`src/ports.ts` `AccountId = OrgId | PersonId`; confirmed gap, SOC-21). Economy and Settlement have
no household code at all (grep of both `src/` trees: no match).

**File-level evidence of host-supplied values.** Network parameters in the bench are unsourced fixtures
(`bench/d-soc-1/fixtures.ts:71`: λ0, α, half-lives); household purse, hazards and harvest are fixtures from
`data/fixtures/village/economy.json` with 9 required rows null; the sourced bench refuses (`bench/d-soc-1/REPORT.md`:
every D line "not demonstrated", 0/150 runs).

**Flagged assumptions.** Keeper rulings D§1.14–§1.18 (level 4): longest-half-life decay, latest observation decides
acceptance, meetings summon members. Open to Rex: **SOC-R1** (sources or labelled assumptions for the 9 rows)
blocks D-SOC-1, i.e. **M5**; **SOC-R2** (founder-chosen amendment quorum) blocks D5, **M5**; **DUP-60** (Reality's
agreement to the one network) blocks K&T diffusion and Cognition messaging on Society's ties, **M5** (M1a–M4 need no
network). **SOC-R4 answered (Rex, 2026-11-02):** each household carries a declared ownership-and-access
arrangement; on a death stock is preserved, unresolved claims recorded, nothing redistributed, no survivor's access
withdrawn (§3 H6). The M1a test household (England 1270, cereals, CAT-13) is declared `collective`. **SOC-R3** (who may
draw under a real culture's custom) stays open and blocks custom-governed households (historical runs, **M5**).

**Next dependency-ready task.** CP-1 (§8.2): cards SN-1, SN-2 and SN-3 (§8.4), and their Economy, Settlement and Life
interfaces (household id as holder, `HouseholdId` in `AccountId`, an injected death event). Not queued (planning
phase). The review of the built network and organisation code runs in parallel at CP-3 (§8.3) and blocks nothing.

---

## Pass 2 (the full plan)

Labels: **(Rex)** Rex's decision; **(keeper)** the keeper's ruling inside the approved design; **open SOC-Rn** asked
of Rex. Evidence levels are PLATFORM §4 (1 law … 6 fiction); PLAN-SPEC's four labels map as **measured** = 1–2 with a
source read, **calibrated estimate** = a value fitted to independent data, **assumption** = 4–5, **fiction** = 6.
"Confirmed" = a defect with a reproduction; "risk" = not yet reproduced.

### §1 Purpose and boundaries

**Determines.** Who can meet whom (the one network); which organisations exist, who belongs, what they decide; which
household each person belongs to and who is kin; the population as a social fact (who exists where, in which
household, by age and sex); social events (collective action, migration as a move, sanction acts); the social
actions open to each person now (affordances). **Principle (Rex-approved, SOC-Q1): Society acts on what people do,
never on what they think** (D§0): inputs from minds are intentions and episodes; outputs to minds are opportunities and
observable events.

**Receives** (§4 has the full table): intentions and episodes (Cognition); residence, posts, co-presence, balances
(Settlement); exchange and refusal events, holdings (Economy); births, deaths, illness, incapacity, labour supply
(Life); available hours (host-composed); culture-profile seeds (Catalogue, read once at initialisation).

**Never calculates** (D§0 table, carried forward unchanged): a decision, belief, trust or meaning (Cognition); any
hazard, birth or death rate, nutrition or physiology (Life); a physical channel or travel time (Reality); money
balances, titles, buildings, posts (Settlement); stock, price, wage, consumption, budget (Economy); law, enforcement
over non-members, inheritance where law exists (Government, SOC-Q3); the collective knowledge stock (K&T, SOC-Q7); any
yardstick or record (History). Society moves **no** mass, energy or money: every such move is one transfer by its
owner, which Society's event joins in one kernel transaction (`src/ports.ts` `LedgerPort`, `InventoryPort`).

### §2 State

Conservation class: **C** = count with an accounting identity; **I** = record with invariants and update rules;
**V** = stateless view (recomputed, never stored as authority).

| Quantity | Unit | Range | Meaning | Class | Built |
|---|---|---|---|---|---|
| `society.comm_network` tie `(i→j, kinds[], w, λ, t_last)` | `w` 1; `λ` contacts·d⁻¹; `t` ms | `w`∈[0,1]; `λ`≥0; `Σ_j λ_ij·d ≤ H_i` | who can reach whom and how often | I | yes |
| `society.organisation` `{id, founded_at, members, rules, positions, schedule}` | record | ≥1 member while extant | a record of commitments among people, not a mind | I | yes |
| `society.membership` person→orgs | count | members(t+1)=members(t)+joins−leaves−deaths−expulsions−departures | | C | yes |
| `society.organisation_event` | record | append-only | founded, joined, left, act, dissolved, … with cause | I | yes |
| `society.meeting_attendance` `{org, person, activity, t}` | record | only from an `attend` intention | | I | yes |
| `society.affordance` | record set | — | social actions open to a person now, with terms | V | yes |
| `society.payment_acceptance_share` | 1 | [0,1] or null | share of observed members whose latest observation is a take | V | yes |
| `society.household` `{id, members[{person, joined_at, via}], residence_ref, formed_at, dissolved_at, custom_ref}` | record | the relation represented is declared per household (here: co-resident domestic group); one per person **in the CP-1 fixture only** | a declared household relation, not the universal definition of family or residence | I | **no** |
| `society.household_membership` person→household | set | `M_{t+1} = (M_t ∖ L_t) ∪ J_t` over identified events; fixture: Σ = living persons | | C | **no** |
| `society.kinship` `{person, relative, relation, since}` | record | relation ∈ {parent, child, sibling, spouse, affine}; parent/child only from Life birth events or the t0 fixture | kin as a graph | I | **no** (host port) |
| `society.population` by place, age, sex, household | count | `P(t+1)=P(t)+B−D+I−E` exact | the population as a social fact | C | no |
| `society.collective_event` `{id, action, target, place, time, participants, organisers}` | record | ≥2 participants who each intended it | | I | no |
| `society.household_arrangement` `{household, kind, terms}` | record | kind ∈ {collective, individual_shared, shares, declared}; declared at t0, labelled a test arrangement | who owns and who may use the household's holdings | I | no (new, §3 H6) |
| `society.claim` `{claimant, holding_ref, basis, recognised_by[], t}` | record | only from a person's or organisation's own act | a recognised claim, distinct from possession, entitlement and enforcement | I | no (new, §3 H6) |
| descriptive measures (degree, clustering, prevalence, class, institution label) | 1 or count | — | for observers and History; **read by no mechanism** | V | partly (`classifyInstitution`) |

**What a household owns and shares.** Society owns only the household's **identity, membership, kinship and custom
reference**. What it *shares* lives with the owners, keyed by the household id: the **stock** (an Economy inventory
whose account is the household id: larder, seed, fuel), the **purse** (a Settlement ledger account with `holder` =
household id; `settlement/src/money-ledger.ts:8-10` keys accounts by an opaque holder string, so Settlement needs no
change), the **dwelling** (Settlement `assignment` rows of kind `residence`, one per member, all targeting one
building; `settlement/src/commands.ts:563-571`). Members' **personal** holdings stay under their own person accounts.
Which account an acquisition credits is the acquiring person's own act (Cognition chooses among accounts it may
credit); Society neither pools nor splits.

### §3 Mechanisms (each a complete chain: source → computation → what it changes)

**N. Network** `society.network.communication` (D§1.1, §1.14.4–5). Exposure (Settlement shared hours; household and
kin links from H; co-membership attendance; trade from Economy exchange events) → `λ_ij = Σ_k λ0_k·x_ij,k`, capped so
`Σ_j λ_ij·d ≤ H_i` (`contract.available_hours`) → Poisson contact events on the kernel clock (per-tie RNG stream) →
Cognition decides whether to communicate; a completed `mind.episode` sets `w ← w+α_k(1−w)`; between events
`w ← w·2^(−Δt/T)`, `T` the longest half-life among kinds held → ties below `w_min` with no structural exposure are
removed → changes who meets whom next (every content type at once). Stops applying: contact duration, several places
per contact, group conversations (one pair per event). Parameters `λ0_k, α_k, T_k, w_min`: **null** in the engine
(refuses); the bench uses unsourced fixtures (`bench/d-soc-1/fixtures.ts:71`), flagged.

**O. Organisation store** `society.organisation.actors` (D§1.2, §1.2a, §1.18). Intentions (join, leave, pay, attend,
claim) and choice results → `attempt` checks the act against true state (admission component, balance via
`LedgerPort`, hours) → one kernel transaction commits the membership/office change with any ledger or inventory
transfer → `organisation_event` to members (perceived as outcomes) → changes next affordances and network exposure.
Obligations fall due in `advanceTo`; an unpaid due is recorded, never sanctioned automatically. Stops applying:
organisations as members of organisations (open, not designed).

**C. Collective choice** (D§1.3, §1.14.2, §1.15.2). Proposal intention + support/oppose/abstain of eligible attendees
over the open interval → the charter's procedure (position holder; majority with required base `cast|present|members`;
qualified majority; unanimity; council) with quorum → act, recorded no-act (no quorum; a tie under a declared "tie → no act" rule) or **unresolved** (a tie, or a
chair with no casting choice, where the procedure is silent; agreed with Government 2026-11-02, superseding DESIGN
§1.14.2's "absent tie-break means no-act", since silence is not a rule) → O commits acts only. **Single owner of the voting arithmetic (controller ruling DC-16 /
SOC-23, 2026-11-02; Rex may override): Society's `collectiveChoice`. Government calls it; SOC-Q3 unchanged.** Level 1 (May 1952) for the rules' properties; which rule a body uses is charter data.

**F. Formation, split, merger, dissolution** (D§1.4, §1.14.3). `found` with a valid draft charter + founders' `join`
within `founding.window`, at least `founding.min_members`, all founders reachable on N → founded, or failed with the
missing intentions; split, merger, dissolution by passed C acts or loss of all members → views notified
(`ViewsPort.onCreated/onMerged/onDissolved/closeBusiness`). Institution label computed for observers only.

**A. Affordance offer** (D§1.13, §1.18, IF-46). Society state (charters, membership, meetings, founding circles,
balances) → the union of social actions each source permits a person now, with terms → Cognition's candidate port;
re-checked at attempt (IF-46 A). Extension points: households (`src/affordance.ts:65`), migration (`:66`).

**P. Payment acceptance** (D§1.17). Exchange and refusal records in a window, group membership (org, household or
residence set) → share of observed members whose latest observation is a take; null when unobserved → a view for hosts
and reports; never fed to minds.

**H. Households and kinship** `society.household.structure` (D§1.6; outstanding, planned fully here).
- **H1 Initial assignment.** At t0 the host supplies households from a scenario fixture (persons, kin relations,
  residence building) or a Catalogue culture-profile seed; Society validates (in the CP-1 fixture, every living person in exactly one
  household, a fixture constraint, not a universal one; temporary physical absence never ends membership; every member's residence assignment targets the household's building; kinship consistent: parent↔child
  symmetric, no person their own ancestor) and refuses to start on any violation.
- **H2 Birth.** Life's birth event `{child, mother, father?}` → the child joins the household the custom in force
  names; until custom content exists (S not built) the approved design's stated rule applies (D§1.6: "birth into the
  mother's household (or by the custom in force)") → kinship parent/child, siblings from shared parents → network
  household and kin ties (`src/network.ts:191`) → Economy and Life see a new member of the household id. No births in
  M1a–M2.
- **H3 Death and departure.** `body.crisis` resolved `died` → member removed from household and organisations
  (`removePerson`), ties cut (`cutPerson`), kinship rows kept → H6 for holdings → a household with no living member
  dissolves (event with cause). A departure (residence change outside the household's building) is a migration act (M).
- **H4 Union.** A `marry`/`cohabit` intention, accepted by the other's intention, recognised under the custom in force
  (custom is content, S; Government's law where it exists, SOC-Q3) → spouse and affine rows → residence by custom (join
  one household, or found one via H5). No free residence → union recorded, couple stays put, flagged (D§1.6).
- **H5 Fission.** A member's `found_household` intention, accepted if the member's own Settlement `assign` of kind
  residence succeeds and the owners' own checks pass (rent a ledger transfer, stock an Economy transfer); Society
  commits the new household in the same kernel transaction as the assignment, or nothing.
- **H6 Death and holdings (Rex, 2026-11-02, SOC-R4).** Stock is never frozen as a rule. Each household carries a
  **declared ownership-and-access arrangement** (`society.household_arrangement`, scenario data, labelled as a test
  arrangement, never a universal inheritance rule): `collective` (owned by the continuing household), `individual_shared`
  (individually owned, shared in use), `shares` (explicit individual shares), or another declared arrangement with its
  terms. On a death: the stock is **preserved where it is** (no transfer); any individual claim the arrangement leaves
  unresolved is **recorded** as a claim record; **nothing is redistributed automatically and no survivor's existing
  access is withdrawn**. Where continued access depends on a custom not yet represented, the run flags the limitation
  in its trace. A placeholder may never manufacture starvation by silently adding a property rule.
  - **M1a test household (declared): England 1270, cereals (CAT-13); arrangement `collective`.** The stock (grain,
    bread, pottage ingredients) is an Economy inventory held by the household id; every member's access comes from
    membership; a death removes the member and changes nothing about the stock or the survivors' access. Limitation
    flagged: actual 1270 access after a death turned on manorial custom (widow's free bench, heriot, the lord's
    claims), which is not represented; the result says so and claims nothing about it.
  - **Four facts, never merged (Rex, 2026-11-02).** (1) **Possession or access**: holdings executed by Settlement
    (ledger, titles) and Economy (inventories); Society's arrangement says who in a household may use them.
    (2) **Recognised claim**: `society.claim` `{claimant, holding_ref, basis, recognised_by[], t}`, written only from a
    person's own claim act or an organisation's act (Cognition decides to claim; others' recognition is their act).
    (3) **Entitlement**: under a **custom**, Society's evaluation of custom content held by people and organisations
    (customs exist without a state); under **law**, Government's evaluation. Two separate records, never one.
    (4) **Enforcement or challenge**: Government's institutional enforcement chain; outside it, sanction acts by people
    (S). A seizure happens only when someone perceives the opportunity and chooses it (Cognition); its physical
    outcome is Reality's and Life's. Government's office succession is not household inheritance.
  - **Custom-versus-law split (agreed with the Government keeper, 2026-11-02, three messages).** (1) Society: kinship,
    custom content held by people and organisations, household arrangements, `society.claim`, the
    entitlement-under-custom record. (2) Government: law (custom becomes law only by a GOV-Q6 recognition event), the
    entitlement-under-law record (separate, never merged), adjudication, enforcement; reads `society.kinship`, never
    writes it. (3) The Blackstone canons are one algorithm with two callers: `government.property.regime` for a holding
    (names the "heir at law", the person entitled, not the one who receives) and `succession.institutional` only where
    an office's own law makes it descend as land (still emitting `settlement.appoint`, DUP-62). Today the canons sit
    inside office succession (`government/src/succession/succession.ts:117, :299–303`), keyed by office id: Government's
    integration work. (4) Settlement and Economy execute every transfer, on command only; nothing transfers at a
    death; any other transfer follows a claim act and, where one exists, adjudication. (5) Precedence is SOC-Q3 (Rex):
    neither engine computes it in advance; Government lists every applicable law set, and "law where enforced" is read
    afterwards from violations that reached `sanctioned`. **Custom ids:** `custom:<holder>:<name>` (holder = the Society
    organisation or community carrying it): `heriot`, `merchet`, `free-bench`, `descent`. Government's heriot and
    merchet law fixtures (`government/data/laws/heriot.json`, `merchet.json`, issuer `authority.manorial-custom`) cite
    them by id and never copy them. They are records of S, which is not built yet.
- **H7 Access to the shared stock (an authorisation, never a transfer).** `mayDraw(person, household, good, t)` reads
  the household's declared arrangement. Its `terms` may carry explicit **permit** and **deny** entries `{who: person id |
  members | non-members, good: id | any, window?}`; a matching deny gives `unauthorised`, a matching permit
  `authorised`, no matching entry `unjudged`. **Non-membership never makes a take unauthorised by itself**; only a
  declared deny does (IT-M1a-7 rev 3, 2026-11-02). Detection and punishment are separate acts (S, Government).
  Kinds supply the default permits: `collective` → any member; `individual_shared` → the owner, or another member
  where the arrangement declares shared use; `shares` → up to the declared share. A **one-member household** keeps its household account: household identity never turns into person identity when
  membership reaches one. Output is three-valued, `authorised | unauthorised | unjudged` (Economy's contract), and is
  **not physical success**: an unauthorised draw does not prohibit a separate, physically possible taking attempt,
  which Cognition chooses and Reality/Life resolve. The general rule for real households (who may draw under a culture's custom) stays
  **open SOC-R3**; the declared arrangement is a test arrangement, not an answer to it. Eating is one
  transfer, Economy's inventory debited and Life's body credited, executed by the owner the registry names; Society
  only answers `mayDraw` at attempt time.
- **H8 Affordances.** `householdOffers` (stub) offers marry, found household, leave, take in a person, and draw from
  household stock where `mayDraw` holds, with terms; re-checked at attempt.
- Rate limiters: housing (Settlement), budget (ledger, Economy), the other party's acceptance. Failure modes: no
  residence → recorded, flagged, never an invented parcel; a birth or death with no household → hard error; a member
  whose residence assignment points elsewhere → integrity error naming both, never silently re-pointed.

**K. Collective action** (D§1.5). Coinciding `participate(action, target, place, time)` intentions (≥2) with
co-location from Settlement → `collective_event` → effects resolved by the target's owner (Economy for a seized store,
Government for a petition, Life for injuries). No grievance quantity anywhere.

**D. Demography** (D§1.7, DUP-41, SOC-Q4). Life's birth and death events and M's moves → counts by place, age, sex,
household → identity checked every step (G1); coarse cohorts via kernel `Resolution`, `count` conserved (tolerance
0). Moves from `realism/src/population.ts` only when the Life keeper agrees.

**M. Migration** (D§1.8; corrected by the 2026-11-02 review, §8). Intention → travel attempt and progress (Reality's
movement state: origin, destination, progress; Society keeps no second one) → arrival or interruption → only then
residence and membership changes. Location, residence and membership are separate and need not change together; a
household head's intention never moves another body (the scenario declares how dependants take part). On arrival
Society commits the move as a social event: household kept whole unless members chose otherwise, memberships ended or kept per charter, ties
re-kinded (neighbour ends, kin persists with lower exposure) → Settlement residence at the destination (one
transaction) → N changes who meets whom. Replaces `realism.population.migration`.

**S. Norms and sanctions** (D§1.9). A sanction is an event: gossip is content on N; exclusion a C act or a dropped
tie; punishment a person's intention. Prevalence measure for observers only. Custom content (birth residence, union
residence, heirs) is carried here; contract completed before its unit.

**R. Religion and doctrine** (D§1.10). A community is a view of O; a doctrine a record carried as content on N,
changed by copying error per re-encoding, split by schism (F). After D-SOC-1.

**L. Class** (D§1.11, SOC-Q5). Computed from state for observers and History; never stored, never read.

**Superseded in DESIGN.md.** D§3 "a labelled fixture household budget until P5" and "labelled fixture hazards until
P3" are superseded by D§1.16 (sourced stand-ins or refusal). D§6 (first units) is done. D§1.6's "an institution, a ship
or a barracks is a household-like residence, open" stays open (not needed before M5).

### §4 Inputs and outputs

| Quantity | Producer → consumer | Unit, range | Timing | Failure / rollback |
|---|---|---|---|---|
| `mind.intention` (social kinds) | Cognition → O, C, F, H, K, M | record | at the decision step | refused at attempt as an outcome event; nothing committed |
| `mind.episode` | Cognition → N | record | after a contact | absent → no strengthening |
| `contract.available_hours` | host (`body.hours_awake` − post hours) → N | h·d⁻¹, [0,24] | per kernel day | missing → N refuses |
| `settlement.assignment` (residence) | Settlement → H, N, M | record | on change | member/residence mismatch → integrity error |
| `settlement.post_filledby`, `labour.hours_assigned` | Settlement → N | h·d⁻¹ | daily | absent → only kin and household ties, flagged |
| ledger (`balance_changes`) | Settlement ↔ O, H5 | money | inside Society's kernel transaction | transfer throws → whole act rolled back |
| `economy.events`, `contract.have` | Economy → P, N, O | record; count | per exchange | non-finite day → P refuses |
| inventory under a household id | Economy ↔ H7 (authorisation only) | count by good | at the draw attempt | a declared deny → `unauthorised`; no matching entry or no arrangement → `unjudged`; neither blocks a physical attempt; Economy records the value (EN-3) |
| `body.crisis` (died), birth events | Life → H, O, D, N | record | when resolved | death with no household → hard error |
| `body.medicine_outputs` (illness onset) | Life → O (benefit claims) | record | on onset | — |
| culture-profile seed | Catalogue → H1, S | record | t0 only | missing → labelled scenario fixture, or refuse |
| `society.household` (id, members) | H → Economy (budget view, DUP-59), Settlement (account holder), Life (birth placement), Cognition (via affordances) | record | on change | consumers keep no second member list (DUP-59 test) |
| `society.comm_network`, contact opportunities | N → Cognition encode, Reality transmission, K&T | events | event-driven | — |
| `society.affordance` | A → Cognition | records | on request | refuses naming the missing fact |
| organisation and collective events | O, K → Government, History, Economy/Settlement views | records | event-driven | — |

**M1a–M2 contract with Economy and Settlement (three messages, before any unit):** (1) a household id is a valid
`holder` on Settlement's ledger and a valid inventory account on Economy's; (2) Society's `AccountId` gains
`HouseholdId` (SOC-21, confirmed: `src/ports.ts` `AccountId = OrgId | PersonId`); (3) Economy keeps no member list and
asks Society; (4) eating debits the household inventory and credits the body once, owner named by the registry (risk
SOC-22: Economy's market-level consumption, `economy/src/commands.ts:40` `perCapitaPerDay` and the `consumption` tick in
`economy/src/config.ts:26`, would consume the same food again if both paths run).

### §5 Evidence

| Item | Source | Label |
|---|---|---|
| tie strength, weak ties | Granovetter 1973 | measured (2) |
| decay by kind; kin slower | Burt 2000; Roberts & Dunbar 2011, 2015 | measured direction; **max-half-life rule: assumption (keeper)** |
| contact rates by setting | Mossong et al. 2008 | measured for modern populations; historical use an assumption; values not yet read |
| bench network parameters | `bench/d-soc-1/fixtures.ts:71` | **assumption, unsourced; never a result** |
| majority-rule properties | May 1952; Arrow 1951 | law (1) |
| procedures, charters | 1388–89 returns (Toulmin Smith 1870); Rosser 2015; Ogilvie 2019 | observation (3); 27 reference charters, `source_silent` nulls kept |
| founding and mortality of organisations | Hannan & Freeman 1977, 1989; Freeman et al. 1983 | measured (2); yardsticks only |
| membership duration | Popielarz & McPherson 1995 | measured sign (2) |
| collective action | Granovetter 1978; Kuran 1991; Thompson 1971; Bohstedt 2010 | model (4) / observation (3) |
| household size, composition | Laslett & Wall 1972; Ruggles 2012 | observation (3); validation only, never coded |
| household formation systems | Hajnal 1965, 1982 | observation (3) |
| birth into the mother's household | D§1.6 (approved design) | assumption until custom content exists |
| declared household arrangement; preserve on death, no redistribution | Rex 2026-11-02 (SOC-R4) | declared test arrangement (assumption, labelled) |
| 1270 access after death (free bench, heriot) | not represented | limitation flagged in every M1a trace |
| access under a real culture's custom | none read | open SOC-R3 |
| village budget, illness, mortality, harvest | `data/fixtures/village/economy.json`, SOURCES.md | measured where filled; **9 rows null** (SOC-R1) |
| demography | Wrigley & Schofield 1981; Wrigley et al. 1997; Coale & Demeny 1983 | measured (2–3) |
| migration | Ravenstein 1885; Harris & Todaro 1970; Massey et al. 1993 | (2–3) |

### §6 Status

D designed · I implemented · C connected (to a live engine through registry ports, not a bench host) · N numerically
checked (verification tests) · V empirically validated.

| Mechanism | D | I | C | N | V |
|---|---|---|---|---|---|
| N network | yes | yes | bench host only | yes (`test/network.test.ts`) | no |
| O organisation store | yes | yes | bench host only | yes (`test/organisation.test.ts`) | no |
| C collective choice | yes | yes | bench host only | yes (`test/choice.test.ts`) | n/a (a rule) |
| F formation etc. | yes | yes | bench host only | yes (`test/formation.test.ts`) | no (D6 not demonstrated) |
| charter validator | yes | yes | — | yes (`test/charter*.test.ts`) | n/a |
| A affordance offer | yes | yes (household, migration stubs) | bench host, Cognition baseline (`@rex/cognition` dev dependency) | yes | n/a |
| P payment acceptance | yes | yes | no live Economy feed | yes (`test/acceptance.test.ts`) | no |
| H households, kinship | **yes (here)** | no | no | no | no |
| K collective action | yes | no | no | no | no |
| D demography | yes | no (lives in realism) | no | no | no |
| M migration | short | no | no | no | no |
| S norms, R religion | short | no | no | no | no |
| L class | yes | no | — | — | n/a |

Last recorded suite: 862 pass, 2 skipped, tsc clean at 679abe7 (not rerun in the planning phase). D-SOC-1 sourced:
refused, 0/150 runs (`bench/d-soc-1/REPORT.md`).

### §7 Validation

| Mechanism | Verification (with every unit) | Validation (periodic, independent data; tolerance) |
|---|---|---|
| N | Poisson counts vs λ (χ², p > 0.01 over ≥10⁴ events); `w` halves at `T` (1e-9 relative); a cut tie stops all content | degree and kin share vs Hill & Dunbar 2003 (reported; tolerance from the source's spread); clustering above a random graph of equal density (sign); homophily emerging (sign) |
| O, C, F | membership identity exact; one id across three engines; procedures on hand-worked ties, quorum failure, cycles | D-SOC-1 D5–D6 signs vs Hannan & Freeman, Freeman et al., Popielarz & McPherson, van Leeuwen 2016; reported, never tuned |
| H | in the CP-1 fixture each living person in exactly one household (exact); membership identity exact; kinship symmetric and acyclic; residence agreement; one draw = one transfer (Economy debit = Life credit, kernel `transfer()` records); replay-exact; no member list outside Society | household size distribution and complex-household share vs Laslett & Wall for the reference region (reported, H1 development only); marriage age vs Wrigley et al. 1997 once H4 runs on minds |
| K | an event only from ≥2 coinciding intentions | food-related event rate rises after a grain-price shock (sign; Thompson, Bohstedt) |
| D | `P(t+1)=P(t)+B−D+I−E` exact; Resolution conserves count | age structure within 15 % total-variation distance of the source over 100 years (P6 test 1) |
| M | persons conserved; households whole unless chosen | sign of the wage or food differential (P6 test 2) |

Held-out rule: H3 Greenland and H4 Copán never set a Society parameter. A failed yardstick opens a SOC- issue, never a
tuning pass. Each validation unit is paired with a Haiku check unit that did not write the code.

**Paired M1a–M2 configurations on the household (PLAN-SPEC §4):** provisioned (the stock suffices; the person eats;
satiety changes the next decision) and deprived (stock falls through the stated intermediate states; at death H3
removes the member, the stock stays and the survivors keep their access (H6); the outcome is recorded, never tuned). Society's checks in both:
membership identity, one draw = one transfer, no second member list, replay-exact.

### §8 Build order: ten lanes, five checkpoints (review 2026-11-02; all after Rex lifts the STOP and approves)

Society's job is to represent social structures and interaction opportunities. It never decides what people feel
and never guarantees what they do. Cognition decides what people attempt; Reality, Life, Economy and Settlement
decide what an attempt achieves. **Society's narrow M1a contribution is the household fixture and its sharing
arrangement.** Kinship development, migration, voting, religion and network calibration do not block the first
eating loop. Lanes that are exact rules (membership, procedures) use exact accounting, not fitted equations. For
those lanes, "realism" means the meaning and completeness of the inputs and evidence that the represented body
used the rule.

**8.1 Lanes.** Each lane gets one seven-item card: question, boundary, model, evidence, functional tests, realism
tests, connection test.

| Lane | Owns | First acceptance case | Plan § |
|---|---|---|---|
| SN-1 population and membership | membership records; population views derived from authoritative events | birth, death, joining and departure each change counts exactly once | §3 D, O |
| SN-2 households and kinship | household identity, membership, declared arrangements, kinship | a two-person household keeps its stock and the survivor's declared permissions after one member dies | §3 H |
| SN-3 claims, customs and authorisation | who claims, who recognises, what a declared arrangement permits | permission, physical access, possession and legal entitlement stay distinguishable | §3 H6–H7 |
| SN-4 contact opportunities | social exposure and opportunities to interact | opportunities respect both participants' time and need physical channel resolution | §3 N |
| SN-5 social ties and interaction history | the declared network measure `w`, updated by interactions | repeated interaction changes `w` without raising trust or affection | §3 N |
| SN-6 organisations and obligations | joining, leaving, offices, dues, lifecycle | membership and its payment commit together or both roll back | §3 O, F |
| SN-7 collective procedures | votes, quorum, outcomes, authorised decisions | hand-worked ballots give the charter's result, including abstentions and no quorum | §3 C |
| SN-8 social opportunities and collective action | offers to take part; records of coordinated participation | an offer is not a decision; a collective decision is not a completed physical act | §3 A, K |
| SN-9 migration and household transitions | residence-related membership and connection changes | interrupted travel neither teleports a household nor duplicates its members | §3 M, H4–H5 |
| SN-10 social transmission and descriptive measures | custom and doctrine records; observed statistics | content reaches minds through communication; a statistic never becomes anyone's belief | §3 S, R, P, L |

**8.2 Checkpoints.**

| CP | Scope | Lanes | M |
|---|---|---|---|
| CP-1 household accounting | seeded membership, declared arrangement, stable household account, injected death and departure, replay; no network | SN-1, SN-2, SN-3 | 1a |
| CP-2 shared-food integration | two people, one stock; permission separate from physical access; one transfer per meal; the survivor under the declared arrangement | SN-2, SN-3 + Economy, Life, Reality, Kernel | 1a–2 |
| CP-3 social interaction and organisation | contact opportunities, perceived offers, joining, obligations, procedures; review of the existing equations | SN-4–SN-8 | 5 |
| CP-4 household transitions and migration | formation, splitting, travel-dependent change | SN-2, SN-9 | 5 |
| CP-5 wider social dynamics | customs, doctrine transmission, collective action; independent validation of network and organisations | SN-8, SN-10 | 5+ |

CP-1–CP-2 are the first deliverable. CP-3's review of the built network and organisation code runs in parallel and
blocks nothing on the M1a path. D-SOC-1 (SOC-R1, SOC-R2) belongs to CP-3; demography (DUP-41) and migration to CP-4.

**8.3 Review findings carried into the lanes (2026-11-02).** These are findings, not reproduced defects, except
where a line is cited.
1. **Membership is sets and events** (SN-1): `M_{t+1} = (M_t ∖ L_t) ∪ J_t`, with `L_t` the unique leavers under the
   declared event order. A death followed by administrative removal is one departure, not two. Population
   `N(t+Δt) = N(t) + B − D + I − E`, with B and D from Life and I and E from completed boundary crossings. Society
   computes no demographic rate for people simulated individually.
2. **Household relation is declared** (SN-2). One household per person is a CP-1 fixture constraint, not a universal
   rule. A child can have two parents, one guardian, two residences and support from several households; the
   contract names which relation a household record represents. Temporary absence does not end membership.
3. **Obligation, affection and support are three things** (SN-2, SN-3). Society records declared obligations and
   recognised rules. Cognition holds how people feel about them and what they choose. Economy records the material
   support actually given.
4. **Rule, practice and expectation stay separate** (SN-3, SN-10). An explicit arrangement or institutional rule is
   declared or adopted by a recorded act. Observed practice is what people do (an SN-10 measure). Normative
   expectations are held by minds (Cognition). A statistical majority never becomes an obligation. Not every
   customary expectation needs a formal adoption event; informal norms live as practice plus held expectations. For
   CP-1 the arrangement is an explicitly declared fixture, and custom formation is deferred.
5. **Contact rates carry units per kind** (SN-4). In `λ_ij = Σ_k b_k x_ij,k` (contacts·d⁻¹) each exposure has its
   own unit: shared hours (h·d⁻¹), so `b_k` is contacts·h⁻¹; a household or kin indicator (1), so `b_k` is
   contacts·d⁻¹; meeting attendance (meetings·d⁻¹), so `b_k` is contacts per meeting. The code already keeps a
   separate `λ0` per exposure kind (`src/network.ts:128-131`, exposures built at `:191`), so there is no shared-
   parameter defect. What remains is a **contract clarification**: declare each exposure's unit and the matching
   unit of its coefficient. `P(≥1 in Δt) = 1 − e^(−λΔt)` gives **proposals**, not
   conversations. The chain is opportunity → perception → decision → physical communication → social record. A
   declined opportunity never becomes a completed conversation. `Σ d ≤ H_i` counts both endpoints (`:372` caps both),
   and capped accepted contacts are not tested as an unrestricted Poisson process. Reserving time for an opportunity
   charges Life nothing unless the contact happens (open contract item with Life).
6. **`w` means interaction familiarity / retained connection** (SN-5), never trust, affection, loyalty or willingness
   to cooperate (Cognition's, and directional). Today `w` decides only retention and pruning; λ uses exposures, not
   `w`. Structure already shapes contact through household, kin, work and meeting exposures. Whether interaction
   history should also change future contact frequency is a separate claim, needing its own model and evidence. No
   coefficient is added just to make `w` matter. `recordEpisode` (`src/network.ts:227`) strengthens on every
   episode, so SN-5 must define the **qualifying interaction**: an unpleasant encounter may raise familiarity while
   Cognition lowers trust, as two changes with two owners. Order: decay to the interaction's timestamp, then
   reinforce, with simultaneous events in a declared order. The code advances the clock (`#at`) before
   `#strengthen`; that behaviour is kept and tested, not treated as a defect.
7. **A passed vote authorises; it does not execute** (SN-7). With electorate `E`, present `P`, supporters `Y`,
   denominator `D` from the charter (cast, eligible present, or all eligible), quorum `|P| ≥ ⌈q|E|⌉`, simple majority
   `Y > D/2`, qualified `Y/D ≥ θ`. An empty denominator gives an explicit no-decision. A vote to seize food still needs
   an attempt and physical resolution. Procedure correctness is functional; historical realism needs evidence the
   body used that procedure.
8. **Menu and believed set are named apart** (SN-8). Society publishes the institution's **declared menu** and
   checks actual eligibility (true sponsorship, kinship, occupation, balances; `src/affordance.ts:75`). The
   **believed set** is Cognition's, built from what was communicated. The true menu never passes to a mind as its
   believed options; the existence or absence of a candidate must not tell a mind something it never learned.
   Four things stay apart: actual rules, what is communicated, what the person believes is possible, what happens at
   the attempt.
9. **Migration needs an in-transit state** (SN-9): a reference to Reality's movement state (origin, destination,
   progress), never a second one in Society. Test: two depart together and one cannot complete the journey; neither
   disappears, neither is duplicated, neither appears at the destination automatically.
10. **Partial is not absent** (SN-10): payment acceptance reports `â`, the sample size, coverage
    `c = observed / eligible members` and the window. At low coverage it is reported as partial, never as a
    population figure; an empty denominator stays null. Custom prevalence, class labels and doctrine summaries
    assign no motive to anyone; any influence goes through communication, observation or action.

**8.4 First cards (CP-1; the keeper drafts units only from these).**

**SN-1 population and membership.**
1. *Question:* who belongs to each household (and, later, organisation and place), and how does each identified
   event change that exactly once?
2. *Boundary:* Life says who is born and who dies; Reality/Settlement say who completed a boundary crossing; Society
   records membership and derives counts. Society computes no rate for individually simulated people.
3. *Model:* `M_{t+1} = (M_t ∖ L_t) ∪ J_t` per identified event, idempotent by event id, in a declared event order
   within a tick; population view `N(t+Δt) = N(t) + B − D + I − E` derived from the same events.
4. *Evidence:* exact accounting; no coefficient.
5. *Functional tests:* a duplicate event changes nothing; death then administrative removal counts once; same-tick
   join and leave follow the declared order; a rolled-back transaction leaves membership unchanged; a missing input is
   reported, never assumed; replay gives identical sets.
6. *Realism tests:* inputs complete. Every member traces to a t0 fixture row or an identified event; every count to
   the events behind it.
7. *Connection test:* with Life's death record (`body.crisis` resolved `died`) live, Society's removal fires once per
   death and its view agrees with Life's ledger. In CP-1 the death is **injected**: handling a valid death is
   Society's; when someone dies is Life's, and Life's terminal criterion (LIFE-25) does not gate CP-1.

**SN-2 households and kinship.**
1. *Question:* which households exist, which relation each represents, who is in each, how each owns and shares its
   holdings, and who is kin to whom?
2. *Boundary:* Society owns household identity, membership, the declared relation and arrangement, and kinship.
   Economy holds the inventory and Settlement the ledger account and the residence, both keyed by the household id.
   Cognition holds attachment and belonging; Life holds the bodies.
3. *Model:* household record (§2) with a declared relation (CP-1: co-resident domestic group) and arrangement
   (`collective` for the M1a household, England 1270, cereals; §3 H6). The household account keeps its identity at
   one member. Kinship is a symmetric and acyclic graph from fixture rows (later, Life births).
4. *Evidence:* the arrangement is a declared test arrangement (Rex, 2026-11-02), labelled; the 1270 manorial-custom
   limitation is flagged in every trace; Laslett & Wall for later validation only.
5. *Functional tests:* in the fixture each person is in exactly one household; a death (injected) removes the member
   and leaves the stock where it is; the survivor's permissions follow the declared arrangement; no automatic
   redistribution; the account id is unchanged when membership falls to one; temporary absence keeps membership;
   kinship is symmetric and acyclic; replay is exact.
6. *Realism tests:* the fixture's household composition and arrangement are each labelled with their source or as a
   declared assumption; no inheritance rule appears unless the scenario declares one.
7. *Connection test:* Economy's inventory and Settlement's ledger accept the household id as the holder
   (`settlement/src/money-ledger.ts:8-10` already keys by holder; Economy to confirm); neither keeps a member list
   (DUP-59); `AccountId` gains `HouseholdId` (SOC-21).

**SN-3 claims, customs and authorisation.**
1. *Question:* may this person draw this good from this household now under its declared arrangement, and who has
   claimed or recognised what?
2. *Boundary:* Society answers authorisation and records claims and its entitlement under custom. Government
   evaluates entitlement under law and enforces (agreed 2026-11-02, §3 H6). Economy and Settlement hold possession.
   Cognition decides to claim, to recognise, or to take; Reality and Life resolve what physically happens.
3. *Model:* `AuthorisedDraw(i,h,g,t) = Rule_h(i,g,t) ∈ {authorised, unauthorised, unjudged}`; `AuthorisedDraw ≠
   PhysicalSuccess`. `society.claim` is written only from an act. The four facts (possession or access, recognised
   claim, entitlement, enforcement or challenge) are four records.
4. *Evidence:* rule semantics, no coefficient; the arrangement as SN-2.
5. *Functional tests (IT-M1a-7 rev 3):* (a) `collective` gives a member's take `authorised`, one transfer; (b) a
   declared deny for this person gives `unauthorised` while the accessible, uncontested take still succeeds once and the
   stock decrements once, with no permission check blocking it; (c) the same case with no declared rule gives
   `unjudged`; non-membership alone never gives `unauthorised`; no arrangement gives `unjudged`; a death
   creates no transfer and withdraws no survivor's access; an unresolved individual claim is recorded; a statistical
   prevalence never changes `Rule_h`.
6. *Realism tests:* each rule cites its declaration (the fixture) or adoption act; no rule comes from an observed
   majority.
7. *Connection test:* at CP-2, one meal is one transfer (Economy debit equals Life credit, kernel `transfer()`
   records), authorised by SN-3 and resolved by Reality/Life; Government's entitlement-under-law record, where
   present, sits beside Society's and is never merged.

**8.5 What other engines' plans need from Society (recorded 2026-11-02).**
- **Government formation track F-1 to F-4** (Government PLAN Review amendments §A, §E; Rex approved Government's plan as
  the working design, 2026-11-02). F-1: three people, one contested resource, no office; formation, non-formation and
  breakdown must all be reachable. F-2 to F-4: misconduct, pressure on officials and the press, institutional change.
  Society supplies organisation records (SN-6), claim records (SN-3), founding as coalition formation (SN-6, §3 F),
  collective procedures (SN-7) and collective action (SN-8), all from intentions only. Endowments and prior history are
  experimental inputs, never encoded outcomes. Nothing is built specifically for F-1.
- **GN-2 voting compatibility (SN-7 connection test).** Where Society (`collectiveChoice`, `src/choice.ts:121`;
  pairwise `:229`) and Government (`decide`, `government/src/choice/collective.ts`) run the same procedure (quorum,
  threshold, tie rule), the two give the same result on the same ballots, including the empty-denominator
  no-decision. Two implementations of one arithmetic is a risk of overlapping gears (SOC-23). If the registry rules
  one gear, Government calls Society's function; the dependency direction allows that and not the reverse.
  Agreed tie semantics (Government keeper, 2026-11-02): declared "tie → no act" gives a no-act; a procedure silent on
  ties, or a chair rule with no casting choice, gives `unresolved`, never a no-act; GN-2 asserts both. The
  `src/choice.ts` change is a Society unit once implementation is authorised. SOC-23 is the registry's **DC-16**
  (INTEGRATION-PLAN §8a). **Ruled (controller, 2026-11-02; Rex may override): one gear, Society's `collectiveChoice`,
  including the agreed tie rule; Government calls it; the SOC-Q3 boundary is unchanged.** GN-2 then checks Government's
  call path against Society's results.

The cards for SN-4 to SN-10 are drafted at CP-3 to CP-5, from §3 and 8.3. The existing network and organisation
code is reviewed against them in parallel; no new lane and no general review.

**Open items and what each blocks.** **SOC-R1** (four sources, or labelled assumptions, for 9 null rows): blocks
D-SOC-1, **M5**. **SOC-R2** (may a founder's draft choose its own amendment quorum?): blocks D5, **M5**. **DUP-60**
(Reality's agreement to the one network): blocks K&T diffusion and Cognition content on Society's ties, **M5**; risk
SOC-20: `Toolchain/OVERLAPS-BATCH-2B.md:125` records a Reality note of 2026-10-31 ("physical arrival only, phase 8")
while the handoff says it still waits, so the controller should confirm its state. **SOC-R3** (access under a real culture's custom): blocks
custom-governed households, **M5** (CP-4/CP-5), not CP-1 or CP-2. **SOC-R4**: answered (Rex, 2026-11-02), H6.
