import { DAY, streams } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import {
  acceptance, CommunicationNetwork, mintId, paymentAcceptancePort,
  type AcceptanceRecord, type ExchangeRecord, type KindParameters,
} from "../src/index.ts";

// All days, assets, populations and network parameters below are fixture (test only).
const a = mintId({}, "person").id;
const b = mintId({ person: 1 }, "person").id;
const c = mintId({ person: 2 }, "person").id;
const org = mintId({}, "org").id;
const household = mintId({}, "household").id;
const window = { from: 1, to: 4 };
const take = (day: number, to = a, asset = "coin"): ExchangeRecord => ({ day, legs: [{ to, asset }] });
const refusal = (day: number, refusedBy = a): AcceptanceRecord => ({ day, refusedBy, asset: "coin", reason: "not-accepted" });
const trade: KindParameters = { kind: "trade", lambda0: 2, alpha: 0.25, T: 4 };
const exchange: ExchangeRecord = { day: 0, legs: [{ to: b, asset: "grain" }, { to: a, asset: "coin" }, { to: a, asset: "coin" }] };
function network(kinds: readonly KindParameters[] = [trade]): CommunicationNetwork {
  return new CommunicationNetwork({
    parameters: { kinds, w_min: 0.01, d: 0.001 },
    people: [a, b, c].map((id) => ({ id, availableHours: 24 })),
    streams: streams(27), counters: {}, start: 0,
  });
}

describe("payment acceptance projection (DESIGN §1.17)", () => {
  it("counts latest observed members, not transactions or unobserved members", () => {
    const records = [take(1), take(2), refusal(3), take(4, b), take(0), take(5)];
    expect(acceptance(new Set([a, b, c]), "coin", window, records)).toBe(0.5);
    expect(acceptance([a], "coin", window, records)).toBe(0);
    expect(acceptance([b, c], "coin", window, records)).toBe(1);
  });

  it("uses latest day even for unsorted days and mint order to break same-day ties", () => {
    expect(acceptance([a], "coin", window, [refusal(3), take(2)])).toBe(0);
    expect(acceptance([a], "coin", window, [refusal(3), take(3)])).toBe(1);
    expect(acceptance([a], "coin", window, [take(3), refusal(3)])).toBe(0);
  });

  it("includes both day bounds and ignores other assets, outsiders and refusal reasons", () => {
    const otherReason = { ...refusal(4), reason: "insufficient-stock" } as unknown as AcceptanceRecord;
    expect(acceptance([a, b], "coin", window, [take(1), refusal(4, b), take(4, c), take(4, b, "grain"), otherReason])).toBe(0.5);
  });

  it("resolves organisation and household ids solely from supplied facts", () => {
    const records = {
      observations: [take(2), refusal(3, b)],
      membership: new Map([[org, [a, b]]]), households: new Map([[household, [b, c]]]),
    };
    expect(acceptance(org, "coin", window, records)).toBe(0.5);
    expect(acceptance(household, "coin", window, records)).toBe(0);
    expect(() => acceptance(org, "coin", window, [])).toThrow("membership");
    expect(acceptance(org, "coin", window, { ...records, membership: new Map([[org, []]]) })).toBeNull();
  });

  it("returns null for no observations and rejects missing or invalid windows", () => {
    expect(acceptance([a], "coin", window, [])).toBeNull();
    expect(acceptance([a], "coin", window, [take(2, b), take(2, a, "grain")])).toBeNull();
    for (const invalid of [null, undefined, { from: 4, to: 1 }, { from: NaN, to: 4 }, { from: 1, to: Infinity }]) {
      expect(() => acceptance([a], "coin", invalid, [])).toThrow("window");
    }
  });

  it("replays frozen inputs exactly through the nullable unit-1 observer out port", () => {
    const records = Object.freeze([Object.freeze(refusal(2)), Object.freeze(take(3, b))]);
    const before = JSON.stringify(records);
    expect(paymentAcceptancePort).toMatchObject({ quantity: "society.payment_acceptance_share", unit: "1", nullable: true });
    expect(paymentAcceptancePort.read([a, b], "coin", window, records)).toBe(0.5);
    expect(paymentAcceptancePort.read([a, b], "coin", window, records)).toBe(0.5);
    expect(JSON.stringify(records)).toBe(before);
  });
});

describe("completed exchanges on the one network (DESIGN §1.17, §1.1)", () => {
  it("records one contact per directed party pair and uses the existing reinforcement and decay", () => {
    const net = network();
    net.recordExchange(exchange);
    expect(net.ties()).toMatchObject([
      { i: a, j: b, kinds: ["trade"], w: 0.25, lambda: 2, t_last: 0 },
      { i: b, j: a, kinds: ["trade"], w: 0.25, lambda: 2, t_last: 0 },
    ]);
    net.recordExchange(exchange);
    expect(net.ties().map((tie) => tie.w)).toEqual([0.4375, 0.4375]);
    net.advanceTo(4 * DAY, []);
    for (const tie of net.ties()) expect(tie.w).toBeCloseTo(0.21875, 14);
    net.cutPerson(b);
    expect(net.advanceTo(8 * DAY, [])).toEqual([]);
  });

  it("adds trade to existing ties without reinforcing their other kinds", () => {
    const net = network([trade, { kind: "kin", lambda0: 1, alpha: 0.5, T: 8 }]);
    net.setExposures({ sharedHours: [], households: [], kin: [{ i: a, j: b }], meetings: [] });
    const ids = net.ties().map((tie) => tie.id);
    net.recordExchange(exchange);
    expect(net.ties().map((tie) => tie.id)).toEqual(ids);
    for (const tie of net.ties()) expect(tie).toMatchObject({ kinds: ["kin", "trade"], w: 0.25, lambda: 3 });
  });

  it("requires trade calibration and validates all parties and clock before mutation", () => {
    const missing = network([]);
    expect(() => missing.recordExchange(exchange)).toThrow("parameters for trade");
    expect(missing.ties()).toEqual([]);
    for (const key of ["lambda0", "alpha", "T"] as const) {
      for (const value of [null, undefined]) expect(() => network([{ ...trade, [key]: value } as KindParameters])).toThrow(key);
    }
    const net = network();
    const stranger = mintId({ person: 3 }, "person").id;
    expect(() => net.recordExchange({ ...exchange, legs: [...exchange.legs, { to: stranger, asset: "coin" }] })).toThrow("unknown person");
    expect(() => net.recordExchange({ ...exchange, day: 1 })).toThrow("act time");
    expect(net.ties()).toEqual([]);
  });
});
