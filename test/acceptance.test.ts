import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DAY, streams } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import {
  acceptance,
  CommunicationNetwork,
  mintId,
  paymentAcceptancePort,
  type AcceptanceRecord,
  type AccountId,
  type ExchangeRecord,
  type InventoryPort,
  type KindParameters,
  type LedgerPort,
} from "../src/index.ts";

// All days, assets, populations and network parameters below are fixture (test only).
const a = mintId({}, "person").id;
const b = mintId({ person: 1 }, "person").id;
const c = mintId({ person: 2 }, "person").id;
const org = mintId({}, "org").id;
const household = mintId({}, "household").id;
const window = { from: 1, to: 4 };
const take = (day: number, to = a, asset = "coin"): ExchangeRecord => ({ day, legs: [{ to, asset }] });
const refusal = (day: number, refusedBy = a): AcceptanceRecord => ({
  day, refusedBy, asset: "coin", reason: "not-accepted",
});
const trade: KindParameters = { kind: "trade", lambda0: 2, alpha: 0.25, T: 4 };
const exchange: ExchangeRecord = {
  day: 0,
  legs: [{ to: b, asset: "grain" }, { to: a, asset: "coin" }, { to: a, asset: "coin" }],
};
function network(kinds: readonly KindParameters[] = [trade]): CommunicationNetwork {
  return new CommunicationNetwork({
    parameters: { kinds, w_min: 0.01, d: 0.001 },
    people: [a, b, c].map((id) => ({ id, availableHours: 24 })),
    streams: streams(27),
    counters: {},
    start: 0,
  });
}

describe("MULTI-ECONOMY §8 payment acceptance (DESIGN §1.17)", () => {
  it("the share is a pure function of exchange and refusal records and replays exactly", () => {
    const records = Object.freeze([
      Object.freeze(refusal(2)),
      Object.freeze(take(3, b)),
    ]);
    const before = JSON.stringify(records);
    const group = [a, b] as const;
    const first = acceptance(group, "coin", window, records);
    const second = acceptance(group, "coin", window, records);
    expect(first).toBe(0.5);
    expect(second).toBe(first);
    expect(JSON.stringify(records)).toBe(before);
    const permuted = [take(2), refusal(3, b), take(1)];
    expect(acceptance(group, "coin", window, permuted)).toBe(
      acceptance(group, "coin", window, [take(1), take(2), refusal(3, b)]),
    );
    expect(paymentAcceptancePort.read(group, "coin", window, records)).toBe(first);
  });

  it("`null` when no member was observed; a null or missing window throws", () => {
    expect(acceptance([a], "coin", window, [])).toBeNull();
    expect(acceptance([a], "coin", window, [take(2, b), take(2, a, "grain")])).toBeNull();
    expect(acceptance(org, "coin", window, {
      observations: [],
      membership: new Map([[org, [a, b]]]),
    })).toBeNull();
    for (const invalid of [null, undefined, { from: 4, to: 1 }, { from: NaN, to: 4 }, { from: 1, to: Infinity }]) {
      expect(() => acceptance([a], "coin", invalid, [])).toThrow("window");
    }
  });

  it("no mind state is read (the function needs no mind input)", () => {
    const acceptanceSrc = readFileSync(join(import.meta.dirname, "../src/acceptance.ts"), "utf8");
    expect(acceptanceSrc).not.toMatch(/mind\.|cognition\./);
    expect(acceptance.length).toBe(4);
    expect(acceptance([a], "coin", window, [take(2)])).toBe(1);
  });

  it("trade ties exist only as tie kind `trade` on the one network", () => {
    const net = network();
    net.recordExchange(exchange);
    expect(net.ties()).toMatchObject([
      { i: a, j: b, kinds: ["trade"], w: 0.25, lambda: 2, t_last: 0 },
      { i: b, j: a, kinds: ["trade"], w: 0.25, lambda: 2, t_last: 0 },
    ]);
    expect(net.ties().every((tie) => tie.kinds.every((kind) => kind === "trade" || tie.kinds.includes("trade")))).toBe(true);
    const missing = network([]);
    expect(() => missing.recordExchange(exchange)).toThrow("parameters for trade");
    expect(missing.ties()).toEqual([]);
    const dual = network([trade, { kind: "kin", lambda0: 1, alpha: 0.5, T: 8 }]);
    dual.setExposures({ sharedHours: [], households: [], kin: [{ i: a, j: b }], meetings: [] });
    dual.recordExchange(exchange);
    for (const tie of dual.ties()) {
      if (tie.i === a && tie.j === b) expect(tie.kinds).toEqual(["kin", "trade"]);
    }
    expect(() => network([{ ...trade, lambda0: null } as unknown as KindParameters])).toThrow("lambda0");
  });

  it("no sanction without a named actor's act (a refusal record produces no sanction, fine or membership change)", () => {
    const records = [take(1), refusal(3), take(4, b)];
    const shareWithRefusal = acceptance(new Set([a, b, c]), "coin", window, records);
    expect(shareWithRefusal).toBe(0.5);
    const acceptanceSrc = readFileSync(join(import.meta.dirname, "../src/acceptance.ts"), "utf8");
    expect(acceptanceSrc).not.toMatch(/\bsanction\b|\bfine\b|membership.*change/);
    const membersBefore = [a, b, c];
    acceptance(membersBefore, "coin", window, records);
    expect(membersBefore).toEqual([a, b, c]);
  });

  it("changing a share changes no price, balance or transfer (the function returns a number and writes nothing)", () => {
    expect(paymentAcceptancePort).toMatchObject({
      quantity: "society.payment_acceptance_share",
      unit: "1",
      nullable: true,
    });
    const ledger: LedgerPort & { balances: Map<AccountId, number>; rows: unknown[] } = {
      id: "fixture.ledger",
      balances: new Map([[a, 10], [b, 20]]),
      rows: [],
      balance(account) { return this.balances.get(account) ?? 0; },
      transfer(from, to, amount, reason) {
        this.balances.set(from, this.balance(from) - amount);
        this.balances.set(to, this.balance(to) + amount);
        this.rows.push({ from, to, amount, reason });
      },
      snapshot() { return structuredClone({ balances: this.balances, rows: this.rows }); },
      restore(snapshot: unknown) { Object.assign(this, snapshot); },
    };
    const inventory: InventoryPort & { quantities: Map<string, number> } = {
      id: "fixture.inventory",
      quantities: new Map([[`${a}/coin`, 5], [`${b}/coin`, 7]]),
      quantity(account, good) { return this.quantities.get(`${account}/${good}`) ?? 0; },
      transfer(from, to, good, quantity) {
        this.quantities.set(`${from}/${good}`, this.quantity(from, good) - quantity);
        this.quantities.set(`${to}/${good}`, this.quantity(to, good) + quantity);
      },
      snapshot() { return structuredClone({ quantities: this.quantities }); },
      restore(snapshot: unknown) { Object.assign(this, snapshot); },
    };
    const ledgerBefore = ledger.snapshot();
    const inventoryBefore = inventory.snapshot();
    const scenarios = [
      acceptance([a], "coin", window, []),
      acceptance([a, b], "coin", window, [take(1), refusal(4, b)]),
      acceptance([a, b], "coin", window, [take(4, a), take(4, b)]),
    ];
    expect(scenarios).toEqual([null, 0.5, 1]);
    expect(ledger.snapshot()).toEqual(ledgerBefore);
    expect(inventory.snapshot()).toEqual(inventoryBefore);
    expect(typeof scenarios[1]).toBe("number");
  });
});

