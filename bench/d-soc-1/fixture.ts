import { canonical, streams } from "@rex/kernel";
import type { Stimulus } from "@rex/cognition";
import { CommunicationNetwork, OrganisationStore, mintId } from "../../src/index.ts";
import type { AccountId, Charter, LedgerPort, PersonId, ViewsPort } from "../../src/index.ts";
import village from "../../data/fixtures/village/village.json" with { type: "json" };
import { BELIEFS, fixtureMind, fixtureModel, readyStimulus, termStimulus } from "./beliefs.ts";
import { DSoc1Host } from "./host.ts";

// fixture (test only), DESIGN §3. Three adults from the existing village; this
// small IF-46 case does not claim the full village's multi-seed D1–D7 validation.
export const FIXTURE = {
  people: village.persons.slice(0, 3).map((person) => person.id as PersonId),
  draft: "draft.0001", org: mintId({}, "org").id, place: "fixture.village.meeting-place",
  period: 60_000, horizon: 3_600_000, dueAt: 1_800_000, dues: 5, wrongDues: 2, relief: 10,
  balances: [100, 100, 3],
} as const;
export const CHARTER: Charter = {
  founding: { window: 300_000, min_members: 1 }, admission: [{ type: "open" }],
  obligations: [{ type: "dues", amount: FIXTURE.dues, schedule: { first: FIXTURE.dueAt, period: 86_400_000 } }],
  benefits: [{ type: "transfer", event: "illness", amount: FIXTURE.relief },
    { type: "meeting", activity: "assembly", schedule: { first: FIXTURE.period, period: FIXTURE.period } }],
  decision_procedure: { type: "simple_majority", base: "members", electorate: "all_members",
    eligibility: { type: "members" }, quorum: { type: "count", value: 1 } },
};

export function fixturePorts() {
  const ledger: LedgerPort & { balances: Map<AccountId, number>; rows: unknown[] } = {
    id: "fixture.ledger", balances: new Map(FIXTURE.people.map((person, i) => [person, FIXTURE.balances[i]])), rows: [],
    balance(account) { return this.balances.get(account) ?? 0; },
    transfer(from, to, amount, reason) {
      if (!Number.isFinite(amount) || amount <= 0 || this.balance(from) < amount) throw new Error("Cannot fund fixture transfer");
      this.balances.set(from, this.balance(from) - amount);
      this.balances.set(to, this.balance(to) + amount);
      this.rows.push({ from, to, amount, reason });
    },
    snapshot() { return structuredClone({ balances: this.balances, rows: this.rows }); },
    restore(snapshot) { Object.assign(this, snapshot); },
  };
  const views: ViewsPort & { calls: unknown[] } = {
    id: "fixture.views", calls: [],
    onCreated(id) { this.calls.push({ created: id }); },
    onMerged(source, survivor) { this.calls.push({ source, survivor }); },
    onDissolved(id) { this.calls.push({ dissolved: id }); },
    closeBusiness(id) { this.calls.push({ closed: id }); },
    snapshot() { return structuredClone(this.calls); },
    restore(snapshot) { this.calls = snapshot as unknown[]; },
  };
  return { ledger, views };
}

