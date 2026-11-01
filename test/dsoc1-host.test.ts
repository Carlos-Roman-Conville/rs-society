import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DSoc1Host, mapOffers } from "../bench/d-soc-1/host.ts";
import { BELIEFS, fixtureMemory, fixtureMind, fixtureModel, KINDS, mean } from "../bench/d-soc-1/beliefs.ts";
import { FIXTURE, runThreePerson } from "../bench/d-soc-1/fixture.ts";
import { streams } from "@rex/kernel";
import { categorical } from "@rex/cognition";
import { OrganisationStore, type SocialOffer } from "../src/index.ts";
import { a, charter, foundFixture, network, setup, vote } from "./lifecycle-fixture.ts";

// fixture (test only): seeds and numeric comparisons, not empirical calibration.
describe("D-SOC-1 host / IF-46 (PLATFORM §11b level 2)", () => {
  it("maps every offer one-to-one, retaining handles and host payloads with only numeric terms", () => {
    const offered: SocialOffer[] = KINDS.map((kind) => ({ person: FIXTURE.people[0], kind, t: 0,
      target: kind === "support" ? "proposal.0001" : FIXTURE.org,
      source: { row: "society.organisation", id: FIXTURE.org },
      terms: { dues: 5, relief: 10, role: "warden", organisations: [FIXTURE.org], schedule: { period: 60 } },
      payload: { role: "warden", component: 0 } }));
    offered.push({ ...offered[5], payload: { role: "treasurer", component: 1 } });
    const mapped = mapOffers(offered, fixtureModel);
    expect(mapped).toHaveLength(offered.length);
    expect(new Set(mapped.map((b) => b.action.id)).size).toBe(offered.length);
    for (const [i, binding] of mapped.entries()) {
      expect(binding.action.target).toBe(offered[i].target);
      expect(binding.action.terms).toEqual({ dues: 5, relief: 10, "schedule.period": 60 });
      expect(binding.offer).toEqual(offered[i]);
      expect(binding.action.id).not.toMatch(/warden|treasurer/);
    }
    expect(mapped.find((b) => b.offer.kind === "support")!.action.targetKind).toBe("proposal");
    expect(() => mapOffers([{ ...offered[0], terms: { dues: NaN } }], fixtureModel)).toThrow(/Nonfinite/);
    const beliefs = fixtureMemory([FIXTURE.org]).beliefs;
    const before = JSON.stringify(beliefs);
    const pay = mapped.find((b) => b.offer.kind === "pay")!.action;
    expect(pay.preconditions[0].probability(beliefs)).toBe(0.5);
    expect(JSON.stringify(beliefs)).toBe(before); // Mapping/evaluating transport terms cannot teach a charter.
    const changedTerms = mapOffers([{ ...offered[3], terms: { dues: 1_000_000 } }], fixtureModel)[0].action;
    expect(changedTerms.preconditions.map((p) => p.probability(beliefs)))
      .toEqual(pay.preconditions.map((p) => p.probability(beliefs)));
    const ids = new Map<string, string>();
    const original = mapOffers(offered, fixtureModel, ids);
    const reversed = mapOffers([...offered].reverse(), fixtureModel, ids);
    expect(reversed.map((b) => b.action.id)).toEqual(original.map((b) => b.action.id).reverse());
  });

  it("founds only from Cognition's draft and consent, recruits through testimony, and learns from refused dues (D3b)", () => {
    const run = runThreePerson(27);
    expect(run.organisations).toHaveLength(1);
    const org = run.organisations[0];
    expect(org.members.map((m) => m.person)).toEqual(FIXTURE.people);
    const founding = run.societyEvents.find((event) => event.kind === "founded")!;
    expect(founding.intentions.map((i) => i.kind)).toEqual(["found", "join"]);
    expect(founding.intentions.every((i) => i.person === FIXTURE.people[0])).toBe(true);
    const intentions = run.events.filter((e) => e.type === "cognition.intention");
    expect(intentions.length).toBeGreaterThanOrEqual(6);
    for (const mind of run.minds.minds) expect(mind.intentions.every((i) => i.outcomeEvent !== undefined)).toBe(true);
    expect(run.minds.ignoredOutcomes).toEqual([]);

    const testimonies = run.inputs.filter((i) => (i.provenance as { kind?: string }).kind === "member testimony");
    expect(testimonies.map((i) => i.person).sort()).toEqual(FIXTURE.people.slice(1).sort());
    for (const input of testimonies) {
      const provenance = input.provenance as { speaker: string; contact: { i: string; j: string; t: number } };
      expect(provenance.speaker).toBe(FIXTURE.people[0]);
      expect(provenance.contact.i).toBe(provenance.speaker);
      expect(provenance.contact.j).toBe(input.person);
      expect(provenance.contact.t).toBeGreaterThanOrEqual(founding.t);
      expect(input.t - provenance.contact.t).toBeLessThanOrEqual(FIXTURE.period);
      expect(input.stimuli.every((s) => s.channel === "report")).toBe(true);
    }
    const posted = run.inputs.find((i) => (i.provenance as { kind?: string }).kind === "posted ordinance")!;
    expect(posted.provenance).toMatchObject({ place: FIXTURE.place });
    expect(posted.stimuli.every((s) => s.channel === "sight")).toBe(true);
    const secondMind = run.minds.minds[1];
    const secondJoin = secondMind.decisions.find((d) => d.intention.action.includes(".join."))!;
    const secondReport = testimonies.find((i) => i.person === FIXTURE.people[1])!;
    expect(secondJoin.t).toBeGreaterThanOrEqual(secondReport.t);
    expect(mean(secondJoin.beliefs, FIXTURE.org, BELIEFS.dues.attribute)).toBeCloseTo(FIXTURE.dues, 0);
    for (const mind of run.initial.minds) {
      expect(mean(mind.memory.beliefs, FIXTURE.org, BELIEFS.dues.attribute)).toBe(0);
    }

    const third = run.minds.minds[2];
    const refusal = run.societyEvents.find((event) => event.kind === "refused" && event.intentions.some((i) => i.kind === "pay"))!;
    expect(refusal.cause).toBe("cannot pay dues");
    expect(refusal.intentions[0].person).toBe(FIXTURE.people[2]);
    const learning = third.learning.find((entry) => entry.outcome === "refused")!;
    const update = learning.updates.find((u) => u.id === `dues:${FIXTURE.org}`)!;
    expect(update.prior).toMatchObject({ kind: "gaussian" });
    expect(update.posterior).toMatchObject({ kind: "gaussian" });
    if (!("mean" in update.prior) || !("mean" in update.posterior)) throw new Error("Expected numeric dues learning");
    expect(update.prior.mean).toBeLessThan(FIXTURE.balances[2]);
    expect(update.posterior.mean).toBeGreaterThan(FIXTURE.balances[2]);
    expect(update.posterior.mean).toBeCloseTo(FIXTURE.dues, 2);
    expect(learning.predictionError).toBeLessThan(0);
    const payment = third.decisions.find((d) => d.intention.action.includes(".pay."))!;
    expect(payment.inputs.generation.checks.find((c) => c.action === payment.intention.action)!.eligible).toBe(true);
    // True offer still exists; the mind's corrected belief now excludes it.
    const later = third.decisions.at(-1)!;
    const payCheck = later.inputs.generation.checks.find((c) => c.action.includes(".pay."))!;
    expect(payCheck.eligible).toBe(false);
    expect(later.intention.action).toBe("fixture.wait");
    const outcome = run.events.find((e) => e.type === "fixture.social_outcome" &&
      (e.payload as { result?: { intentions: { kind: string }[] } }).result?.intentions.some((i) => i.kind === "pay"))!;
    expect(intentions.some((i) => i.id === outcome.cause)).toBe(true);
    expect(third.intentions.find((i) => i.intention.id === learning.intention)!.outcomeEvent).toBe(outcome.id);
    expect(run.ledger.reduce((sum, [, balance]) => sum + balance, 0)).toBe(203);
    expect(run.ledger.find(([person]) => person === FIXTURE.people[2])![1]).toBe(3);
    expect(run.clocks).toEqual({ kernel: FIXTURE.horizon, organisation: FIXTURE.horizon, network: FIXTURE.horizon });
    const contacts = run.events.filter((e) => e.type === "society.contact");
    const resets = run.commands.filter((c) => c.type === "tickNeeds" && c.inputs.outcomeTags.includes("positive_interaction"));
    expect(contacts.length).toBeGreaterThan(0);
    expect(resets).toHaveLength(2 * contacts.length);
    const personMind = new Map(FIXTURE.people.map((p, i) => [p, run.initial.minds[i].id]));
    expect(resets.map((c) => "mind" in c ? c.mind : undefined)).toEqual(contacts.flatMap((e) => {
      const contact = e.payload as { i: typeof FIXTURE.people[number]; j: typeof FIXTURE.people[number] };
      return [personMind.get(contact.i), personMind.get(contact.j)];
    }));
  });

  it("replays the complete run byte-identically and keeps perception/decision/contact streams per entity", () => {
    const first = runThreePerson(27);
    expect(runThreePerson(27).bytes).toBe(first.bytes);
    expect(runThreePerson(28).bytes).not.toBe(first.bytes);
    const streamKeys = [...Object.keys(first.streams), ...Object.keys(first.minds.streams)];
    expect(streamKeys.some((key) => key.startsWith("society.network.communication@"))).toBe(true);
    for (const mind of first.minds.minds) {
      expect(streamKeys).toContain(`cognition.perception.detect@cognition/${mind.id}`);
      expect(streamKeys).toContain(`cognition.decision.select@cognition/${mind.id}`);
    }
  });

  it("removing the network prevents testimony and recruitment without changing initial charter priors", () => {
    const run = runThreePerson(27, false);
    expect(run.organisations[0].members.map((m) => m.person)).toEqual([FIXTURE.people[0]]);
    expect(run.inputs.some((i) => (i.provenance as { kind?: string }).kind === "member testimony")).toBe(false);
    expect(mean(run.minds.minds[2].memory.beliefs, FIXTURE.org, BELIEFS.dues.attribute)).toBe(0);
  });

  it("lets Cognition filter a believed founding opportunity against body capacity", () => {
    const run = runThreePerson(27, true, 0);
    expect(run.organisations).toEqual([]);
    const decision = run.minds.minds[0].decisions[0];
    const found = decision.inputs.generation.checks.find((c) => c.action.includes(".found."))!;
    expect(found.preconditions.every((p) => p.probability >= 0.75)).toBe(true);
    expect(found.capacityRequired).toBe(1);
    expect(found.eligible).toBe(false);
    expect(decision.intention.action).toBe("fixture.wait");
  });

  it.each([[true, "obligations"], [false, "obligations"], [true, "benefits"], [false, "benefits"]] as const)("transports expressed amendments and preserves actual quorum (attendance=%s, section=%s)", (present, section) => {
    // fixture (test only): deliberately scheduled decisions prove transport,
    // without changing the study's one-decision-per-person quarterly cadence.
    const { ledger, views } = setup();
    const store = new OrganisationStore({ start: 0, counters: {}, ledger, views,
      capabilities: { events: ["illness"], ports: ["settlement.ledger"], procedures: ["simple_majority"] } });
    const org = foundFixture(store, [a], { ...charter, amendment: vote,
      benefits: [...charter.benefits!, { type: "transfer", event: "illness", amount: 3 }],
      obligations: [{ type: "dues", amount: 3, schedule: { first: 2, period: 1 } }] });
    let desired = "attend";
    const host = new DSoc1Host({ seed: 27, period: 1, random: streams(27), organisation: store,
      network: network([a]), ledger, people: [{ person: a, ...fixtureMind(a, [org]) }],
      perception: { k: 0, weberFractions: { sight: 0.02, sound: 0.02, touch: 0.02, report: 0.02 } },
      draft: () => { throw new Error("No draft needed"); }, drafts: () => [],
      amendments: (offer) => offer.payload?.action === "amend" && offer.payload.section === section
        ? [{ ...offer, payload: { ...offer.payload, value: 1 } }] : [],
      model: (offer) => ({ ...fixtureModel(offer),
        preconditions: [{ id: "fixture scheduled act", probability: () => +(offer.kind === desired) }],
        naiveModel: () => categorical(["admitted", "refused"], [1, 0]) }),
      feedback: () => [],
      tick: (current) => {
        if (present) current.decide(a);
        desired = "propose"; current.decide(a);
        expect(current.openProposals).toHaveLength(1);
        expect(store.get(org)!.charter.obligations![0]).toMatchObject({ amount: 3 });
        desired = "support"; current.decide(a);
        current.resolveProposals();
      },
    });
    host.scheduler.runUntil(1);
    expect(host.openProposals).toEqual([]);
    expect(section === "obligations" ? store.get(org)!.charter.obligations![0] : store.get(org)!.charter.benefits![1])
      .toMatchObject({ amount: present ? 1 : 3 });
    const outcome = store.events.filter((e) => e.intentions.some((i) => i.payload?.action === "amend")).at(-1)!;
    expect(outcome.payload).toMatchObject(present ? { amendmentApplied: true } : { reason: "no quorum" });
    expect(outcome.intentions.map((i) => i.kind)).toEqual(["propose", "support"]);
    expect(host.runner.state.minds[0].intentions.every((i) => i.outcomeEvent !== undefined)).toBe(true);
    const emitted = host.bus.since().filter((e) => e.type === "cognition.intention");
    for (const event of host.bus.since().filter((e) => e.type === "fixture.social_outcome")) {
      expect(emitted.some((i) => i.id === event.cause)).toBe(true);
    }
  });

  it.each([true, false])("uses cross-tick ballots and never fills missing attendance (present=%s)", (present) => {
    // fixture (test only): one deliberately selected action per tick; this
    // checks transport, not the unchanged study's rotating selection schedule.
    const { ledger, views } = setup();
    const store = new OrganisationStore({ start: 0, counters: {}, ledger, views,
      capabilities: { events: ["illness"], ports: ["settlement.ledger"], procedures: ["simple_majority"] } });
    const org = foundFixture(store, [a], { ...charter, amendment: vote, decision_interval: 3,
      obligations: [{ type: "dues", amount: 3, schedule: { first: 10, period: 10 } }] });
    let desired = "propose";
    const host = new DSoc1Host({ seed: 27, period: 1, random: streams(27), organisation: store,
      network: network([a]), ledger, people: [{ person: a, ...fixtureMind(a, [org]) }],
      perception: { k: 0, weberFractions: { sight: 0.02, sound: 0.02, touch: 0.02, report: 0.02 } },
      draft: () => { throw new Error("No draft needed"); }, drafts: () => [],
      amendments: (offer) => offer.payload?.action === "amend" && offer.payload.section === "obligations"
        ? [{ ...offer, payload: { ...offer.payload, value: 1 } }] : [],
      model: (offer) => ({ ...fixtureModel(offer), preconditions: [{ id: "fixture scheduled act",
        probability: () => +(offer.kind === desired && (desired !== "attend" || offer.target.startsWith("fixture.proposal."))) }],
        naiveModel: () => categorical(["admitted", "refused"], [1, 0]) }),
      feedback: () => [], tick: (current) => {
        if (current.now === 1) current.decide(a);
        if (current.now === 2 && present) { desired = "attend"; current.decide(a); }
        if (current.now === 3) { desired = "support"; current.decide(a); }
        current.resolveProposals();
        if (current.now < 4) {
          expect(current.openProposals).toHaveLength(1);
          expect(store.get(org)!.charter.obligations![0]).toMatchObject({ amount: 3 });
        }
      } });
    host.scheduler.runUntil(4);
    expect(host.openProposals).toEqual([]);
    const closed = store.proposals[0];
    expect(closed.ballots.map((v) => [v.kind, v.t])).toEqual([["support", 3]]);
    expect(closed.present).toEqual(present ? [a] : []);
    expect(closed.result?.payload).toMatchObject(present ? { outcome: "accepted" } : { reason: "no quorum" });
    expect(store.get(org)!.charter.obligations![0]).toMatchObject({ amount: present ? 1 : 3 });
    expect(host.runner.state.minds[0].intentions.every((i) => i.outcomeEvent !== undefined)).toBe(true);
    expect(host.inputs.filter((i) => (i.provenance as { kind?: string }).kind === "ballot closed"))
      .toHaveLength(present ? 3 : 2);
    expect(host.bus.since().filter((e) => e.type === "cognition.intention")).toHaveLength(present ? 3 : 2);
  });

  it("keeps Cognition imports in bench and does not give Society a mind input", () => {
    const root = join(import.meta.dirname, "..", "src");
    const files = readdirSync(root, { recursive: true }).filter((name) => typeof name === "string" && name.endsWith(".ts"));
    for (const file of files) expect(readFileSync(join(root, String(file)), "utf8"))
      .not.toMatch(/@rex\/cognition|mind\.(?:belief|needs|source_credibility)/);
  });
});
