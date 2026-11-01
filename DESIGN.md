# Society: design (P6, Society keeper, 2026-10-31)

**Status: approved (Rex, 2026-10-31):** SOC-Q1 to SOC-Q8 as proposed, with one refinement on SOC-Q2 in Rex's
words: *"Historical charter forms are reference components, not an exhaustive menu of possible institutions. Novel
organizations must be able to emerge from valid combinations of underlying mechanisms."* (§1.2a). Written in week one
per `HQ/handoffs/controller/NEW_ENGINE_BRIEF.md`; the `society` lane is released. Every item is marked **(Rex)** = Rex's
decision, **proposed** = the Society keeper's proposal, or **open** = a question for Rex or another owner (§5 lists
the SOC-Q items). Evidence levels are PLATFORM.md §4: (1) physical or mathematical law, (2) empirically supported
statistical relationship, (3) historical observation and interpretation, (4) simplified simulation approximation,
(5) hypothetical or experimental model, (6) fiction. **Most of Society is level 3–5.** Where a part rests on
mathematics (social choice, graph measures, demographic accounting) it says level 1; where it rests on a robust
empirical regularity (homophily, tie decay, the liability of newness, chain migration) it says level 2; everything
else is a labelled approximation with the experiment that would test it (§4). **No constant in this file is a
number.** Every parameter is `null` with a source to research, or a fixture value labelled as such in the
demonstration; the unit that implements it researches and records the value (researched / estimate / fiction).

Reading order used: NEW_ENGINE_BRIEF, PLATFORM.md, ENGINE_MAP.md §8 and "How they connect", ROADMAP.md P6 and the
executable demonstrations, the ten `society.*` registry rows and DUP-41, DUP-58–61 (`OVERLAPS-BATCH-2B.md`),
ENGINES.md ("Communication and information transmission", "Cultural salience", "Institutions, government and
religion emerge", the 2026-10-30 boundary rows), Cognition DESIGN §0–§3.

## 0. What Society is, and its fence

**(Rex)** Culture emerges from individuals, their relationships, institutions and material conditions, and feeds
back into upbringing. No rebellion meter. A government type is never assigned: the distribution of authority is
computed, and monarchy, council or republic are classifications of the result. Society is not a folder of Economy +
Government + population: it represents organisations and collective behaviour (one faction is at once an economic
actor, a political organisation and a social group) without duplicating the engines under it.

**The keeper's reading of that rule, as the engine's one design principle (proposed): Society acts on what people
do, never on what they think.** Minds are Cognition's and private (Cognition DESIGN §1: no agent reads another's
beliefs). Society's inputs from minds are **intentions and acts** (`mind.intention`, completed interaction
episodes), never beliefs, needs or parameters. Its outputs to minds are **opportunities and observable events**
(who can be met, which organisations exist and what they ask, what happened in public), never a belief, a feeling or
a score. Culture is then nowhere stored as a property: it is the pattern in who links to whom, which organisations
exist with which rules, and what content travels, all made by minds acting, and it feeds back because those patterns
are what the next generation perceives. This is SOC-Q1 (two registry rows read `mind.belief` today; §2.4).

