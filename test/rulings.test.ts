import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DAY, streams } from "@rex/kernel";
import {
  classifyInstitution, collectiveChoice, CommunicationNetwork, mintId, validateCharter, validateReference,
  type Charter, type CharterCapabilities, type ChoiceInput, type DecisionProcedure, type ExposureInputs,
  type MajorityBase, type NetworkParameters,
} from "../src/index.ts";
import { classifyInstitution as observer } from "../src/institution.ts";

// fixture (test only): all numerical values, identities, annotations and rule choices below.
const founding = { window: 10, min_members: 1 };
const majority = { type: "simple_majority", base: "cast", electorate: "present",
  eligibility: { type: "members" }, quorum: { type: "count", value: 1 } } as const;
const draft: Charter = { founding, admission: [{ type: "open" }], decision_procedure: majority };
const capabilities: CharterCapabilities = { events: [], ports: ["settlement.ledger"],
  procedures: ["simple_majority", "qualified_majority", "council", "position_holder", "unanimity"] };
const people = Array.from({ length: 10 }, (_, person) => mintId({ person }, "person").id);
const [a, b] = people;
const org = mintId({}, "org").id;
const empty: ExposureInputs = { sharedHours: [], households: [], kin: [], meetings: [] };

describe("DESIGN §1.14 1: references are structural evidence, drafts are executable", () => {
  const reference = { obligations: [{ type: "dues", amount: null,
    schedule: { first: null, period: null }, source_silent: true, note: "Amount and dates were not recorded." }] };

  it("accepts annotated nulls without admission and rejects the same reference as a draft", () => {
    const before = structuredClone(reference);
    expect(validateReference(reference)).toEqual([]);
    expect(validateCharter(reference as Charter, capabilities)).toEqual(expect.arrayContaining([
      "founding: requires an object", "admission: requires at least one admission rule",
      "obligations[0].amount: requires a finite positive number",
    ]));
    expect(reference).toEqual(before);
  });

  it("accepts research rows and local annotations on nested null fields", () => {
    expect(validateReference({ components: [{ section: "obligation", type: "dues", amount: 1,
      schedule: { first: null, period: null, source_silent: true, notes: "Dates not recorded." } }] })).toEqual([]);
    expect(validateReference({ sanctions: [{ type: "fine", amount: 1, procedure: null,
      source_silent: true, note: "No procedure recorded." }] })).toEqual([]);
    expect(validateReference({})).toEqual([]);
  });

  it.each([
    {}, { source_silent: false, note: "Unrecorded" }, { source_silent: true },
    { source_silent: true, note: " " }, { source_silent: "true", note: "Unrecorded" },
  ])("rejects each null without a true flag and a nonempty note: %j", (annotation) => {
    const errors = validateReference({ obligations: [{ type: "dues", amount: null,
      schedule: { first: null, period: null }, ...annotation }] });
    expect(errors).toHaveLength(3);
    expect(errors.every((error) => error.includes("source_silent: true"))).toBe(true);
  });

  it("does not let an annotation for one component cover another", () => {
    expect(validateReference({ obligations: [...reference.obligations, { type: "dues", amount: null }] }))
      .toEqual(["obligations[1].amount: null requires source_silent: true and a nonempty note"]);
  });

  it.each([
    { admission: [{ type: "unknown" }] },
    { obligations: [{ type: "open" }] },
    { decision_procedure: { ...majority, eligibility: { type: "open" } } },
    { decision_procedure: { type: "council", procedure: { type: "unknown" } } },
    { components: [{ section: "unrecorded", type: "open" }] },
    { components: [{ section: "constructor", type: "open" }] },
    { components: [{ section: "admission" }] },
  ])("requires known component types even in references: %j", (reference) => {
    expect(validateReference(reference).some((error) => error.includes("unsupported component"))).toBe(true);
  });

  it("still rejects annotated null parameters when the reference otherwise has complete draft terms", () => {
    expect(validateCharter({ ...draft, obligations: reference.obligations } as Charter, capabilities))
      .toHaveLength(3);
  });

  it.each([null, [], { components: null }, { admission: [null] },
    { decision_procedure: [] }, { admission: [{ type: "vote", procedure: [] }] }])(
    "returns structural diagnostics for malformed component containers: %j", (reference) => {
      expect(validateReference(reference).length).toBeGreaterThan(0);
    },
  );
});

function vote(base: MajorityBase, extra: Partial<ChoiceInput> = {}) {
  const members = people.slice(0, 9);
  return collectiveChoice({ org, t: 1, proposalId: "proposal.1",
    proposal: { person: a, kind: "propose", target: org, t: 0 },
    members, present: members, positions: [], procedure: { ...majority, base },
    intentions: members.map((person, i) => ({ person, t: 1, target: "proposal.1",
      kind: i < 3 ? "support" : i < 5 ? "oppose" : "abstain" })), ...extra });
}

