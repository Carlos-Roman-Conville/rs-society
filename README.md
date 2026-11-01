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
opportunities themselves do not. For multi-kind ties, the episode must name its kind. Its half-life governs
the scalar strength until another reinforcing episode or seek names a kind; this convention fills an unspecified multi-kind case
in DESIGN §1.1. Single-kind episodes may omit `kind`.

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