describe("payment acceptance boundaries (DESIGN §1.17)", () => {
  it("latest observation decides; members outside the group ignored; window edges inclusive", () => {
    const records = [take(1), take(2), refusal(3), take(4, b), take(0), take(5)];
    expect(acceptance(new Set([a, b, c]), "coin", window, records)).toBe(0.5);
    expect(acceptance([a], "coin", window, records)).toBe(0);
    expect(acceptance([b, c], "coin", window, records)).toBe(1);
    expect(acceptance([a], "coin", window, [refusal(3), take(2)])).toBe(0);
    expect(acceptance([a], "coin", window, [refusal(3), take(3)])).toBe(1);
    expect(acceptance([a], "coin", window, [take(3), refusal(3)])).toBe(0);
    const otherReason = { ...refusal(4), reason: "insufficient-stock" } as unknown as AcceptanceRecord;
    expect(acceptance([a, b], "coin", window, [take(1), refusal(4, b), take(4, c), take(4, b, "grain"), otherReason])).toBe(0.5);
    expect(acceptance([a, b], "coin", { from: 1, to: 1 }, [take(1), take(2)])).toBe(1);
    const resolved = {
      observations: [take(2), refusal(3, b)],
      membership: new Map([[org, [a, b]]]),
      households: new Map([[household, [b, c]]]),
    };
    expect(acceptance(org, "coin", window, resolved)).toBe(0.5);
    expect(acceptance(household, "coin", window, resolved)).toBe(0);
    expect(() => acceptance(org, "coin", window, [])).toThrow("membership");
  });
});

describe("completed exchanges reinforce trade on the one network (DESIGN §1.1)", () => {
  it("uses reinforcement and decay without mutating unknown parties or clock", () => {
    const net = network();
    net.recordExchange(exchange);
    net.recordExchange(exchange);
    expect(net.ties().map((tie) => tie.w)).toEqual([0.4375, 0.4375]);
    net.advanceTo(4 * DAY, []);
    for (const tie of net.ties()) expect(tie.w).toBeCloseTo(0.21875, 14);
    net.cutPerson(b);
    expect(net.advanceTo(8 * DAY, [])).toEqual([]);
    const fresh = network();
    const stranger = mintId({ person: 3 }, "person").id;
    expect(() => fresh.recordExchange({ ...exchange, legs: [...exchange.legs, { to: stranger, asset: "coin" }] })).toThrow("unknown person");
    expect(() => fresh.recordExchange({ ...exchange, day: 1 })).toThrow("act time");
    expect(fresh.ties()).toEqual([]);
  });
});
