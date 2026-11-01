import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { FORMATION_PROCESS, validateCharter, type Charter, type SocialIntention } from "../src/index.ts";
import { a, b, c, d, people, charter, capabilities, setup, draft, joins, network,
  foundFixture, decision, attend } from "./lifecycle-fixture.ts";

// All counts, timings, rules, purposes and identities are fixture (test only).
describe("formation and dissolution (DESIGN §1.4)", () => {
  it("requires each named founder's join, preserves mint order, and records purpose and intentions", () => {
    const { store, views } = setup();
    const intention = draft(store, [c, a], { ...charter, founding: { window: 10, min_members: 2 } });
    const event = store.found(intention, joins(intention), network());
    expect(event.kind).toBe("founded");
    expect(store.get(event.org)?.founders).toEqual([a, c]);
    expect(event.intentions).toEqual([intention, ...joins(intention).reverse()]);
    expect(event.payload).toMatchObject({ purpose: "fixture mutual aid" });
    expect(views.calls).toEqual([["created", event.org]]);
    expect(store.found(intention, joins(intention), network()).cause).toContain("already resolved");
    expect(store.organisations()).toHaveLength(1);
  });
  it("reports validator errors verbatim and never inserts an invalid draft", () => {
    const { store } = setup();
    const bad: Charter = { ...charter, admission: [], founding: { window: null, min_members: null } };
    const intention = draft(store, [a], bad);
    const event = store.found(intention, joins(intention), network());
    expect(event.payload?.errors).toEqual(expect.arrayContaining(validateCharter(bad, capabilities)));
    expect(store.organisations()).toEqual([]);
  });
  it.each([
    { founding: undefined }, { founding: { window: 10, min_members: 3 } },
    { founding: { window: 0, min_members: 1 } }, { founding: { window: 1.5, min_members: 1 } },
  ])("refuses missing/invalid founding parameters and insufficient membership: %j", (change) => {
    const { store } = setup();
    const intention = draft(store, [a, b], { ...charter, ...change });
    expect(store.found(intention, joins(intention), network()).kind).toBe("refused");
    expect(store.organisations()).toEqual([]);
  });
  it.each([-1, 0, 10, 11])("accepts only joins inside the inclusive founding window, at offset %s", (t) => {
    const { store } = setup();
    const intention = draft(store, [a, b]);
    store.advanceTo(11);
    const expressed = joins(intention).map((i) => i.person === b ? { ...i, t } : i);
    const event = store.found(intention, expressed, network(people, store.now));
    expect(event.kind).toBe(t >= 0 && t <= 10 ? "founded" : "refused");
    if (event.kind === "refused") expect(event.payload?.missing).toEqual([b]);
  });
  it("records incomplete, wrong-target, duplicate and future joins without inventing consent", () => {
    for (const variant of ["missing", "target", "duplicate", "future"] as const) {
      const { store } = setup();
      const intention = draft(store, [a, b]);
      let expressed = joins(intention);
      if (variant === "missing") expressed.pop();
      if (variant === "target") expressed[1] = { ...expressed[1], target: "another draft" };
      if (variant === "duplicate") expressed.push(expressed[0]);
      if (variant === "future") expressed[1] = { ...expressed[1], t: 1 };
      expect(store.found(intention, expressed, network()).kind).toBe("refused");
      expect(store.organisations()).toEqual([]);
    }
  });
  it("requires paths in both directions and allows paths through non-founders", () => {
    for (const mode of ["disconnected", "one-way", "path"] as const) {
      const { store } = setup();
      const net = network(people, 0, mode === "path");
      if (mode === "one-way") net.setExposures({ sharedHours: [{ i: a, j: c, kind: "kin", hours: 1 }],
        households: [], kin: [], meetings: [] });
      const intention = draft(store, [a, c]);
      const result = store.found(intention, joins(intention), net);
      expect(result.kind).toBe(mode === "path" ? "founded" : "refused");
      if (mode !== "path") expect(result.cause).toContain("reachable");
    }
  });
  it("rejects unavailable founders, duplicate names and a stale network snapshot", () => {
    for (const mode of ["unavailable", "duplicate", "stale"] as const) {
      const { store } = setup();
      if (mode === "unavailable") store.removePerson(a, "death");
      const intention = draft(store, mode === "duplicate" ? [a, a] : [a]);
      if (mode === "stale") store.advanceTo(1);
      expect(store.found(intention, joins(intention), network()).kind).toBe("refused");
    }
  });
  it("rolls back the actor, founding identity, counter and views when creation notification fails", () => {
    const { store, views } = setup();
    const intention = draft(store);
    views.fail = true;
    expect(() => store.found(intention, joins(intention), network())).toThrow("view failed");
    expect(store.events).toEqual([]); expect(store.organisations()).toEqual([]); expect(views.calls).toEqual([]);
    views.fail = false;
    expect(store.found(intention, joins(intention), network()).org).toBe("org.0001");
  });
  it("founding fees use the ledger, refuse unfunded founders and roll back with failed views", () => {
    const { store, ledger, views } = setup();
    const rules: Charter = { ...charter, admission: [{ type: "fee", amount: 3 }] };
    const intention = draft(store, [a, b], rules);
    const before = ledger.snapshot(); views.fail = true;
    expect(() => store.found(intention, joins(intention), network())).toThrow("view failed");
    expect(ledger.snapshot()).toEqual(before); expect(store.events).toEqual([]);
    views.fail = false; ledger.balances.set(b, 0);
    expect(store.found(intention, joins(intention), network()).cause).toContain("cannot pay");
    expect(ledger.rows).toEqual([]); expect(store.organisations()).toEqual([]);
    ledger.balances.set(b, 100);
    const retry = draft(store, [a, b], rules);
    const event = store.found(retry, joins(retry), network());
    expect(event.kind).toBe("founded"); expect(ledger.balance(event.org)).toBe(6);
    expect([...ledger.balances.values()].reduce((sum, value) => sum + value, 0)).toBe(500);
  });
  it("a passed split conserves each former member in one successor or an explicit exit", () => {
    const { store } = setup();
    const source = foundFixture(store, [a, b, c, d]);
    const successor = foundFixture(store, [b]);
    attend(store, source);
    const successors = [source, successor];
    const choices: SocialIntention[] = [
      { person: a, kind: "join", target: source, t: 0 },
      { person: b, kind: "join", target: successor, t: 0 },
      { person: c, kind: "join", target: successor, t: 0 },
      { person: d, kind: "leave", target: source, t: 0 },
    ];
    const event = store.split({ source, successors, choices, cause: "doctrine dispute" },
      decision(store, source, { action: "split", successors }));
    expect(event.kind).toBe("split");
    expect(store.get(source)?.members.map((m) => m.person)).toEqual([a]);
    expect(store.get(successor)?.members.map((m) => m.person)).toEqual([b, c]);
    expect(store.memberships(d)).toEqual([]);
    expect(event.intentions).toEqual(expect.arrayContaining(choices));
    expect(event.payload?.resourceClaims).toMatchObject({ status: "unsettled", source, successors: [successor] });
  });
  it("refuses incomplete/duplicate split choices, unpassed acts and conflicting successor memberships", () => {
    for (const mode of ["missing", "duplicate", "unpassed", "overlap"] as const) {
      const { store } = setup();
      const source = foundFixture(store, [a, b]);
      const successor = foundFixture(store, [b]);
      const extra = foundFixture(store, [b]);
      const successors = mode === "overlap" ? [source, successor, extra] : [source, successor];
      const choices: SocialIntention[] = [{ person: a, kind: "join", target: source, t: 0 },
        { person: b, kind: "join", target: successor, t: 0 }];
      if (mode === "missing") choices.pop();
      if (mode === "duplicate") choices[1] = choices[0];
      if (mode !== "unpassed") attend(store, source);
      const before = store.organisations();
      expect(store.split({ source, successors, choices, cause: "fixture split" },
        decision(store, source, { action: "split", successors })).kind).toBe("refused");
      expect(store.organisations()).toEqual(before);
    }
  });
  it("a split dissolves an emptied source, preserves claims and rolls back on view failure", () => {
    const { store, views } = setup();
    const intention = draft(store, [a, b, c], charter, ["business.0001"]);
    const source = store.found(intention, joins(intention), network()).org;
    const first = foundFixture(store, [a]), second = foundFixture(store, [b]);
    attend(store, source);
    const successors = [first, second];
    const choices: SocialIntention[] = [{ person: a, kind: "join", target: first, t: 0 },
      { person: b, kind: "join", target: second, t: 0 }, { person: c, kind: "leave", target: source, t: 0 }];
    const request = decision(store, source, { action: "split", successors });
    const before = { state: store.organisations(), events: store.events, views: views.snapshot() };
    views.fail = true;
    expect(() => store.split({ source, successors, choices, cause: "fixture division" }, request)).toThrow("view failed");
    expect({ state: store.organisations(), events: store.events, views: views.snapshot() }).toEqual(before);
    views.fail = false;
    const event = store.split({ source, successors, choices, cause: "fixture division" }, request);
    expect(event.payload?.resourceClaims).toMatchObject({ businesses: ["business.0001"], successors });
    expect(store.get(source)).toBeUndefined();
    expect(store.memberships(a)).toEqual([first]); expect(store.memberships(b)).toEqual([second]);
    expect(store.memberships(c)).toEqual([]);
    expect(views.calls.filter(([kind]) => kind === "close")).toEqual([["close", "business.0001"]]);
  });
  it("rolls back all split admissions and ledger transfers if a later member cannot join", () => {
    const { store, ledger } = setup();
    const source = foundFixture(store, [a, b]);
    const successor = foundFixture(store, [c], { ...charter, admission: [{ type: "fee", amount: 1 }] });
    ledger.balances.set(b, 0); attend(store, source);
    const before = store.organisations(), balances = ledger.snapshot();
    const successors = [successor];
    const choices: SocialIntention[] = [a, b].map((person) => ({ person, kind: "join", target: successor, t: 0 }));
    const event = store.split({ source, successors, choices, cause: "fixture split" },
      decision(store, source, { action: "split", successors }));
    expect(event).toMatchObject({ kind: "refused", cause: "cannot pay admission fee" });
    expect(store.organisations()).toEqual(before); expect(ledger.snapshot()).toEqual(balances);
  });
  it("a minority may exit and found independently without a majority's permission", () => {
    const { store } = setup();
    const source = foundFixture(store, [a, b, c]);
    const leave: SocialIntention = { person: c, kind: "leave", target: source, t: 0 };
    const intention = draft(store, [c]);
    const event = store.secede({ source, intention, joins: joins(intention), exits: [leave], cause: "doctrine dispute" }, network());
    expect(event.kind).toBe("split");
    const successor = [...store.events].reverse().find((e) => e.kind === "founded")!.org;
    expect(event.intentions).toEqual([leave, intention, ...joins(intention)]);
    expect(store.memberships(c)).toEqual([successor]);
    expect(store.get(source)?.members.map((m) => m.person)).toEqual([a, b]);
  });
  it("a failed secession founding records missing joins and preserves the minority's chosen exit", () => {
    const { store } = setup(); const source = foundFixture(store, [a, b, c]);
    const intention = draft(store, [c]);
    const event = store.secede({ source, intention, joins: [],
      exits: [{ person: c, kind: "leave", target: source, t: 0 }], cause: "doctrine dispute" }, network());
    expect(event).toMatchObject({ kind: "refused", payload: { missing: [c] } });
    expect(store.memberships(c)).toEqual([]); expect(store.organisations()).toHaveLength(1);
  });
  it("secession requires the minority's own exits and rolls back those exits on adapter failure", () => {
    const { store, views } = setup(); const source = foundFixture(store, [a, b, c]);
    const intention = draft(store, [c]);
    const input = { source, intention, joins: joins(intention),
      exits: [{ person: c, kind: "leave", target: source, t: 0 } as SocialIntention], cause: "fixture dispute" };
    expect(store.secede({ ...input, exits: [] }, network()).kind).toBe("refused");
    const before = { state: store.organisations(), events: store.events, views: views.snapshot() };
    views.fail = true;
    expect(() => store.secede(input, network())).toThrow("view failed");
    expect({ state: store.organisations(), events: store.events, views: views.snapshot() }).toEqual(before);
  });
  it("merger requires both current organisations' passed acts and conserves overlapping members", () => {
    for (const passed of [false, true]) {
      const { store } = setup();
      const survivor = foundFixture(store, [a, b]), source = foundFixture(store, [b, c]);
      attend(store, survivor); if (passed) attend(store, source);
      const payload = { action: "merge", survivor, source };
      const one = decision(store, survivor, payload), two = { ...decision(store, source, payload), proposalId: "other" };
      two.ballots = two.ballots.map((i) => ({ ...i, target: "other" }));
      expect(store.merge(survivor, source, [one, two]).kind).toBe(passed ? "merged" : "refused");
      expect(store.get(survivor)?.members.map((m) => m.person)).toEqual(passed ? [a, b, c] : [a, b]);
      expect(store.get(source) === undefined).toBe(passed);
    }
  });
  it("dissolution follows a passed act or loss of all members and records the cause", () => {
    for (const mode of ["act", "leave", "death"] as const) {
      const { store } = setup(); const org = foundFixture(store);
      if (mode === "act") {
        attend(store, org); const request = decision(store, org, { action: "dissolve" });
        store.attempt(request.proposal, { decision: request });
      } else if (mode === "leave") store.attempt({ person: a, kind: "leave", target: org, t: 0 });
      else store.removePerson(a, "death");
      expect(store.organisations()).toEqual([]);
      const event = store.events.find((e) => e.kind === "dissolved")!;
      expect(event.cause).toBeTruthy();
      expect(event.intentions.length > 0).toBe(mode !== "death");
    }
  });
  it("scans all src creation sites: only found constructs and inserts an organisation", () => {
    const sites: string[] = [], insertions: string[] = [];
    const root = new URL("../src/", import.meta.url);
    for (const name of readdirSync(root, { recursive: true }).map(String).filter((n) => n.endsWith(".ts"))) {
      const source = ts.createSourceFile(name, readFileSync(new URL(name.replaceAll("\\", "/"), root), "utf8"), ts.ScriptTarget.Latest, true);
      const walk = (node: ts.Node): void => {
        if (ts.isObjectLiteralExpression(node) && node.properties.some((p) => p.name?.getText(source) === "founded_at")) {
          sites.push(name);
          let scope: ts.Node | undefined = node.parent;
          while (scope && !ts.isFunctionDeclaration(scope)) scope = scope.parent;
          expect(scope && ts.isFunctionDeclaration(scope) && scope.name?.text).toBe("found");
        }
        if (ts.isCallExpression(node) && /organisations\.push$/.test(node.expression.getText(source))) {
          insertions.push(name);
          let scope: ts.Node | undefined = node.parent;
          while (scope && !ts.isMethodDeclaration(scope)) scope = scope.parent;
          expect(scope && ts.isMethodDeclaration(scope) && scope.name.getText(source)).toBe("found");
          expect(node.arguments.map((a) => a.getText(source))).toEqual(["result.organisation"]);
        }
        ts.forEachChild(node, walk);
      };
      walk(source);
    }
    expect(sites).toEqual(["formation.ts"]); expect(insertions).toEqual(["organisation.ts"]);
    expect("create" in setup().store).toBe(false);
  }, 60_000);
  it("registers exactly one formation/dissolution process", () => {
    const manifest = JSON.parse(readFileSync(new URL("../kernel.json", import.meta.url), "utf8"));
    expect(manifest.processes.filter((p: { id: string }) => p.id === FORMATION_PROCESS)).toHaveLength(1);
  });
});