// fixture experiment controls: network knockout and body-capacity boundary.
export function runThreePerson(seed: number, connected = true, capacityFunctional = 1) {
  const random = streams(seed);
  const ports = fixturePorts();
  const organisation = new OrganisationStore({ start: 0, counters: {}, ...ports, streams: random,
    capabilities: { events: ["illness"], ports: ["settlement.ledger"], procedures: ["simple_majority"] } });
  const network = new CommunicationNetwork({ start: 0, counters: {}, streams: random,
    people: FIXTURE.people.map((id) => ({ id, availableHours: 24 })),
    parameters: { kinds: [{ kind: "neighbour", lambda0: 2_000, alpha: 0.25, T: 4 }], w_min: 0.01, d: 0.001 } });
  const [founder, second, third] = FIXTURE.people;
  network.setExposures({ sharedHours: connected ? [second, third].map((j) => ({ i: founder, j, kind: "neighbour", hours: 1 })) : [],
    households: [], kin: [], meetings: [] });
  const targets = [FIXTURE.draft, FIXTURE.org, ...FIXTURE.people];
  const heard = new Set<PersonId>();
  let paid = false;
  let reconsidered = false;
  const host = new DSoc1Host({ seed, period: FIXTURE.period, random, organisation, network, ledger: ports.ledger,
    people: FIXTURE.people.map((person) => {
      const mind = fixtureMind(person, targets);
      return { person, ...mind, input: { ...mind.input, capacityFunctional } };
    }),
    perception: { k: 0, weberFractions: { sight: 0.0001, report: 0.02, sound: 0.02, touch: 0.0001 } },
    model: fixtureModel,
    draft: (person) => ({ target: FIXTURE.draft, payload: { charter: CHARTER, founders: [person], purpose: "fixture mutual aid" } }),
    feedback: (result, intention) => {
      const stimuli: Stimulus[] = [{ cue: "attempt-result", about: BELIEFS.result.about, attribute: BELIEFS.result.attribute,
        kind: "categorical", values: BELIEFS.result.support, value: result?.kind === "refused" ? "refused" : "admitted",
        channel: "sight", present: true, detectability: 40, domain: "people", relevance: {} }];
      if (result?.cause === "cannot pay dues") {
        // The clerk shows the amount on the posted charter after refusing payment.
        const charter = organisation.get(result.org)!.charter;
        const component = charter.obligations![result.payload!.component as number];
        if (component.type !== "dues") throw new Error("Refusal did not identify dues");
        stimuli.push(termStimulus(intention.target!, BELIEFS.dues.attribute, component.amount!, "sight"));
      }
      return stimuli;
    },
    tick: (current, contacts) => {
      if (current.now === FIXTURE.period) {
        current.observe(founder, [termStimulus(FIXTURE.draft, BELIEFS.dues.attribute, FIXTURE.dues, "sight"),
          termStimulus(FIXTURE.draft, BELIEFS.relief.attribute, FIXTURE.relief, "sight"),
          termStimulus(BELIEFS.balance.about, BELIEFS.balance.attribute, ports.ledger.balance(founder), "sight")],
        { kind: "posted ordinance", place: FIXTURE.place, draft: FIXTURE.draft });
        current.observe(founder, [readyStimulus(FIXTURE.draft, "found")], { kind: "draft prepared" });
        current.decide(founder);
      }
      if (current.now === 2 * FIXTURE.period && current.foundingCircles.some((c) => c.status === "open")) {
        current.observe(founder, [readyStimulus(FIXTURE.draft, "found", false)], { kind: "draft submitted" });
        current.observe(founder, [readyStimulus(FIXTURE.draft, "join")], { kind: "founding consent requested" });
        current.decide(founder);
      }
      const org = organisation.get(FIXTURE.org);
      for (const contact of contacts) {
        if (!org || contact.t < org.founded_at || contact.i !== founder || heard.has(contact.j)) continue;
        if (contact.j !== second && contact.j !== third) continue;
        heard.add(contact.j);
        const dues = contact.j === third ? FIXTURE.wrongDues : FIXTURE.dues;
        current.observe(contact.j, [termStimulus(org.id, BELIEFS.dues.attribute, dues, "report"),
          termStimulus(org.id, BELIEFS.relief.attribute, FIXTURE.relief, "report")],
        { kind: "member testimony", speaker: founder, contact, place: FIXTURE.place, reportedDues: dues });
        current.observe(contact.j, [termStimulus(BELIEFS.balance.about, BELIEFS.balance.attribute,
          ports.ledger.balance(contact.j), "sight")], { kind: "counted purse" });
        current.observe(contact.j, [readyStimulus(org.id, "join")], { kind: "heard invitation", contact: contact.tieId });
        current.observe(contact.j, [readyStimulus(org.id, "pay")], { kind: "heard payment instructions", contact: contact.tieId });
        current.decide(contact.j);
      }
      if (!paid && organisation.obligations.some((due) => due.person === third && due.status === "unpaid")) {
        current.decide(third);
        paid = true;
      } else if (paid && !reconsidered) {
        current.decide(third);
        reconsidered = true;
      }
    },
  });
  const initial = host.runner.state;
  host.scheduler.runUntil(FIXTURE.horizon);
  const result = { seed, initial, minds: host.runner.state, commands: host.runner.log, events: host.bus.since(),
    inputs: host.inputs, bindings: host.bindings, organisations: organisation.organisations(),
    societyEvents: organisation.events, obligations: organisation.obligations,
    ledger: [...ports.ledger.balances], transfers: ports.ledger.rows, views: ports.views.calls,
    streams: random.state(), clocks: { kernel: host.now, organisation: organisation.now, network: network.now } };
  return { ...result, bytes: canonical(result) };
}
