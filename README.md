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
