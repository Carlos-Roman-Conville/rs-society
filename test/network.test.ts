import { readFileSync } from "node:fs";
import { DAY, streams, type Counters } from "@rex/kernel";
import { describe, expect, it } from "vitest";
import {
  CommunicationNetwork, NETWORK_PROCESS, mintId,
  type ExposureInputs, type KindParameters, type NetworkParameters, type OrgId, type PersonId,
} from "../src/index.ts";

// All parameters, seeds, populations, exposures and time spans here are fixture (test only).
let counters: Counters = {};
const people = Array.from({ length: 6 }, () => {
  const minted = mintId(counters, "person"); counters = minted.counters; return minted.id;
});
const [a, b, c, d, e, f] = people;
const org = mintId({}, "org").id;
const baseKind = { lambda0: 2, alpha: 0.25, T: 4 };
const parameters: NetworkParameters = {
  kinds: ["kin", "household", "neighbour", "co-worker", `co-member:${org}`].map((kind) => ({
    kind: kind as KindParameters["kind"], ...baseKind,
  })),
  w_min: 0.01, d: 0.001,
};
const empty: ExposureInputs = { sharedHours: [], households: [], kin: [], meetings: [] };
const shared: ExposureInputs = { ...empty, sharedHours: [{ i: a, j: b, kind: "neighbour", hours: 2 }] };
function network(seed = 27, params = parameters, hours = people.map(() => 24)): CommunicationNetwork {
  return new CommunicationNetwork({
    parameters: params, people: people.map((id, i) => ({ id, availableHours: hours[i] })),
    streams: streams(seed), counters: {}, start: 0,
  });
}