describe("DESIGN §1.14 2: every majority explicitly declares its denominator", () => {
  it("a 3–2 vote with four abstentions passes under cast and fails under members or present", () => {
    expect(vote("cast").payload).toMatchObject({ outcome: "accepted", tally: { denominator: 5 } });
    for (const base of ["members", "present"] as const) {
      expect(vote(base).payload).toMatchObject({ outcome: "rejected", tally: { denominator: 9 } });
    }
  });

  it("distinguishes eligible attendance from all eligible members, including silent members", () => {
    const present = people.slice(0, 5);
    expect(vote("present", { present }).payload).toMatchObject({ outcome: "accepted", tally: { denominator: 5 } });
    expect(vote("members", { present }).payload).toMatchObject({ outcome: "rejected", tally: { denominator: 9 } });
    expect(vote("cast", { intentions: [] }).payload.outcome).toBe("no_act");
  });

  it("applies base to qualified majorities and to council-scoped eligible members", () => {
    for (const base of ["cast", "members"] as const) {
      const nested = { ...majority, type: "qualified_majority", threshold: 0.6, base } as const;
      expect(vote(base, { procedure: nested }).payload.outcome).toBe(base === "cast" ? "accepted" : "rejected");
      const roles = people.slice(0, 9).map((_, i) => `office.${i}`);
      expect(vote(base, { members: people, positions: roles.map((role, i) => ({ role, holder: people[i] })),
        procedure: { type: "council", roles, procedure: nested } }).payload)
        .toMatchObject({ outcome: base === "cast" ? "accepted" : "rejected",
          tally: { denominator: base === "cast" ? 5 : 9 } });
    }
  });

  it.each([undefined, null, "all_members", "", 0])("rejects missing/invalid base %s in simple, qualified and council rules", (base) => {
    for (const type of ["simple_majority", "qualified_majority"] as const) {
      const nested = { ...majority, type, threshold: 0.6, base } as unknown as DecisionProcedure;
      for (const procedure of [nested, { type: "council", roles: ["chair"], procedure: nested } as const]) {
        const errors = validateCharter({ ...draft, decision_procedure: procedure,
          positions: [{ ...majority, position: "chair", term: "indefinite" }] }, capabilities);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain(".base: requires cast, present or members");
        expect(() => vote("cast", { procedure, positions: [{ role: "chair", holder: a }] })).toThrow("base");
      }
    }
  });

  it("leaves undeclared tie-breaks as no-act and requires no base for unanimity", () => {
    expect(vote("cast", { intentions: [
      { person: a, kind: "support", target: "proposal.1", t: 1 },
      { person: b, kind: "oppose", target: "proposal.1", t: 1 },
    ] }).payload.reason).toBe("tie with no tie-break");
    const { base: _, ...conditions } = majority;
    expect(validateCharter({ ...draft, decision_procedure: { ...conditions, type: "unanimity" } }, capabilities)).toEqual([]);
  });
});

describe("DESIGN §1.14 3: founding terms are required and classification stays observational", () => {
  it.each([
    undefined, {}, { min_members: 1 }, { window: 10 }, { window: null, min_members: 1 },
    { window: 10, min_members: null }, { window: 10, minimum: 1 },
    { window: 0, min_members: 1 }, { window: 10, min_members: 0 },
    { window: 1.5, min_members: 1 }, { window: 10, min_members: Number.MAX_SAFE_INTEGER + 1 },
  ])("invalidates missing/invalid founding terms before found() is attempted: %j", (founding) => {
    const errors = validateCharter({ ...draft, founding } as Charter, capabilities);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((error) => error.startsWith("founding"))).toBe(true);
  });

  it("accepts explicit founding terms and exports the same observer from the barrel", () => {
    expect(validateCharter(draft, capabilities)).toEqual([]);
    expect(classifyInstitution).toBe(observer);
  });

  it("no src module imports institution; only the package barrel re-exports the observer", () => {
    const root = new URL("../src/", import.meta.url);
    for (const name of readdirSync(root, { recursive: true }).map(String).filter((name) => name.endsWith(".ts"))) {
      let code = readFileSync(new URL(name.replaceAll("\\", "/"), root), "utf8");
      if (name === "index.ts") code = code.replace('export { classifyInstitution } from "./institution.ts";', "");
      expect(code, name).not.toMatch(/(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s*)["'][^"']*institution(?:\.ts)?["']/);
      if (name !== "institution.ts") expect(code, name).not.toContain("classifyInstitution");
    }
  });
});