**Scope (from the controller's brief and ENGINE_MAP §8):** the one transmission network; organisations as actors;
institution formation and dissolution; collective action; households and kinship; population and demography (from
Life, when ready, DUP-41); migration; norms and sanctions; religion as community and doctrine; class; the post-P7
rows already registered to Society (salience, partner-choice pressures, preference transmission, dress codes).

| Not Society's | Owner | How Society gets it |
|---|---|---|
| The individual decision, beliefs, trust, persuasion, what a message means | Cognition | intentions and episodes through ports; outcomes go back to minds as events |
| Biological reproduction, ageing, mortality, conception, disease | Life (Reality until the split) | births, deaths with cause, conceptions as events (DUP-41 boundary, ENGINES.md) |
| The physical channel of a message (distance, sound, light, a carried letter) | Reality (`realism.communication.transmission`) | Society says who meets whom; Reality whether the signal arrives |
| Parcels, buildings, titles, posts, the money ledger | Settlement | where each person lives and works; legal records point at Society's actor (DUP-58) |
| Accounts, holdings, prices, wages, household budgets | Economy | views keyed by Society's organisation and household ids (DUP-58, DUP-59) |
| Law, what an office may do, enforcement over non-members, taxation | Government | Society supplies organisations, grievances as collective events, legitimacy inputs as observable acts |
| "What the town knows", technique diffusion as capability | Knowledge & Technology | Society's network is the substrate (DUP-60, DUP-61) |
| Reference dates, culture-profile seeds | Catalogue | read once at initialisation, never as a gate |
| The record of what occurred, PSI and other yardsticks | History | Society exposes measures; History computes yardsticks; **no Society mechanism reads History** |
| Fictional faction identities and narratives | pirate Story keeper | the plugin may label Society's actors; never defines them |

**Package rules (brief):** `Toolchain/society/`, `@rex/society`, its own git repo on `master`, TypeScript with
vitest, imports `@rex/kernel` (`file:../kernel`) and, one way, only what ENGINE_MAP says Society reads (Cognition,
Life, Economy, Settlement, Catalogue), through ports. Nothing imports Society's internals; Government, K&T and
History read its ports.

## 1. The mechanisms

Ordered as asked: the network and the organisation mechanisms first (they carry the first demonstration, §3), then
the rest. Each carries the PLATFORM §7 contract fields; the later ones carry a short contract to be completed by the
unit that builds them. Row ids that exist are adopted; new ids are proposals to the registry keeper (§1.13).

### 1.1 The one network — `society.network.communication` (adopted; DUP-60 proposed owner)

**What it is.** Who can reach whom, how often, through what kind of link. It is a set of directed ties
`(i → j, kind, w_ij, λ_ij, t_last)`; kinds are data (`kin`, `household`, `neighbour`, `co-worker`, `trade`,
`co-member:<org id>`, `patron`, `secret`), several per pair. **Trust is not on the tie**: how far `i` believes `j` is
Cognition's `mind.source_credibility`. The network carries no content rule of its own: what travels is whatever
messages minds encode (Cognition), over a channel Reality resolves. Preferences, norms, doctrines, techniques and
rumours are **content types** carried by the same contacts (DUP-60: one substrate, several contents).

| Field | Contract |
|---|---|
| Inputs (units) | co-location exposure from Settlement (`settlement` residence and post assignments: shared hours, `h·d⁻¹`); household and kin relations (§1.6); organisation membership and meeting events (§1.2); completed interaction episodes `mind.episode` (count, valence as the mind recorded it); `mind.intention` of kind `seek_contact` / `avoid_contact` (Cognition) |
| Outputs | `society.comm_network` (ties, `w` dimensionless [0,1], `λ` contacts·d⁻¹); **contact-opportunity events** on the kernel clock (a meeting of `i` and `j` at a place and time); network measures for observers (degree, clustering, path length, component sizes; dimensionless) |
| State | the tie table; per-tie time of last contact |
| Formulation (proposed) | **Opportunity:** contacts between `i` and `j` arrive as a Poisson process with rate `λ_ij = Σ_k λ0_k · x_ij,k`, `x_ij,k` the exposure of kind `k` (shared hours for co-location kinds, 1 for an existing kin or household link, meeting attendance for co-membership). Whether a contact becomes communication, and what is said, is Cognition's choice; the network only offers the meeting. **Strength:** each completed episode adds `w ← w + α_k (1 − w)` (saturating); between episodes `w ← w · 2^(−Δt / T_k)` (exponential decay with a half-life per kind). A tie with `w < w_min` and no structural exposure is removed. **Formation beyond exposure:** a `seek_contact` intention toward a known person creates or strengthens the tie; introductions happen through common contacts because that is who is met (triadic closure as a consequence, never a rule). |
| Dependencies | Kernel (clock, events, per-entity RNG streams `get(mechanismId, entityId)`), Settlement (locations), §1.2, §1.6, Cognition (episodes, intentions) |
| Timescale | event-driven (each contact an event); decay evaluated lazily at the next event on the tie |
| Invariants | one network: no other mechanism keeps a who-talks-to-whom table (a test over the registry and `kernel.json`); cutting a tie (death, migration, quarrel, suppression) stops every content type at once (DUP-60 test 3); the network never writes a belief, a trust value or content; a tie's kinds are facts with causes (a household link exists because §1.6 says so), never assigned affinity |
| Sources, evidence | tie strength and weak ties: Granovetter 1973 (level 2); exponential tie decay with kind-dependent rates: Burt 2000 *Social Networks* 22; Roberts & Dunbar 2011, 2015 (kin ties decay slower) (level 2); homophily as an outcome of opportunity and choice: McPherson, Smith-Lovin & Cook 2001 (level 2); layered personal-network sizes: Hill & Dunbar 2003; Zhou, Sornette, Hill & Dunbar 2005 (level 2–3); small-world structure: Watts & Strogatz 1998 (level 1 as mathematics) |
| Parameters | `λ0_k`, `α_k`, `T_k`, `w_min`: **null**, to research (`T_k` from Burt 2000 and Roberts & Dunbar 2015; `λ0_k` from time-use and contact-diary studies, e.g. Mossong et al. 2008 POLYMOD for contact rates by setting, level 2 for modern populations, an approximation for historical ones) |
| Approximations | contact is a point event (duration ignored); kinds are additive in `λ`; decay is memoryless; one place per contact |
| Validation tests | **verification:** Poisson arrival counts match `λ` (χ² on a long run); decay halves `w` at `T_k`; removing a tie stops all three content types. **validation (independent data):** degree distribution and kin/non-kin share of active ties against Hill & Dunbar 2003 and historical reconstitution-based kin networks (to research); clustering ≫ random graph of the same density (Watts & Strogatz); homophily by occupation and age arising without a homophily rule (McPherson et al.) |
| Consumers | Cognition (`cognition.communication.encode`: who can be told), Reality (`realism.communication.transmission`: the endpoints), §1.2–§1.5, §1.9, §1.10, K&T (`knowledge.technology.diffusion`, `knowledge.collective.stock` substrate), Government (`government.suppression.communication` cuts or watches links) |
| **Rate limiter** | each person's waking hours: the sum of contact durations offered cannot exceed the person's available hours (Cognition's time use and Life's capacity), so a person in many organisations meets each less; `λ` scales by available hours, never exceeds them (a checked invariant) |
| **Failure mode** | no exposure data (Settlement absent) → only household and kin ties exist, flagged in the trace, never a random graph substituted; a missing `T_k` → the run refuses to start (null parameter), never a default |

### 1.2 Organisations as actors — `society.organisation.actors` (adopted; DUP-58 proposed owner)

**What it is.** The one store of organisations: families' corporate forms, congregations, fraternities, guilds,
companies, cults, factions, clubs. **An organisation is a record of commitments among people, not a mind.** It has
no needs, beliefs or will; it acts only when its decision procedure (§1.3) turns its members' intentions into an act.
Kinds are labels for observers; mechanisms read rules and members, never the kind.

| Field | Contract |
|---|---|
| Inputs | founding, joining, leaving, paying, attending, expelling and proposal **intentions** (`mind.intention`, Cognition); collective-choice results (§1.3); formation, merger, split and dissolution events (§1.4); deaths and departures (Life, §1.8) |
| Outputs | `society.organisation` records `{ id, founded_at, founders[], members[] {person, role, joined_at, standing}, rules (data, below), positions[] {role, holder, term}, meeting schedule, doctrine/charter record ref, resource claims }`; `society.membership` (person → organisations); `society.organisation_event` (founded, joined, left, expelled, office changed, act performed, dissolved); **affordances** offered to minds (join `X` on these terms; attend; pay; stand for a position) through the Cognition candidate port (§2.2) |
| State | the records above; nothing economic (accounts and holdings are Economy's view keyed by the same id; premises, titles and posts are Settlement's) |
| Rules as data (§1.2a) | `admission` (open, sponsored by `n` members, by vote, by kinship, by occupation, by fee), `obligations` (dues per period as a transfer on Settlement's ledger, attendance, service, exclusivity with named other organisations), `benefits` (claims members may make: relief in sickness, burial, loans, worship, protection, trade privileges; each is paid through the engine that owns it), `decision_procedure` (§1.3), `positions` and how they are filled, `sanctions` (fine, suspension, expulsion), `amendment` procedure. A rule set is chosen by founders and accepted by joiners; amended only by its own amendment procedure |
| Formulation | an organisation exists while it has ≥1 member and has not dissolved; membership changes only by an accepted intention (join under admission, leave at will unless a rule binds and is enforced by members), death, or expulsion through §1.3; obligations fall due on the kernel clock; an unpaid obligation is recorded, and any sanction is a §1.3 act chosen by members, never automatic |
| Dependencies | Kernel; Cognition (intentions, the affordance port); Settlement (money: dues and benefits are transfers on `settlement.ledger_row` / `settlement.balance_changes`, the one home of money; meeting place, legal records); Economy (goods through its inventories; the organisation's holdings view); §1.1, §1.3, §1.4 |
| Timescale | event-driven; obligations on their own schedule (per rule data) |
| Invariants | **one organisation id across Society, Economy and Settlement** (DUP-58 test 1); creation, merger, split and dissolution happen only in Society and propagate to the two views (test 2); no Economy or Settlement mechanism decides membership or leadership (test 3); an organisation owns no money in Society's state (conservation stays with Settlement's ledger); **no mechanism reads the kind label**; a religious community is an organisation (§1.10), never a second store |
| Sources, evidence | the organisation as a nexus of members' commitments, not a unitary agent: Coleman 1974 *Power and the Structure of Society*, 1990 *Foundations of Social Theory* (level 3); voluntary associations' membership dynamics: McPherson 1983 *ASR* "An ecology of affiliation"; Popielarz & McPherson 1995 *AJS* (level 2); historical fraternities and guilds as mutual-aid and religious organisations: Rosser 2015 *The Art of Solidarity in the Middle Ages*; Barron 1985 "The parish fraternities of medieval London"; Ogilvie 2019 *The European Guilds*; van Leeuwen 2016 *Mutual Insurance 1550–2015* (level 3) |
| Approximations | members are individuals (an organisation as a member of another is a later extension, open); one charter per organisation; charters are compositions of executable components, historical charters are reference compositions (§1.2a, Rex 2026-10-31) |
| Validation tests | **verification:** membership accounting closes (members(t+1) = members(t) + joins − leaves − deaths − expulsions − departures); one id across three engines; no money in Society state. **validation:** §3 demonstration tests D1–D7; membership duration rises with the member's ties inside the organisation and falls with niche overlap (Popielarz & McPherson 1995, documented sign) |
| Consumers | Cognition (affordances, outcome events), Economy (`economy.org.organisation` becomes the economic view), Settlement (`settlement.business.open` points at its owning actor), Government (`government.authority.acquisition_delegation` reads `society.organisation_event`), K&T (organisations as record-keepers), History |
| **Rate limiter** | members' time and money: obligations compete for the same hours (§1.1 limiter) and the same household budget (Economy), so organisations compete for members as a consequence; admission rules limit entry |
| **Failure mode** | an act whose cost no member funds does not happen (recorded as failed for want of resources); an organisation whose last member dies or leaves dissolves (event with cause); a rule set that cannot be evaluated (missing data) blocks the founding, logged, never silently simplified |

### 1.2a Charters are compositions of components (Rex, 2026-10-31, on SOC-Q2)

A charter is never picked from a list of historical types. It is a **composition** of rule components, each of which
is a mechanism the engines can execute: an admission component (open, sponsorship by `n` members, vote, kinship,
occupation, fee), an obligation component (a periodic transfer on Settlement's ledger, attendance at a scheduled
meeting, service hours, exclusivity toward named organisations), a benefit component (a conditional claim paid by an
owning engine: a ledger transfer on a stated event such as sickness or death, a scheduled meeting with a named
activity, a loan), a decision procedure (§1.3), a position component (role, how filled, term), a sanction component
(fine, suspension, expulsion) and an amendment component. **A composition is valid when every component's inputs
exist and are executable** (the event a benefit is conditioned on is one some engine emits; the transfer it pays is a
ledger move; the vote it requires has a §1.3 procedure); validity is checked by a schema validator, never by
membership in a list of known forms. Historical charters (the 1388–89 returns, guild ordinances, friendly-society
rules) are **reference compositions**: decomposed into components, they supply the component vocabulary, labelled
examples, and validation baselines; they never bound what founders may compose. A founder's draft charter is any valid
composition the founder's mind generates (Cognition proposes; parameters such as dues amounts are the founder's
choice); novel organisations are therefore any valid composition no historical charter used. Extending the vocabulary
(a new component type) is a design change reviewed like any mechanism.

### 1.3 Collective choice inside an organisation — `society.organisation.collective_choice` (new, proposed)

**What it is.** How a group's members' individual intentions become one act of the organisation (admit, expel,
spend, petition, strike, elect, amend, merge). The procedure is the organisation's own rule data; Society applies it.

| Field | Contract |
|---|---|
| Inputs | a proposal (an intention of kind `propose` by an eligible member, Cognition); members' votes or assents (`mind.intention` of kind `support` / `oppose` / `abstain`), each formed by that member's own decision engine; the `decision_procedure` rule |
| Outputs | `society.organisation_event` of kind `act` with the outcome and the tally; outcome events to every member (they perceive the result) |
| Formulation | procedures as data, each a documented social-choice rule: decision by the holder of a named position; simple or qualified majority of those present or of all members; unanimity; a council of position holders deciding by one of the above; quorum and eligibility conditions. Majority rule's properties are mathematics (May 1952; Arrow 1951; level 1); which procedures real organisations used is history (level 3) |
| Invariants | an act exists only if the procedure returned it; **no procedure is assigned by the engine**: founders propose one and joiners accept it by joining; amendment only through the amendment rule; the outcome never reads a member's belief, only the member's expressed intention |
| Sources | May 1952 *Econometrica*; Arrow 1951; historical guild and fraternity ordinances (Rosser 2015; Ogilvie 2019; Toulmin Smith 1870 *English Gilds*, the 1388–89 returns) for which procedures were used |
| Timescale | at the meetings the rules schedule, or on demand where a rule allows |
| Validation | **verification:** each procedure against hand-worked cases (ties, quorum failure, cycles under pairwise majority); **validation:** none at the procedure level (it is a rule); its consequences are tested in §3 (D5) |
| Rate limiter | meetings are contacts (§1.1): only members present (attendance is each member's choice) vote where the rule requires presence |
| Failure mode | no quorum → no act, recorded; a tie under a rule with no tie-break → no act, recorded; never a random resolution unless the rule says lots |
| Seam | Government's `government.rule.creation_amendment` makes law over a jurisdiction; this mechanism makes an organisation's own rules over its members. **Proposed boundary:** authority over people who joined and may leave is Society's; authority over a territory or over non-members is Government's. An organisation that starts enforcing on non-members is where Government's authority acquisition (`government.authority.acquisition_delegation`) reads Society's events (SOC-Q3) |

### 1.4 Formation, merger, split and dissolution — `society.institution.formation_dissolution` (adopted, scope proposed)

**What it is.** The life events of organisations, and the recognition of an **institution** as a configuration,
never a state switch.

| Field | Contract |
|---|---|
| Inputs | a `found` intention by one or more persons naming a draft rule set and a purpose (benefits the founders seek); `join` intentions by the founding circle; `merge` and `split` proposals passed under §1.3; schism (a split whose cause is a doctrine dispute, §1.10); loss of all members |
| Outputs | `society.organisation_event` (founded, merged, split, dissolved, each with cause and the intentions that produced it) |
| Formulation | **Founding:** an organisation is founded when its founders' `join` intentions are all given within the founding window and at least the rule's minimum founding membership is met (data in the draft charter); otherwise the attempt is recorded as failed. **Split:** a passed split proposal (or the exit of a minority who found a new organisation) divides members by their own `join` choices; resources divide by the charter or by Economy's settlement of claims. **Merger:** a passed merger in both organisations. **Dissolution:** passed dissolution, or no members. **Institution (classification):** an organisation is *recorded* as institutionalised when its state shows recognised positions with succession rules, a sanction actually applied, and a revenue rule actually collected; the label is computed from state for observers and History, never read back by any mechanism (the Rex rule on government types, applied to organisations) |
| Invariants | every organisation in the log has a founding event tracing to named intentions (G4); no organisation is created by the engine at a threshold of population, wealth or date; an institution label changes nothing |
| Sources, evidence | organisational ecology: Hannan & Freeman 1977 *AJS*, 1989 *Organizational Ecology* (density dependence of founding and mortality, level 2); liability of newness: Stinchcombe 1965; Freeman, Carroll & Hannan 1983 *ASR* (level 2); collective action problems in founding: Olson 1965 (level 3–4); self-governing institutions: Ostrom 1990 *Governing the Commons* (design principles, level 3) |
| Timescale | event-driven |
| Validation | D2–D4 in §3: liability of newness and density dependence are **reported against** Freeman et al. 1983 and Hannan & Freeman 1989 as yardsticks, never tuned to |
| Rate limiter | founding costs the founders' time and money (the founding meeting, any entry fee, any charter cost through Economy), and every founder must be reachable by the others on the network |
| Failure mode | founders who cannot meet (no ties) cannot found; an incomplete founding is recorded with the missing intentions |

### 1.5 Collective action — `society.collective.action` (new, proposed; P6 acceptance test 3)

**What it is.** A protest, petition, strike, food riot, boycott, festival, defence, barn-raising or uprising as an
**event made of coinciding individual intentions**, coordinated through the network and organisations. There is no
grievance, unrest or rebellion quantity anywhere.

| Field | Contract |
|---|---|
| Inputs | intentions of kind `participate(target, action, place, time)` (Cognition); calls to act passed by an organisation (§1.3); co-location at the named place and time (Settlement); the network (who heard the call, §1.1, via Cognition's messages) |
| Outputs | `society.collective_event { id, action, target, place, time, participants[], organisers[] }`; outcome events to participants and observers; the act's effects are resolved by the engine that owns the target (Economy for a seized grain store, Government for a petition or an enforcement response, Life for injuries) |
| Formulation | when two or more persons' `participate` intentions coincide on (action, target, place, time window), a collective event is recorded with them as participants; its scale is the count of those who turn up. **Thresholds belong to minds:** whether a person participates is that person's decision, which may weigh beliefs about how many others will come (Granovetter 1978's threshold model is the expected emergent pattern, not a rule here); preference falsification (Kuran 1991) arises when minds hide intentions they would act on in a crowd |
| Invariants | never triggered by a meter, a threshold of hunger or a date; a collective event exists only with at least two participants who each intended it; outcomes come from the owning engines |
| Sources, evidence | Granovetter 1978 *AJS* (level 4 as model, 2–3 as observation); Kuran 1991 *World Politics*; Olson 1965; Tilly 1978 *From Mobilization to Revolution* (level 3); food riots following grain prices with a documented sign: Thompson 1971 *Past & Present* 50; Bohstedt 2010 *The Politics of Provisions* (level 3); Aoki Kōji's ikki counts against rice prices for H2 (level 3) |
| Validation | P6 test 3: collective action arises from individual states (hungry, angry, connected), never a meter; a food-price shock raises the rate of food-related collective events in the documented direction (Thompson; Bohstedt); cutting network ties lowers event size (the network is the coordination channel) |
| Rate limiter | the speed of the network (a call travels contact by contact), physical presence (people must get there, Reality and Settlement), time budgets |
| Failure mode | nobody else turns up → a single-person act, which is an individual act, not a collective event; a call that reaches no one → no event, recorded |

### 1.6 Households and kinship — `society.household.structure` (adopted; DUP-59 proposed owner)

| Field | Contract |
|---|---|
| Inputs | births and deaths (Life), unions (Cognition's `cognition.reproduction.behaviour` partner choice as an intention to marry or cohabit, accepted by the other and recognised under the custom in force), departures and arrivals (§1.8), a person's intention to leave or found a household |
| Outputs | `society.household { id, members[] {person, relation}, residence (Settlement parcel), formed_at }`; kin relations (parent, child, sibling, spouse, affine) as a graph; household and kin ties to §1.1 |
| Formulation | membership changes only by event: birth into the mother's household (or by the custom in force), death, union (residence by the custom: with the husband's kin, the wife's kin, or a new household; **custom is content held by people and organisations, §1.9, seeded at initialisation from the Catalogue culture profile, never a fixed property**), departure, household fission when a member's intention to found one is accepted and a residence exists (Settlement) and can be afforded (Economy). Inheritance custom names heirs as a norm; property transfer happens through Settlement titles and Economy holdings; where a law exists, Government's law decides what is enforceable (seam, SOC-Q3) |
| Invariants | one household id; membership changes only in Society; Economy's household budget is a view keyed by that id with no second membership list (DUP-59 test); every person belongs to exactly one household at a time (an institution, a ship or a barracks is a household-like residence recorded as such, open) |
| Sources, evidence | Laslett & Wall (eds) 1972 *Household and Family in Past Time* (mean household size and composition by region, level 3); Hajnal 1965 and 1982 *Population and Development Review* 8 (two household-formation systems, level 3); Ruggles 2009/2012 on historical family composition (level 3) |
| Validation | household size distribution and share of complex households against Laslett & Wall for the reference region, without coding a size; age at first marriage against Wrigley et al. 1997 for England (H1 development only) |
| Rate limiter | housing (a residence must exist, Settlement) and the budget to run a household (Economy) |
| Failure mode | no residence available → the union is recorded and the couple stays in an existing household, flagged; never a new parcel invented |

### 1.7 Population and demography — `society.population.demography` (new, proposed; takes DUP-41 when Life is ready)

**Boundary (Rex, ENGINES.md):** demography moves to Society; Life keeps biological reproduction, ageing and
mortality. **Proposed split:** Life owns every hazard (fecundity, conception, pregnancy outcome, death by cause);
Society owns the **population as a social fact**: who exists where, in which household, the age-sex structure, the
accounting identity, and the resolution hand-off. Births happen because Life's conception follows a union or other
partnership choice (Cognition) under the household and custom state (§1.6); deaths come from Life's one death ledger.

| Field | Contract |
|---|---|
| Inputs | Life's birth and death events (with cause); §1.8 migration events; at coarse resolution, Life's age-specific hazards as rates |
| Outputs | `society.population` (counts by age, sex, household, place; `count`), the population accounting record per step |
| Formulation | fine resolution: persons; coarse: cohorts by single year of age and sex per place; the hand-off through the Kernel's `Resolution { coarsen, refine }` with conserved quantity `count` (tolerance 0). Accounting: `P(t+1) = P(t) + B − D + I − E`, checked every step (G1) |
| Invariants | no birth or death rate lives in Society; the realism `population.ts` cohort tick (`births = adultsF·birthRate/365·health`, migration `prosperity·reputation·0.001`) is retired as an authority when the move lands (DUP-41), its tests kept as regression where they still apply |
| Sources | Wrigley & Schofield 1981; Wrigley, Davies, Oeppen & Schofield 1997; Coale & Demeny 1983 model life tables (level 2–3) |
| Validation | P6 test 1: a village of 500 run 100 years keeps its age structure within 15 % of the source population; the source and the comparison statistic (share by five-year group, total-variation distance) are chosen by the unit, H1 development data only |
| Rate limiter, failure mode | none of its own (it counts); a birth or death without a Life event is a hard error |
| Timing | **open (SOC-Q4):** designed now, moved when the Life keeper agrees, after `realism/` splits |

### 1.8 Migration — `society.migration.flows` (new, proposed; P6 test 2)

The decision to move is Cognition's (a person or a household head forms the intention, weighing believed wages,
food, safety and ties at the destination). Society owns the **move as a social event**: who leaves which household
and organisations, who goes together, where they arrive, how ties stretch (kin ties survive at lower contact rate,
neighbour ties end) and how information about destinations reaches people (letters and returnees are messages on the
network: chain migration is then a consequence, not a rule). Sources: Ravenstein 1885; Harris & Todaro 1970 *AER*
(expected-income differential, level 2–3); Massey et al. 1993 *PDR* 19 (network theory of migration, level 2).
Validation: P6 test 2, migration follows a wage or food differential with the documented sign; destinations
concentrate where earlier migrants' ties lead. Rate limiter: travel (Reality, routes), cost (Economy), information
(network). Failure mode: no believed destination → no move. **Replaces** `realism.population.migration` (DUP-41).

### 1.9 Norms and sanctions — `society.norm.sanction` (new, proposed; short contract)

A norm is not stored as a rule of the world. It exists as (a) what people do (observable, so others form empirical
expectations), (b) what people say should be done (messages, so others form normative expectations), and (c)
organisation rules that name sanctions (§1.2). Bicchieri 2006 (*The Grammar of Society*) gives the two expectations,
which are Cognition's beliefs. Society owns the **sanction as an event**: gossip is content on the network;
exclusion is a §1.3 act or a tie a person chooses to drop; costly punishment is a mind's intention (Fehr & Gächter
2002 *Nature*, level 2). Society also exposes a **descriptive measure** of a behaviour's prevalence for observers and
History; no mechanism reads it (it would be a meter). Cultural food norms (DUP-49, Rex: Society's) are norms of this
kind. Contract fields to be completed before its unit.

### 1.10 Religion as community and doctrine — `society.religion.community_ritual`, `society.doctrine.transmission_divergence` (adopted)

**(Rex, 2026-10-31)** Cognition owns individual supernatural belief, conviction and doubt; Society owns shared
doctrine, ritual, communities, transmission and collective identity; Government owns religious law and official
recognition. **Proposed:** a religious community is an organisation (§1.2) whose benefits include worship and ritual
and whose charter references a doctrine record; `society.religious_community` becomes a view of `society.organisation`
filtered by that charter, never a second store. A **doctrine** is a record (oral formula, text, creed) held by an
organisation and carried as content on the network; it changes through copying error and reinterpretation at each
re-encoding (oral: every hop; written: once, then the medium's decay; Rex 2026-10-31), and splits when a §1.3 dispute
ends in schism (§1.4). Conversion follows network ties (Lofland & Stark 1965 *ASR*; Stark 1996, level 3);
transmission fidelity and population size (Henrich 2004 *American Antiquity*; Boyd & Richerson 1985, level 4–5).
Rituals are scheduled meetings (contacts, §1.1) with the costs their charter states. Short contract; designed after
the first demonstration.

### 1.11 Class — `society.class.structure` (new, proposed; a measurement, never a state)

Class is never assigned and never stored on a person. It is a **classification computed from state**: holdings and
income (Economy), occupation and posts (Settlement), organisation membership and positions (§1.2), marriage patterns
(§1.6: homogamy) and network position (§1.1). For observers and History only; no mechanism reads it. What any
person believes about another's status is Cognition's perception of observable signs (dress, house, title; Society's
`society.dress_codes` says what signs mean here). Sources for classification schemes: van Leeuwen & Maas 2011
HISCLASS (level 3). SOC-Q5.

### 1.12 Rows already registered to Society after P7 (adopted, designed later)

`society.culture.salience` (writes `mind.cultural_salience`: computed from what is displayed in each person's own
contacts, so it is a per-person exposure, consistent with §0), `society.influence.partner_choice`
(`society.partner_norms`: pressures delivered as observable family and peer acts and messages),
`society.transmission.preferences` (**becomes a content type on §1.1, DUP-60**, never a network of its own),
`society.presentation.interpretation` (`society.dress_codes`, data per society and period). Each waits on the
Cognition rows it feeds (ROADMAP "After P7").

### 1.13 What goes to the registry keeper (proposed)

New rows: `society.organisation.collective_choice`, `society.collective.action`, `society.population.demography`,
`society.migration.flows`, `society.norm.sanction`, `society.class.structure`, and `society.affordance.offer` (offers
are re-checked against true state at attempt time, IF-46 amendment A; the
single writer of `society.affordance`: the union of the social actions each source row permits a person now, with
their stated terms; it decides, scores and filters by belief nothing; consumer Cognition via IF-46). Registered as
proposed by the registry keeper 2026-10-31 (IF-46 affordances, IF-47 the watched boundary with Government;
`society.religious_community` retired to an alias of `society.organisation`; SOC-1 applied). Changes: the ten existing rows get
the contract fields above; `society.doctrine.transmission_divergence` and `society.religion.community_ritual` drop the
`mind.belief` input (SOC-Q1); `society.religion.community_ritual` becomes a view over `society.organisation.actors`;
`society.transmission.preferences` becomes content on the network (DUP-60). New quantities: `society.organisation`,
`society.membership`, `society.household`, `society.population`, `society.collective_event`, `society.affordance`.
Possible new overlap: `society.organisation.collective_choice` vs `government.rule.creation_amendment` (SOC-Q3).

### 1.14 Keeper rulings from the first build (Society keeper, 2026-11-01; implementation detail inside the approved design)

The lane's review (units 2840, 2843, 2913) asked five questions the design left open. None is Rex's (no rule of the
world, no fiction value); each is recorded here as the keeper's ruling, evidence level 4 where it is a modelling choice.

1. **Reference compositions vs executable charters (§1.2a).** A historical charter is evidence, and sources are
   silent on many amounts and schedules. So the two are checked separately:
   - `validateReference` checks a reference: every component's `type` is known; every null field carries
     `source_silent: true` and a note; components the source does not record are simply absent (five gild returns
     record no admission rule).
   - `validateCharter` stays strict for **drafts**, the charters a founder's mind actually proposes: no nulls, an
     admission component required.
   - A reference becomes a draft only when a founder supplies every missing value. A test shows each reference,
     with its nulls filled by labelled test values, passes `validateCharter`: the components are executable; the
     history is not invented.
2. **Collective choice (§1.3).** Every majority component carries a required `base`, with no default:
   - `cast`: support + oppose; abstentions excluded;
   - `present`: eligible members present;
   - `members`: all eligible members.

   `tie_break` stays optional; absent means a tie is a recorded no-act. Historical ordinances differ on both, so
   both are charter data.
3. **Founding (§1.4).** `founding.window` (a duration) and `founding.min_members` are required fields of a draft
   charter, chosen by the founder; there are no engine defaults. `classifyInstitution` is exported from the package
   barrel for observers and History; no other `src/` module imports it (enforced by a test).
4. **Hours (§1.1).** `availableHours` is per person per day (`h·d⁻¹`). The limiter holds per kernel day: within a
   day, `Σ_j λ_ij · d ≤ H_i`.
5. **Multi-kind decay (§1.1).** A tie holding several kinds decays with the **longest** half-life among the kinds
   it currently holds, not the kind of its last episode. While a structural relation persists (kin, household,
   co-membership), the slower decay governs. Kin ties decay slowest: Roberts & Dunbar 2015, level 2 for the
   direction, level 4 for the max rule. When a kind's exposure ends, it leaves the tie, and the half-life is
   recomputed at the next event.

## 2. The interfaces

### 2.1 Kernel

The one clock (contacts, meetings, obligations and collective events are scheduled events); stable ids for persons,
households, organisations, ties; per-entity RNG streams (`get(mechanismId, entityId)`, COG-3) for contact arrival
only (no other Society mechanism is stochastic: decisions are Cognition's); `Resolution` for demography (§1.7);
transactions: a dues payment or benefit commits with its Settlement ledger transfer as one; `kernel.json` declares every
process, read and write.

### 2.2 Cognition (through the registry keeper; to agree with the Cognition keeper)

| Direction | What | Status |
|---|---|---|
| Cognition → Society | `mind.intention` of the social kinds (join, leave, found, propose, support/oppose, pay, attend, participate, marry, move, seek/avoid contact) | to agree: Cognition's action generation takes candidates as host data, so these are candidates Society offers |
| Cognition → Society | `mind.episode` of interactions (that a contact happened and how the mind recorded it) | registered input of the network row |
| Society → Cognition | **affordances** (`society.affordance`, writer `society.affordance.offer`): the candidate social actions open to this person now, by action and target; the mind evaluates them with its own needs (safety, social connection, a scenario-configured status need if any) and beliefs | **IF-46, agreed with Cognition (2026-10-31)** with two amendments: (A) `decision.generate` filters offers by the mind's *believed* preconditions, so **Society checks the action against its true state when the intention is attempted**; a refused attempt (not admitted, no quorum, cannot pay) is an outcome event the mind learns from; (B) **charter terms reach a mind only as observations or testimony** (a posted ordinance, a member's account, an observed payout), so a mind can misread a charter; Society never writes `mind.belief` or the believed repertoire (consistent with SOC-Q1). C-Q6 closes into this seam (pending the controller's confirmation of Rex's reading) |
| Society → Cognition | outcome and public events (admitted, refused, a vote's result, a collective event seen) as observations through perception | the existing stimulus path; no new belief path |
| Society → Cognition / Reality | contact opportunities (who meets whom, where, when) for `cognition.communication.encode` and `realism.communication.transmission` | IF-16 (registered) |

### 2.3 Economy and Settlement

Money's one home is Settlement's ledger (Economy has none; correction agreed on DUP-58, 2026-10-31): dues, relief,
fees and an organisation's spending are transfers on `settlement.ledger_row` / `settlement.balance_changes` in one
kernel transaction with the Society event; goods move through Economy's inventories (the organisation's holdings are
Economy's view of the Society id, DUP-58). A Settlement business keeps its own id with a pointer to one owning actor
(an actor may run several businesses); an actor's dissolution reaches Settlement as `closeBusiness` commands; the household budget is
Economy's view of the Society household id (DUP-59); prices and wages are read by minds (through their beliefs), not
by Society. Settlement: residence and posts (co-location for §1.1), meeting places, legal records pointing at the
owning Society actor (`settlement.business.open`). Until P5 builds household budgets, the demonstration uses a
labelled fixture budget (§3).

### 2.4 Life, Reality, Government, K&T, Catalogue, History

Life: births, deaths with cause, conception, illness and incapacity as events (and, until P3, labelled fixture
shocks). Reality: the physical channel (IF-13/IF-14), travel. Government: reads organisation and collective events;
writes restrictions Society honours (a suppressed link, a banned assembly are Government's rules; whether people obey
is theirs). K&T: reads the network and organisations as record holders; owns the collective stock (DUP-61: Society's
view is that K&T's proposal is right). Catalogue: the culture-profile seed at initialisation (starting customs,
doctrines, organisation forms), labelled, never a date gate. History: reads everything; Society reads nothing of it.

## 3. The first executable demonstration: D-SOC-1, "a parish forms its fraternities"

ROADMAP: **a population forming competing organisations** — households and individuals form guilds, congregations
or factions that compete for members and resources. Headless, seeded, no pirate slice, on the Kernel clock.

**The setup (proposed; every value a labelled fixture or researched by the unit).** One village of about 60
households (~300 people; the household count researched from Laslett & Wall for the reference region; the region is
a development-only analogue of late-fourteenth-century England, H1, because its fraternities are documented in the
1388–89 guild returns; Rosser 2015). **No organisation exists at t0** except households. Residences and work posts
from a fixture Settlement map; kin and household ties from a fixture genealogy; individual minds from the built
Cognition baseline with needs **hunger, safety, social connection** (the benchmark set, C-Q5) and, if the scenario wants
it, a status need as a scenario-level configuration need row (Cognition, SOC-5); Society adds no workaround. Shocks: illness, injury and death (Life stubs, labelled
fixture hazards) and a harvest fixture that changes household income (Economy stub budget, labelled). The run lasts
long enough for founding and dissolution to repeat (the duration set by the unit from the yardsticks, e.g. 50
simulated years), N ≥ 30 seeds.

**The affordances offered (the only social actions):** `found(draft charter)` where a draft charter is a rule set
from the researched forms (SOC-Q2: admission, dues, benefits such as sick relief, burial, a priest's mass, a feast;
decision procedure; exclusivity); `join`, `leave`, `pay`, `attend`, `propose`, `support/oppose`, `seek_contact`.
**What makes them compete:** each person's hours and each household's budget are finite (§1.1, §1.2 rate limiters);
exclusivity rules, where a charter has them; benefits that depend on the pooled funds (a society with few members
pays less relief, so its members' believed safety gain is lower: the mind's own evaluation).

**What must appear, never coded:** organisations founded by people who are linked; members recruited along ties;
two or more organisations coexisting with overlapping membership pools; members moving between them as costs,
benefits and ties change; splits after disputes; some organisations dying young.

**Acceptance (proposed):**

| # | Test | Kind |
|---|---|---|
| D1 | every organisation in every seed has a founding event tracing to named founders' intentions; none exists at t0; no code path creates one at a threshold (a test over the source and the trace) | gate (G4) |
| D2 | membership, money and population accounting close every step (membership identity §1.2; Settlement's ledger conserves; §1.7 identity) | gate (G1, mandatory) |
| D3 | no person's offered contact hours or obligations exceed their available hours; no household pays dues it does not have | gate (rate limiter) |
| D3b | every attempted social action is checked against Society's true state; a refused attempt (wrong belief about admission, terms or quorum) is an outcome event to that mind, and at least one seed shows a mind misreading a charter (IF-46 A, B) | gate |
| D4 | seeds differ: the distribution of the number, size and charters of organisations at the end is not degenerate across N ≥ 30 seeds | graded (G6) |
| D5 | **competition:** in seeds where two organisations draw on overlapping members, membership of one falls when the other lowers its dues or raises its benefit, with each transfer traced to a member's intention | graded, sign test |
| D6 | **documented directions, reported as yardsticks, never tuned:** a higher fixture illness hazard raises the founding rate of organisations whose charters offer sick relief (demand for mutual insurance; van Leeuwen 2016); dissolution hazard falls with organisational age (liability of newness; Freeman, Carroll & Hannan 1983); membership duration rises with a member's ties inside and falls with niche overlap (Popielarz & McPherson 1995); members are more alike than random draws on occupation and kin (homophily from recruitment along ties; McPherson et al. 2001) | graded, sign and shape reported |
| D7 | knock-outs: removing the network (members cannot meet) yields no organisations beyond single households; removing the shocks lowers relief-chartered foundings | gate |

**What it needs and when.** Kernel (built). Cognition baseline (built; needs the affordance port and the social
intention kinds, §2.2). Economy: a labelled fixture household budget until P5. Life: labelled fixture hazards until
P3. Settlement: a fixture map (or the built settlement package with a fixture village). Catalogue: the charter forms as
a hand-researched data file until P4 (Composer unit). **Nothing waits on Government or K&T.**

**Cliodynamics as a yardstick (PLATFORM, ENGINES.md).** The structural-demographic model (Turchin 2003; Turchin &
Nefedov 2009) explains pressures and instability windows at polity scale over centuries; a 300-person parish cannot
test it. Society's part is to **expose the measures** a structural-demographic baseline needs, computed by History's
harness and read by no mechanism: popular well-being (real income per household, from Economy), aspirants per
position (members seeking organisation positions against positions available, §1.2), the share of population in
organisations, and collective-event rates (§1.5). **D-SOC-2 (proposed, after D-SOC-1):** a population growing on fixed
land over two to three centuries in seeded runs; History computes the political stress indicator from the run's own
measures; the test is whether collective conflict events cluster where the indicator is high **without any Society
mechanism reading it**, reported against the simple baseline model as in P11c, including where the platform does
worse.

## 4. Validation plan (PLATFORM §11a, §11b)

**Implemented ≠ integrated ≠ validated.** Each unit fills its row's `vv` record; passing its own tests is
implemented only.

| Mechanism | Verification (mechanism tests, every unit) | Integration (only on interface change) | Validation (periodic, independent data) |
|---|---|---|---|
| network §1.1 | Poisson arrivals, decay half-life, tie removal stops all content | with Cognition's encode and Reality's transmission (V-M2 rumour, Cognition's experiment, on this network) | contact rates by setting (Mossong et al. 2008, modern; historical analogues to research); personal-network size and kin share (Hill & Dunbar 2003); clustering and homophily emergent |
| organisations §1.2–§1.4 | membership accounting; one id across three engines; procedures on hand-worked cases | with Settlement's ledger (dues, relief) and records, and Economy's inventories | D5, D6 against organisational ecology and voluntary-association data; the 1388–89 guild returns for counts and charter forms (development only) |
| collective action §1.5 | an event only from coinciding intentions | with Government (responses) and Economy (targets) | food-riot timing against grain prices, England (Bohstedt; Thompson), development only; H2 ikki counts against rice prices (Aoki) |
| households §1.6 | one household id; membership by event only | with Economy's budget view and Life's births and deaths | Laslett & Wall size and composition; Hajnal's marriage ages |
| demography §1.7 | accounting identity, resolution conservation | with Life's ledger | P6 test 1 (age structure within 15 %), H1 development only |
| migration §1.8 | moves conserve persons and keep households whole unless a member chose otherwise | with Settlement and Economy | P6 test 2 (sign of the differential); chain-migration concentration |

Held-out rule (PLATFORM §5): H3 Greenland and H4 Copán are never used to set a Society parameter. A failed yardstick
opens a SOC- issue and an investigation of the missing mechanism or input, never a tuning pass. Self-testing is not
independence: each validation unit is paired with a Haiku check unit that did not write the code, and the registry
keeper re-audits.

Gates follow §11b: each unit runs the filtered suite for what it touched plus conservation, destructive-operation
safeguards, and the tests of any shared contract it changed. The thirty-seed demonstration runs as `npm run bench`,
gated by its REPORT verdict (Cognition's COG-16 pattern), never on every change.

## 5. Open questions for Rex (numbered SOC-Q)

| # | Question | Keeper's proposal |
|---|---|---|
| SOC-Q1 | Does Society act only on what people **do** (intentions, acts, episodes) and never read minds' beliefs? Two registered rows (doctrine, religious community) read `mind.belief` today | yes: Society never reads a belief; doctrine is a record carried as content; communities are organisations; the two rows drop the input **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q2 | An organisation's rules (admission, dues, benefits, decision procedure): a **menu of documented forms** as data (from historical charters, via Catalogue) that founders choose and combine, or must the rule forms themselves emerge from minds inventing them? | a researched menu, combinable, never assigned; invention of new forms is a later, level-5 extension **decided (Rex, 2026-10-31): as proposed — refined: historical charter forms are reference components, not an exhaustive menu; novel organisations emerge from valid combinations of underlying mechanisms (§1.2a)** |
| SOC-Q3 | The line between an organisation's own rules and law: authority over people who joined and may leave is Society's; over a territory or non-members is Government's. Agree? (Also: who decides an inheritance when custom and law differ: law where enforced, custom otherwise) | yes; the registry records it as a boundary with Government (new overlap if Government disagrees) **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q4 | Demography (DUP-41): design now, move from `realism/population.ts` only when the Life keeper agrees after the split? | yes; Life keeps every hazard, Society the population as a social fact **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q5 | Class as a computed classification only (never stored on a person, never read by a mechanism), like government types? | yes **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q6 | The first demonstration's analogue: a late-fourteenth-century English parish (H1, development only), with mutual-aid and religious fraternities; craft guilds wait for P5 Economy, political factions for P8 Government? | yes **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q7 | DUP-61: "what the town knows" is Knowledge & Technology's (an aggregate over minds and records) on Society's network? | yes (Society builds no stock) **decided (Rex, 2026-10-31): as proposed** |
| SOC-Q8 | Approve DUP-58, DUP-59 and DUP-60 as proposed in `OVERLAPS-BATCH-2B.md`, with the refinements here (affordance port; the religious community as a view; preference transmission as content) | **decided (Rex, 2026-10-31): batch 2b approved**; DUP-58 and DUP-59 agreed by all parties with Economy's correction (money is on Settlement's ledger) and Settlement's (businesses keep their ids, pointing at one actor); DUP-60 waits on Reality — (owners as proposed; DUP-61 to K&T, which also settles SOC-Q7). Society agreed the acceptance tests with amendments (DUP-58 +no money in Society state, +no kind-label reads; DUP-59 +one household per person; DUP-60 +no trust on ties, +network writes no content), sent to the registry keeper |

## 6. After approval: the package and the first units (draft, not queued)

1. Approval marker unit (keeper). 2. Registry rows and quantities (§1.13) through the registry keeper. 3. Scaffold
`@rex/society` (Sonnet). 4. Network §1.1 with verification tests (Codex). 5. Organisations, collective choice and
formation §1.2–§1.4 (Codex). 6. Charter-forms data file from the 1388–89 returns and secondary sources (Claude
research unit with WebSearch/WebFetch, then Composer for the data file). 7. Affordance port with Cognition (Codex,
after the Cognition keeper agrees). 8. Fixture village and D-SOC-1 bench (Composer for fixtures, Codex for the
harness). 9. Haiku check unit. Each Gate carries its validation specification. Households, demography and migration
follow D-SOC-1.

## Sources (to be confirmed and expanded by each unit; page numbers by the unit)

Arrow 1951 *Social Choice and Individual Values*; Barron 1985 in Barron & Harper-Bill (eds) *The Church in
Pre-Reformation Society*; Bicchieri 2006; Bohstedt 2010; Boyd & Richerson 1985; Burt 2000 *Social Networks* 22;
Coale & Demeny 1983; Coleman 1974, 1990; Fehr & Gächter 2002 *Nature* 415; Freeman, Carroll & Hannan 1983 *ASR* 48;
Granovetter 1973 *AJS* 78, 1978 *AJS* 83; Hajnal 1965, 1982; Hannan & Freeman 1977 *AJS* 82, 1989; Harris & Todaro
1970 *AER* 60; Henrich 2004 *American Antiquity* 69; Hill & Dunbar 2003 *Human Nature* 14; Kuran 1991 *World
Politics* 44; Laslett & Wall 1972; Lofland & Stark 1965 *ASR* 30; Massey et al. 1993 *PDR* 19; May 1952
*Econometrica* 20; McPherson 1983 *ASR* 48; McPherson, Smith-Lovin & Cook 2001 *Annual Review of Sociology* 27;
Mossong et al. 2008 *PLoS Medicine* 5; Ogilvie 2019; Olson 1965; Ostrom 1990; Popielarz & McPherson 1995 *AJS* 101;
Ravenstein 1885; Roberts & Dunbar 2011 *Personal Relationships* 18, 2015 *Human Nature* 26; Rosser 2015; Ruggles
2012; Stark 1996; Stinchcombe 1965; Thompson 1971 *Past & Present* 50; Tilly 1978; Toulmin Smith 1870; Turchin 2003
*Historical Dynamics*; Turchin & Nefedov 2009 *Secular Cycles*; van Leeuwen 2016; van Leeuwen & Maas 2011 *HISCLASS*;
Watts & Strogatz 1998 *Nature* 393; Wrigley & Schofield 1981; Wrigley, Davies, Oeppen & Schofield 1997; Zhou,
Sornette, Hill & Dunbar 2005 *Proc. R. Soc. B* 272.

## Log

| Date | What |
|---|---|
| 2026-10-31 | **Approved (Rex):** SOC-Q1–Q8 as proposed, SOC-Q2 refined (§1.2a: charters as compositions of executable components). Lane released |
| 2026-10-31 | Design written (Society keeper, first turn): fence and the "acts, not thoughts" principle; 13 mechanism sections led by the network and organisations; interfaces; D-SOC-1 with seven acceptance tests and D-SOC-2 as the cliodynamic yardstick; validation plan; SOC-Q1–Q8. Not approved; nothing queued |