describe("one content-agnostic network (DESIGN §1.1, DUP-60)", () => {
  it("combines Settlement hours, household/kin links and co-attendance in one directed tie", () => {
    const net = network();
    net.setExposures({
      ...shared, households: [{ i: a, j: b }], kin: [{ i: a, j: b }],
      meetings: [{ org, attendees: [a, b], attendance: 3 }],
    });
    const ties = net.ties();
    expect(ties).toHaveLength(2);
    expect(ties[0]).toMatchObject({ i: a, j: b, w: 0, lambda: 14, t_last: null });
    expect(new Set(ties[0].kinds)).toEqual(new Set(["neighbour", "household", "kin", `co-member:${org}`]));
    expect(ties[1]).toMatchObject({ i: b, j: a, lambda: 10 });
    net.setExposures(shared);
    expect(net.ties()).toHaveLength(1);
    expect(net.ties()[0].lambda).toBe(4);
  });

  it("flags missing Settlement without making a random graph or inventing meetings", () => {
    const net = network();
    net.setExposures({ ...empty, sharedHours: null, kin: [{ i: a, j: b }] });
    expect(net.trace).toHaveLength(1);
    expect(net.ties().map(({ i, j }) => [i, j])).toEqual([[a, b], [b, a]]);
    net.setExposures(empty);
    expect(net.trace).toEqual([]);
    expect(net.ties()).toEqual([]);
  });

  it("carries three contents on identical contacts without reading or writing payloads", () => {
    const net = network(); net.setExposures(shared);
    const contents = ["rumour", "doctrine", "technique"].map((type) => new Proxy(Object.freeze({ type }), {
      get() { throw new Error("network inspected payload content"); },
      set() { throw new Error("network wrote payload content"); },
    }));
    const payloads = new Proxy(Object.freeze(contents), {
      get() { throw new Error("network inspected the payload list"); },
      set() { throw new Error("network wrote the payload list"); },
    });
    const contacts = net.advanceTo(10 * DAY, payloads);
    expect(contacts.length).toBeGreaterThan(0);
    for (const contact of contacts) {
      expect(contact.i).toBe(a); expect(contact.j).toBe(b);
      expect(contact.payloads === payloads).toBe(true);
      expect(Number.isSafeInteger(contact.t)).toBe(true);
    }
    expect(Object.keys(net.ties()[0]).sort()).toEqual(["i", "id", "j", "kinds", "lambda", "t_last", "w"]);
  });

  it.each(["tie", "person"] as const)("cut %s cancels pending delivery of all three contents", (cut) => {
    const net = network(); net.setExposures(shared);
    const payloads = ["rumour", "doctrine", "technique"];
    expect(net.advanceTo(DAY, payloads).length).toBeGreaterThan(0);
    if (cut === "tie") net.cutTie(a, b); else net.cutPerson(b);
    expect(net.advanceTo(100 * DAY, payloads)).toEqual([]);
    expect(net.ties()).toEqual([]);
    if (cut === "person") expect(() => net.setExposures(shared)).toThrow("unknown person");
  });

  it("cutPerson removes incoming and outgoing ties and leaves unrelated links", () => {
    const net = network(); net.setExposures({ ...empty, kin: [{ i: a, j: b }, { i: b, j: c }, { i: c, j: d }] });
    net.cutPerson(b);
    expect(net.ties().map(({ i, j }) => [i, j])).toEqual([[c, d], [d, c]]);
    expect(net.measures().components).toEqual([[a], [c, d], [e], [f]]);
  });

  it("declares one network writer, its factual reads, and no content write", () => {
    const manifest = JSON.parse(readFileSync(new URL("../kernel.json", import.meta.url), "utf8"));
    const writers = manifest.processes.filter((p: { writes: string[] }) => p.writes.includes("society.comm_network"));
    expect(writers).toHaveLength(1);
    expect(writers[0]).toMatchObject({ id: NETWORK_PROCESS, writes: ["society.comm_network"] });
    expect(writers[0].reads).toEqual(expect.arrayContaining([
      "settlement.shared_hours", "society.household", "society.kinship", "society.meeting_attendance",
      "mind.episode", "mind.intention",
    ]));
    const source = readFileSync(new URL("../src/network.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/trust|source_credibility|mind\.belief/);
  });
});

describe("Poisson proposals and deterministic Kernel streams (DESIGN §1.1)", () => {
  it("long-run daily count mean and variance both match lambda within three standard errors", () => {
    const net = network(); net.setExposures(shared);
    const n = 4096, lambda = 4;
    const counts = Array.from({ length: n }, () => 0);
    for (const event of net.advanceTo(n * DAY, [])) counts[Math.min(n - 1, Math.floor(event.t / DAY))]++;
    const mean = counts.reduce((sum, x) => sum + x, 0) / n;
    const variance = counts.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1);
    expect(Math.abs(mean - lambda)).toBeLessThan(3 * Math.sqrt(lambda / n));
    // Poisson fourth central moment: lambda + 3 lambda²; unbiased sample variance SE.
    expect(Math.abs(variance - lambda)).toBeLessThan(3 * Math.sqrt(lambda / n + 2 * lambda ** 2 / (n - 1)));
  });

  it("same seed is byte-identical, different seed differs, and chunking preserves events", () => {
    const run = (seed: number, chunked: boolean): string => {
      const net = network(seed); net.setExposures(shared);
      const events = chunked
        ? Array.from({ length: 10 }, (_, i) => net.advanceTo((i + 1) * DAY, ["opaque"])).flat()
        : net.advanceTo(10 * DAY, ["opaque"]);
      return JSON.stringify(events);
    };
    expect(run(27, false)).toBe(run(27, false));
    expect(run(27, false)).toBe(run(27, true));
    expect(run(27, false)).not.toBe(run(28, false));
  });

  it("draws the specified exponential inter-arrival from the named tie stream", () => {
    const net = network(); net.setExposures(shared);
    const tie = net.ties()[0];
    const random = streams(27).get(NETWORK_PROCESS, tie.id);
    let t = 0;
    for (let i = 0; i < 5; i++) {
      t += -Math.log1p(-random()) * DAY / 4;
      expect(net.nextOpportunity(10 * DAY, [])!.t).toBe(Math.ceil(t));
    }
  });

  it("preserves remaining hazard through a rate change and a zero-capacity pause", () => {
    const net = network(); net.setExposures(shared);
    const random = streams(27).get(NETWORK_PROCESS, net.ties()[0].id);
    const original = -Math.log1p(-random()) * DAY / 4;
    const changeAt = Math.floor(original / 2);
    expect(net.advanceTo(changeAt, [])).toEqual([]);
    net.setExposures({ ...shared, sharedHours: [{ i: a, j: b, kind: "neighbour", hours: 4 }] });
    const accelerated = changeAt + (original - changeAt) / 2;
    net.setAvailableHours(a, 0);
    expect(net.advanceTo(changeAt + DAY, [])).toEqual([]);
    net.setAvailableHours(a, 24);
    expect(net.nextOpportunity(10 * DAY, [])!.t).toBe(Math.ceil(accelerated + DAY));
  });

  it("canonicalises input rows and attendees before minting ties", () => {
    const input: ExposureInputs = {
      ...shared, kin: [{ i: c, j: b }, { i: d, j: a }],
      meetings: [{ org, attendees: [d, a, c, b], attendance: 2 }],
    };
    const first = network(), second = network();
    first.setExposures(input);
    second.setExposures({ ...input, kin: [...input.kin].reverse(), meetings: [{ ...input.meetings[0], attendees: [b, c, a, d] }] });
    expect(second.ties()).toEqual(first.ties());
    expect(second.advanceTo(10 * DAY, [])).toEqual(first.advanceTo(10 * DAY, []));
  });

  it("preserves numeric mint order after Kernel's four-digit padding is exhausted", () => {
    const earlier = mintId({ person: 9998 }, "person").id;
    const later = mintId({ person: 9999 }, "person").id;
    const net = new CommunicationNetwork({
      parameters, people: [later, earlier, a].map((id) => ({ id, availableHours: 24 })),
      streams: streams(27), counters: {}, start: 0,
    });
    net.setExposures({ ...empty, kin: [{ i: later, j: a }, { i: earlier, j: a }] });
    expect(net.ties().map(({ i, j }) => [i, j])).toEqual([[a, earlier], [a, later], [earlier, a], [later, a]]);
  });

  it("keeps finite hazard when a tiny rate puts the pending event beyond representable time", () => {
    const net = network();
    net.setExposures({ ...shared, sharedHours: [{ i: a, j: b, kind: "neighbour", hours: 1e-310 }] });
    expect(net.advanceTo(DAY, [])).toEqual([]);
    net.setExposures(shared);
    expect(net.nextOpportunity(10 * DAY, [])).toBeDefined();
  });
});

describe("strength, decay and expressed intentions (DESIGN §1.1)", () => {
  it("halves w at T, does not reinforce opportunities, and keeps t_last as the episode time", () => {
    const net = network(); net.setExposures(shared); net.recordEpisode(a, b, 0);
    expect(net.ties()[0].w).toBe(0.25);
    net.advanceTo(4 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.125, 14);
    expect(net.ties()[0].t_last).toBe(0);
  });

  it("each episode follows w + alpha(1-w) and saturates below one", () => {
    const net = network(); net.setExposures(shared);
    for (let i = 1; i <= 40; i++) {
      net.recordEpisode(a, b, 0);
      const w = net.ties()[0].w;
      expect(w).toBeCloseTo(1 - 0.75 ** i, 14);
      expect(w).toBeLessThan(1);
    }
    expect(net.ties()[0].w).toBeGreaterThan(0.99);
    for (let i = 0; i < 10000; i++) net.recordEpisode(a, b, 0);
    expect(net.ties()[0].w).toBeLessThan(1);
  });

  it("requires an explicit episode kind for alpha, with the longest active half-life", () => {
    const net = network(27, { ...parameters, kinds: [
      ...parameters.kinds.filter((p) => p.kind !== "kin"), { kind: "kin", lambda0: 2, alpha: 0.5, T: 8 },
    ] });
    net.setExposures({ ...shared, kin: [{ i: a, j: b }] });
    expect(() => net.recordEpisode(a, b, 0)).toThrow("episode kind required");
    net.recordEpisode(a, b, 0, "kin");
    net.advanceTo(8 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.25, 14);
    net.recordEpisode(a, b, net.now, "neighbour");
    expect(net.ties()[0].w).toBeCloseTo(0.4375, 14);
    net.advanceTo(12 * DAY, []);
    // DESIGN §1.14 5
    expect(net.ties()[0].w).toBeCloseTo(0.4375 * 2 ** (-4 / 8), 14);
  });

  it("seek creates/strengthens a tie and avoid drops exposure before eventual pruning", () => {
    const net = network();
    net.seek_contact(a, b, 0, "neighbour", 2);
    expect(net.ties()[0]).toMatchObject({ w: 0.25, lambda: 4, t_last: null });
    net.seek_contact(a, b, 0, "neighbour", 2);
    expect(net.ties()).toHaveLength(1);
    expect(net.ties()[0]).toMatchObject({ w: 0.4375, lambda: 4 });
    net.avoid_contact(a, b, 0);
    expect(net.ties()[0]).toMatchObject({ w: 0.4375, lambda: 0 });
    expect(net.advanceTo(40 * DAY, [])).toEqual([]);
    expect(net.ties()).toEqual([]);
  });

  it("keeps subthreshold structural ties, removes only below w_min, and supports zero alpha", () => {
    const net = network(27, { ...parameters, w_min: 0.25 });
    net.setExposures(shared); expect(net.ties()).toHaveLength(1);
    net.recordEpisode(a, b, 0); net.avoid_contact(a, b, 0);
    expect(net.ties()).toHaveLength(1);
    net.advanceTo(1, []); expect(net.ties()).toHaveLength(0);
    const zero = network(27, { ...parameters, kinds: [{ kind: "neighbour", ...baseKind, alpha: 0 }] });
    zero.setExposures(shared); zero.recordEpisode(a, b, 0);
    expect(zero.ties()[0].w).toBe(0);
    zero.advanceTo(1000 * DAY, []); expect(zero.ties()).toHaveLength(1);
  });
});

describe("available hours are a hard invariant (DESIGN §1.1 rate limiter)", () => {
  it("scales both endpoints across many co-memberships and caps every realised person's day", () => {
    const orgs: OrgId[] = [];
    let minted: Counters = {};
    for (let i = 0; i < 20; i++) { const result = mintId(minted, "org"); minted = result.counters; orgs.push(result.id); }
    const hours = [1, 0.65, 2, 0, 0.1, 3];
    const params: NetworkParameters = {
      kinds: orgs.map((id) => ({ kind: `co-member:${id}`, ...baseKind, lambda0: 100 })),
      w_min: 0.01, d: 0.2,
    };
    const net = network(27, params, hours);
    net.setExposures({ ...empty, meetings: orgs.map((org) => ({ org, attendees: people, attendance: 10 })) });
    expect(net.ties()).toHaveLength(30);
    for (let i = 0; i < people.length; i++) {
      const incident = net.ties().filter((tie) => tie.i === people[i] || tie.j === people[i]);
      expect(incident.reduce((sum, tie) => sum + tie.lambda * 0.2, 0)).toBeLessThanOrEqual(hours[i] + 1e-14);
    }
    const totals = new Map<string, number>();
    const events = net.advanceTo(100 * DAY, []);
    expect(events.length).toBeGreaterThan(100);
    for (const event of events) for (const person of [event.i, event.j]) {
      const key = `${Math.floor(event.t / DAY)}:${person}`;
      const count = (totals.get(key) ?? 0) + 1; totals.set(key, count);
      expect(count * 0.2).toBeLessThanOrEqual(hours[people.indexOf(person)]);
    }
    expect(events.some((event) => [event.i, event.j].includes(d))).toBe(false);
    expect(events.some((event) => [event.i, event.j].includes(e))).toBe(false);
  });

  it("rejects capacity reductions below already-offered hours and resets budgets at day boundaries", () => {
    const net = network(27, { ...parameters, d: 1 }, people.map(() => 2));
    net.setExposures(shared);
    const event = net.nextOpportunity(10 * DAY, [])!;
    expect(event).toBeDefined(); expect(net.offeredHours(a)).toBe(1); expect(net.offeredHours(b)).toBe(1);
    expect(() => net.setAvailableHours(b, 0)).toThrow("already offered");
    net.cutTie(a, b);
    net.advanceTo((Math.floor(event.t / DAY) + 1) * DAY, []);
    expect(net.offeredHours(a)).toBe(0); net.setAvailableHours(b, 0);
  });
});

describe("observer-only graph measures (DESIGN §1.1)", () => {
  it("computes degree, local clustering and weak components including isolates", () => {
    const net = network();
    net.setExposures({ ...empty, kin: [{ i: a, j: b }, { i: b, j: c }, { i: c, j: a }, { i: c, j: d }] });
    const result = net.measures();
    expect([...result.degree.values()]).toEqual([2, 2, 3, 1, 0, 0]);
    expect([...result.localClustering.values()]).toEqual([1, 1, 1 / 3, 0, 0, 0]);
    expect(result.components).toEqual([[a, b, c, d], [e], [f]]);
  });
  // Validation to run later (DESIGN §4): compare clustering with independent
  // equal-density random graphs, and occupation/age homophily with shuffled
  // attributes in a host-driven run of exposures + intentions. Neither outcome
  // may be programmed into this network. Requires independent demographic data
  // and Cognition/Settlement integration; these fixtures are verification only.
});

describe("missing parameters and invalid inputs refuse to run", () => {
  it.each(["w_min", "d"] as const)("requires %s, including omitted and null values", (name) => {
    for (const missing of [null, undefined]) {
      expect(() => network(27, { ...parameters, [name]: missing } as NetworkParameters)).toThrow(name);
    }
  });
  it.each(["lambda0", "alpha", "T"] as const)("requires every kind's %s", (name) => {
    for (const missing of [null, undefined]) {
      expect(() => network(27, { ...parameters, kinds: [{ kind: "kin", ...baseKind, [name]: missing }] } as NetworkParameters)).toThrow(name);
    }
  });
  it("requires parameters for newly supplied exposure kinds", () => {
    const net = network(27, { ...parameters, kinds: [] });
    expect(() => net.setExposures(shared)).toThrow("missing lambda0, alpha, T parameters for neighbour");
    expect(net.ties()).toEqual([]);
  });
  it.each([
    { ...parameters, d: 0 }, { ...parameters, d: NaN }, { ...parameters, w_min: -1 }, { ...parameters, w_min: 2 },
    { ...parameters, kinds: [{ kind: "kin" as const, ...baseKind, T: 0 }] },
    { ...parameters, kinds: [{ kind: "kin" as const, ...baseKind, alpha: 2 }] },
    { ...parameters, kinds: [{ kind: "kin" as const, ...baseKind, lambda0: Infinity }] },
  ])("rejects unusable calibration %j", (params) => expect(() => network(27, params)).toThrow());
  it("validates replacement inputs before mutation", () => {
    const net = network(); net.setExposures(shared); const before = net.ties();
    expect(() => net.setExposures({ ...shared, kin: [{ i: a, j: a }] })).toThrow("different people");
    expect(() => net.setExposures({ ...shared, meetings: [{ org, attendees: [a, a], attendance: 1 }] })).toThrow("duplicate");
    expect(() => net.setExposures({ ...shared, kin: [{ i: a, j: b }, { i: b, j: a }] })).toThrow("duplicate");
    expect(net.ties()).toEqual(before);
  });
  it("rejects aggregate numerical overflow without corrupting the live network", () => {
    const net = network(); net.setExposures(shared); const before = net.ties();
    expect(() => net.setExposures({ ...empty, sharedHours: [
      { i: a, j: b, kind: "neighbour", hours: 4e307 },
      { i: a, j: c, kind: "neighbour", hours: 4e307 },
      { i: a, j: d, kind: "neighbour", hours: 4e307 },
    ] })).toThrow("total contact rate");
    expect(net.ties()).toEqual(before);
    net.seek_contact(a, b, 0, "kin", 4e307);
    const sought = net.ties();
    expect(() => net.seek_contact(a, b, 0, "household", 5e307)).toThrow("total contact rate");
    expect(net.ties()).toEqual(sought);
  });
  it("guards clock units, causality, endpoint identity and exposure signs", () => {
    const net = network(); net.setExposures(shared);
    expect(() => net.advanceTo(0.5, [])).toThrow("integer");
    expect(() => net.recordEpisode(a, b, DAY)).toThrow("act time");
    expect(() => net.seek_contact(a, b, 0, "kin", -1)).toThrow("exposure");
    expect(() => net.seek_contact(a, "missing" as PersonId, 0, "kin", 1)).toThrow("unknown person");
    net.advanceTo(DAY, []);
    expect(() => net.advanceTo(0, [])).toThrow("backwards");
  });
});