describe("DESIGN §1.14 4: available hours are bounded separately on every kernel day", () => {
  it("bounds both rate-hours and realised hours for every person on a 30-day seeded run", () => {
    const members = people.slice(0, 4), hours = [1, 2, 0.25, 0], duration = 0.25;
    const net = new CommunicationNetwork({ start: 0, streams: streams(5053), counters: {},
      people: members.map((id, i) => ({ id, availableHours: hours[i] })),
      parameters: { kinds: [{ kind: "co-worker", lambda0: 100, alpha: 0.2, T: 2 }], w_min: 0.01, d: duration } });
    const exposures: ExposureInputs = { ...empty, sharedHours: members.flatMap((i) => members.filter((j) => j !== i)
      .map((j) => ({ i, j, kind: "co-worker" as const, hours: 8 }))) };
    net.setExposures(exposures);
    let total = 0;
    for (let day = 0; day < 30; day++) {
      for (const [index, person] of members.entries()) {
        const rates = net.ties().filter((tie) => tie.i === person || tie.j === person);
        expect(rates.reduce((sum, tie) => sum + tie.lambda * duration, 0)).toBeLessThanOrEqual(hours[index] + 1e-14);
      }
      const events = net.advanceTo((day + 1) * DAY - 1, []);
      total += events.length;
      for (const [index, person] of members.entries()) {
        const used = events.filter((event) => event.i === person || event.j === person).length * duration;
        expect(used).toBeLessThanOrEqual(hours[index]);
        expect(net.offeredHours(person)).toBe(used);
      }
      expect(events.every((event) => Math.floor(event.t / DAY) === day)).toBe(true);
      // Replacing exposure must not replenish today's budget.
      const offered = members.map((person) => net.offeredHours(person));
      net.setExposures(exposures);
      expect(members.map((person) => net.offeredHours(person))).toEqual(offered);
    }
    expect(total).toBeGreaterThan(30);
    net.cutTie(a, b); net.cutTie(b, a);
    net.advanceTo(30 * DAY, []);
    for (const person of members) expect(net.offeredHours(person)).toBe(0);
  });
});

const decayParameters: NetworkParameters = { w_min: 0.001, d: 0.25,
  kinds: [{ kind: "kin", lambda0: 0, alpha: 0.5, T: 8 }, { kind: "co-worker", lambda0: 0, alpha: 0.25, T: 2 }] };
function mixedTie() {
  const net = new CommunicationNetwork({ start: 0, streams: streams(5053), counters: {}, parameters: decayParameters,
    people: [a, b].map((id) => ({ id, availableHours: 1 })) });
  net.setExposures({ ...empty, kin: [{ i: a, j: b }], sharedHours: [{ i: a, j: b, kind: "co-worker", hours: 8 }] });
  return net;
}

describe("DESIGN §1.14 5: mixed ties decay with the longest currently held half-life", () => {
  it("keeps kin decay after a co-worker episode, while work exposure is active and after it ends", () => {
    const net = mixedTie();
    net.recordEpisode(a, b, 0, "co-worker");
    net.advanceTo(8 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.125, 14);
    net.setExposures({ ...empty, kin: [{ i: a, j: b }] });
    expect(net.ties()[0].kinds).toEqual(["kin"]);
    expect(() => net.recordEpisode(a, b, net.now, "co-worker")).toThrow("must belong");
    net.advanceTo(16 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.0625, 14);
  });

  it("switches to the shorter half-life when kin exposure ends, without retroactive decay", () => {
    const net = mixedTie();
    net.recordEpisode(a, b, 0, "kin");
    net.advanceTo(8 * DAY, []);
    net.setExposures({ ...empty, sharedHours: [{ i: a, j: b, kind: "co-worker", hours: 8 }] });
    expect(net.ties()[0]).toMatchObject({ kinds: ["co-worker"], w: 0.25 });
    net.advanceTo(10 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.125, 14);
  });

  it("decays the old interval before a sought longer-lived kind is added", () => {
    const net = mixedTie();
    net.setExposures({ ...empty, sharedHours: [{ i: a, j: b, kind: "co-worker", hours: 8 }] });
    net.recordEpisode(a, b, 0);
    net.advanceTo(2 * DAY, []);
    net.seek_contact(a, b, net.now, "kin", 1);
    expect(net.ties()[0].w).toBeCloseTo(0.125 + 0.5 * (1 - 0.125), 14);
    net.setExposures(empty); // Sought kin exposure still holds; structural work ends.
    expect(net.ties()[0].kinds).toEqual(["kin"]);
    net.advanceTo(10 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.5625 / 2, 14);
    net.avoid_contact(a, b, net.now);
    expect(net.ties()[0].kinds).toEqual([]);
    net.advanceTo(18 * DAY, []);
    expect(net.ties()[0].w).toBeCloseTo(0.5625 / 4, 14);
  });
});
