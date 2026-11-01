import { streams } from "@rex/kernel";
import type { Stimulus } from "@rex/cognition";
import { CommunicationNetwork, OrganisationStore } from "../../src/index.ts";
import type { Charter, FoundIntention, OrgId, OrganisationEvent, PersonId, SharedHours } from "../../src/index.ts";
import village from "../../data/fixtures/village/village.json" with { type: "json" };
import { BELIEFS, mean, readyStimulus, termStimulus } from "./beliefs.ts";
import { COMPANY, FIXTURES as F, sourcedEconomy } from "./fixtures.ts";
import { compose, AMENDMENT_AMOUNTS } from "./composition.ts";
import { meetingMembers } from "./meetings.ts";
import { DSoc1Host } from "./host.ts";
import { studyPorts } from "./ledger.ts";
import { clamp, studyMind, studyModel } from "./models.ts";
import { StudyMindsRunner } from "./runner.ts";
import { decisionEvidence, type DecisionEvidence } from "./diagnostics.ts";

export type Condition = "baseline" | "high-illness" | "no-network" | "no-shocks" | "illness-only";
export const CONDITIONS: readonly Condition[] = ["baseline", "high-illness", "no-network", "no-shocks", "illness-only"];
type Draft = { target: string; payload: FoundIntention["payload"] };
export interface Spell { person: string; org: string; start: number; end: number; censored: boolean; ties: number; overlap: number }
export interface StudyResult {
  seed: number; condition: Condition; steps: number; initialPopulation: number; finalPopulation: number;
  initialOrganisations: number; minds: number; deaths: number; illnesses: number; foundings: number; reliefFoundings: number;
  dissolutions: number; splits: number; joins: number; leaves: number; transfers: number; finalMoney: number;
  membershipErrors: number; moneyErrors: number; populationErrors: number; ancestryErrors: number;
  hourErrors: number; maxOfferedHours: number; maxRateHours: number; attempts: number; refusals: number;
  misreports: number; mistakenPayments: number; deliveredRefusals: number; unresolved: number;
  crossHousehold: number; endSizes: number[]; endCharters: string[]; overlapSteps: number;
  youngExposure: number; oldExposure: number; youngDeaths: number; oldDeaths: number;
  memberPairs: number; sameOccupation: number; kinPairs: number; randomOccupation: number; randomKin: number;
  spells: Spell[]; foundingTrace: OrganisationEvent[]; eventCount: number; sourceIntentions: number;
  decisions: DecisionEvidence[]; amendmentTrace: OrganisationEvent[]; exitTrace: OrganisationEvent[];
  dissolutionTrace: OrganisationEvent[];
  shockTrace: { t: number; ill: string[]; died: string[]; alive: number; skippedDead: number; purseTotal: number; emptyPurses: number }[];
  ledgerTotals: Record<string, { count: number; amount: number }>;
  networkContacts: number; positiveInteractions: number; openBallots: number;
}

const terms = (charter: Charter) => ({
  dues: charter.obligations?.find((o) => o.type === "dues")?.amount ?? 0,
  relief: charter.benefits?.filter((b) => b.type === "transfer").find((b) => b.event === "illness")?.amount ?? 0,
});
const signature = (charter: Charter) => JSON.stringify(terms(charter));

export function runStudy(seed: number, condition: Condition, steps: number = F.calendar.steps): StudyResult {
  const economy = sourcedEconomy(); // Refuse before creating any state or drawing RNG.
  const random = streams(seed), ports = studyPorts(village.households), period = F.calendar.period;
  const people = village.persons.map((p) => p.id as PersonId), alive = new Set(people);
  const adults = village.persons.filter((p) => p.age >= F.calendar.adultAge).map((p) => p.id as PersonId);
  const organisation = new OrganisationStore({ start: 0, counters: {}, ...ports, streams: random,
    capabilities: { events: ["illness", "death"], ports: ["settlement.ledger"], procedures: ["simple_majority"] } });
  const network = new CommunicationNetwork({ start: 0, counters: {}, streams: random,
    people: people.map((id) => ({ id, availableHours: F.network.hours })),
    parameters: { d: F.network.contactHours, w_min: F.network.wMin,
      kinds: (["household", "kin", "neighbour", "co-worker"] as const).map((kind) => ({ kind,
        lambda0: F.network.lambda0, alpha: F.network.alpha, T: kind === "kin" ? F.network.kinHalfLifeDays : F.network.halfLifeDays })) } });
  const householdPairs = village.households.flatMap((h) => h.members.flatMap((m, i) => h.members.slice(i + 1)
    .map((n) => ({ i: m.person as PersonId, j: n.person as PersonId }))));
  const kin = village.kin.filter((k) => k.from < k.to).map((k) => ({ i: k.from as PersonId, j: k.to as PersonId }));
  const sharedHours: SharedHours[] = village.households.flatMap((h, i) => {
    const next = village.households[(i + 1) % village.households.length];
    const a = h.members[0].person as PersonId, b = next.members[0].person as PersonId;
    return [{ i: a, j: b, kind: "neighbour", hours: F.network.sharedHours }, { i: b, j: a, kind: "neighbour", hours: F.network.sharedHours }];
  });
  // Fixture co-work exposures use shared post parcels; no invented work contact
  // is substituted when the fixture has distinct posts.
  for (const [i, post] of village.posts.entries()) for (const other of village.posts.slice(i + 1)) {
    if (post.parcel === other.parcel) sharedHours.push(
      { i: post.person as PersonId, j: other.person as PersonId, kind: "co-worker", hours: F.network.sharedHours },
      { i: other.person as PersonId, j: post.person as PersonId, kind: "co-worker", hours: F.network.sharedHours });
  }
  network.setExposures(condition === "no-network" ? { households: [], kin: [], sharedHours: [], meetings: [] }
    : { households: householdPairs, kin, sharedHours, meetings: [] });
  const kinSet = new Set(village.kin.map((k) => `${k.from}/${k.to}`));
  // fixture occupation proxy; the village records work posts, not occupations.
  const occupations = new Map(village.posts.map((p, i) => [p.person, i % F.settlement.occupationClasses]));
  const occupationMatch = (a: string, b: string) => occupations.has(a) && occupations.has(b) && occupations.get(a) === occupations.get(b);
  const isKin = (a: string, b: string) => kinSet.has(`${a}/${b}`) || kinSet.has(`${b}/${a}`);
  let allPairs = 0, occPairs = 0, relatedPairs = 0;
  for (const [i, a] of adults.entries()) for (const b of adults.slice(i + 1)) { allPairs++; occPairs += +occupationMatch(a, b); relatedPairs += +isKin(a, b); }
  const result: StudyResult = { seed, condition, steps, initialPopulation: people.length, finalPopulation: people.length,
    initialOrganisations: organisation.organisations().length, minds: people.length, deaths: 0, illnesses: 0, foundings: 0,
    reliefFoundings: 0, dissolutions: 0, splits: 0, joins: 0, leaves: 0, transfers: 0, finalMoney: 0,
    membershipErrors: 0, moneyErrors: 0, populationErrors: 0, ancestryErrors: 0, hourErrors: 0, maxOfferedHours: 0, maxRateHours: 0,
    attempts: 0, refusals: 0, misreports: 0, mistakenPayments: 0, deliveredRefusals: 0, unresolved: 0, crossHousehold: 0,
    endSizes: [], endCharters: [], overlapSteps: 0, youngExposure: 0, oldExposure: 0, youngDeaths: 0, oldDeaths: 0,
    memberPairs: 0, sameOccupation: 0, kinPairs: 0, randomOccupation: occPairs / allPairs, randomKin: relatedPairs / allPairs,
    spells: [], foundingTrace: [], eventCount: 0, sourceIntentions: 0,
    decisions: [], amendmentTrace: [], exitTrace: [], dissolutionTrace: [], shockTrace: [], ledgerTotals: {},
    networkContacts: 0, positiveInteractions: 0, openBallots: 0 };
  const opening = ports.ledger.total(), expected = new Map<OrgId, Set<PersonId>>(), births = new Map<OrgId, number>();
  const openSpells = new Map<string, Omit<Spell, "end" | "censored">>();
  const messages = new Map<PersonId, Map<string, { dues: number; relief: number; peers: number; provenance: unknown }>>();
  const contacted = new Map<PersonId, Set<PersonId>>();
  // Host identity bindings for a finite, initially ignorant declared vocabulary.
  // A topic is allocated on perception only, never by inspecting a mind or by
  // supplying true numeric terms. Exhausted vocabulary remains ineligible.
  const topics = new Map<PersonId, Map<string, string>>();
  function topic(person: PersonId, target: string, allocate = false): string {
    target = host.openProposals.find((p) => p.id === target)?.proposal.target ?? target;
    if (target.startsWith("draft.")) return `draft-option.${target.split(".").at(-1)}`;
    const known = topics.get(person) ?? new Map<string, string>();
    if (allocate && !known.has(target) && known.size < F.cognition.organisationTopics) {
      known.set(target, `known-org.${known.size}`); topics.set(person, known);
    }
    return known.get(target) ?? "unknown-topic";
  }
  const prepared = new Map<PersonId, Draft[]>();
  const offeredHours = new Map<string, number>();
  let eventCursor = 0, outcomeCursor = 0, deciding = people[0];
  const host: DSoc1Host = new DSoc1Host({ seed, period, random, organisation, network, ledger: ports.ledger,
    runnerFactory: (state, configs) => new StudyMindsRunner(state, configs),
    people: people.map((person) => ({ person, ...studyMind(person) })),
    perception: { k: 0, weberFractions: { sight: F.cognition.weber, report: F.cognition.weber, sound: F.cognition.weber, touch: F.cognition.weber } },
    draft: () => { throw new Error("Study uses sourced component compositions"); },
    drafts: (person) => {
      if (host.foundingCircles.some((c) => c.status === "open" && c.intention.person === person)) return [];
      const submitted = new Set(host.foundingCircles.map((c) => c.intention.target));
      return (prepared.get(person) ?? []).filter((d) => !submitted.has(d.target));
    },
    amendments: (offer) => {
      if (offer.payload?.action !== "amend") return [];
      const values = offer.payload.section === "obligations" ? AMENDMENT_AMOUNTS.obligations : AMENDMENT_AMOUNTS.benefits;
      return values.filter((value) => value !== offer.terms.value)
        .map((value) => ({ ...offer, payload: { ...offer.payload, value } }));
    },
    model: (offer) => studyModel({ ...offer, target: topic(deciding, offer.target) }, host.runner.state.minds.find((m) => m.id === host.mindIds.get(deciding))!),
    snapshot: () => ({ unavailable: people.filter((p) => !alive.has(p)) }),
    feedback: (event, intention) => {
      const input: Stimulus[] = [{ cue: "attempt-result", about: BELIEFS.result.about, attribute: BELIEFS.result.attribute,
        kind: "categorical", values: BELIEFS.result.support, value: event?.kind === "refused" ? "refused" : "admitted",
        channel: "sight", present: true, detectability: 40, domain: "people", relevance: {} }];
      if (event?.cause === "cannot pay dues") {
        const org = organisation.get(event.org);
        const person = people.find((p) => `cognition/${host.mindIds.get(p)}` === intention.mind)!;
        if (org) input.push(termStimulus(topic(person, intention.target!), "dues", terms(org.charter).dues, "sight"));
      }
      return input;
    },
    tick: (current, contacts) => {
      const step = current.now / period, existing = organisation.organisations();
      for (const org of existing) (current.now - org.founded_at <= 4 * period ? result.youngExposure++ : result.oldExposure++);
      for (const contact of contacts) {
        result.networkContacts++;
        for (const person of [contact.i, contact.j]) {
          const key = `${person}/${Math.floor(contact.t / F.calendar.day)}`;
          const hours = (offeredHours.get(key) ?? 0) + F.network.contactHours;
          offeredHours.set(key, hours); result.maxOfferedHours = Math.max(result.maxOfferedHours, hours);
          if (hours > F.network.hours) result.hourErrors++;
        }
        for (const [speaker, listener] of [[contact.i, contact.j], [contact.j, contact.i]] as const) {
          const peers = contacted.get(listener) ?? new Set<PersonId>();
          peers.add(speaker); contacted.set(listener, peers);
          const org = existing.find((o) => o.founded_at <= contact.t && o.members.some((m) => m.person === speaker));
          if (!org) continue;
          const values = terms(org.charter), wrong = Number(listener.split(".").at(-1)) % F.cognition.misreportEvery === 0;
          const inbox = messages.get(listener) ?? new Map();
          inbox.set(org.id, { ...values, dues: wrong ? F.cognition.wrongDues : values.dues,
            peers: org.members.filter((m) => m.person !== listener).length,
            provenance: { label: "fixture", kind: "member testimony", speaker, contact, wrong } });
          messages.set(listener, inbox);
        }
      }
      const rates = new Map<PersonId, number>();
      for (const tie of network.ties()) for (const p of [tie.i, tie.j]) rates.set(p, (rates.get(p) ?? 0) + tie.lambda * F.network.contactHours);
      for (const rate of rates.values()) { result.maxRateHours = Math.max(result.maxRateHours, rate); if (rate > F.network.hours + 1e-9) result.hourErrors++; }

      // DESIGN §1.16: sourced quarterly flows; retain household purse and
      // ledger transfers. Keep the periodic harvest stand-in: source frequency
      // per quarter accumulates uniformly; a whole-event boundary marks the
      // affected quarter. This rounding adds no stochastic mechanism or rate.
      const badHarvest = Math.floor(step * economy.harvest) > Math.floor((step - 1) * economy.harvest);
      for (const household of village.households) {
        if (!household.members.some((m) => alive.has(m.person as PersonId))) continue;
        // fixture occupation assignment: existing three post classes map to
        // labourer household, carpenter and smallholder; keeper must research
        // the actual post classes. Never invent a wage for a missing class.
        const workers = village.posts.filter((p) => household.members.some((m) => m.person === p.person) && alive.has(p.person as PersonId));
        const income = workers.reduce((total, worker) => {
          const occupation = occupations.get(worker.person)!;
          const factor = occupation === 2 && badHarvest && condition !== "no-shocks" ? economy.harvestRatio : 1;
          return total + economy.income[occupation] * factor;
        }, 0);
        if (income > 0) ports.ledger.transfer("fixture.external", household.id, income, "fixture income");
        for (const [amount, reason] of [[economy.subsistence, "fixture subsistence"], [economy.rent, "fixture rent"]] as const) {
          const cost = Math.min(amount, ports.ledger.balance(household.id));
          if (cost > 0) ports.ledger.transfer(household.id, "fixture.external", cost, reason);
        }
      }
      const ill = new Set<PersonId>(), died: string[] = [];
      for (const person of people) {
        // fixture Life draws stay paired even in no-shocks and after a death.
        const draws = random.get("fixture.life.hazards", person), sickness = draws(), death = draws();
        if (!alive.has(person) || condition === "no-shocks") continue;
        if (sickness < (condition === "illness-only" ? 0 : condition === "high-illness" ? economy.highIllness : economy.illness)) {
          ill.add(person); result.illnesses++;
          const cost = Math.min(economy.illnessCost, ports.ledger.balance(person));
          if (cost > 0) ports.ledger.transfer(person, "fixture.external", cost, "fixture illness cost");
          for (const org of organisation.memberships(person)) organisation.claim({ org, person, eventId: `illness.${step}.${person}`, event: "illness", t: current.now });
        }
        if (death < economy.death) {
          alive.delete(person); died.push(person); result.deaths++; organisation.removePerson(person, "death"); network.cutPerson(person);
        }
      }
      // A fixed rotating attention schedule, independent of wealth, illness,
      // organisation count and all verdicts. Every resident has a baseline mind;
      // adults rotate; all meeting members and pending founders additionally
      // receive their summons/consent opportunities.
      const selected = new Set<PersonId>(Array.from({ length: F.calendar.decisionsPerStep }, (_, i) => adults[((step - 1) * F.calendar.decisionsPerStep + i) % adults.length]));
      const scheduled = new Set(selected);
      for (const person of meetingMembers(organisation.organisations(), current.now)) selected.add(person);
      for (const circle of current.foundingCircles) if (circle.status === "open") selected.add(circle.intention.person);
      const purses = village.households.map((h) => ports.ledger.balance(h.id));
      result.shockTrace.push({ t: current.now, ill: [...ill], died, alive: alive.size,
        skippedDead: [...selected].filter((p) => !alive.has(p)).length,
        purseTotal: purses.reduce((a, b) => a + b, 0), emptyPurses: purses.filter((b) => b === 0).length });
      for (const person of people.filter((p) => selected.has(p) && alive.has(p))) {
        deciding = person;
        const stimuli: Stimulus[] = [termStimulus("self", "balance", ports.ledger.balance(person), "sight"),
          { cue: "fixture.illness", about: "self", attribute: "danger", kind: "categorical", values: ["no", "yes"],
            value: ill.has(person) ? "yes" : "no", channel: "sight", present: true, detectability: 40, domain: "body", relevance: { threat: 1 } }];
        const drafts = step < steps - F.charter.foundingWindowPeriods ? compose(person, step) : [];
        prepared.set(person, drafts);
        for (const draft of drafts) {
          const value = terms(draft.payload.charter);
          const about = topic(person, draft.target);
          stimuli.push(termStimulus(about, "dues", value.dues, "sight"), termStimulus(about, "relief", value.relief, "sight"), readyStimulus(about, "found"));
          stimuli.push(termStimulus(about, COMPANY.peers, draft.payload.founders.filter((p) => p !== person).length, "sight"));
        }
        for (const circle of current.foundingCircles.filter((c) => c.status === "open" && c.intention.person === person)) {
          stimuli.push(readyStimulus(topic(person, circle.intention.target), "join"));
          stimuli.push(termStimulus(topic(person, circle.intention.target), COMPANY.peers,
            circle.intention.payload.founders.filter((p) => p !== person).length, "sight"));
        }
        for (const [target, message] of messages.get(person) ?? []) {
          const about = topic(person, target, true);
          current.observe(person, [termStimulus(about, "dues", message.dues, "report"), termStimulus(about, "relief", message.relief, "report"),
            termStimulus(about, COMPANY.peers, message.peers, "report")], { ...message.provenance as object, target, topic: about });
          result.misreports += +(message.provenance as { wrong: boolean }).wrong;
          stimuli.push(readyStimulus(about, "join"), readyStimulus(about, "pay"));
        }
        messages.delete(person);
        for (const org of organisation.organisations().filter((o) => o.members.some((m) => m.person === person))) {
          const about = topic(person, org.id, true);
          // fixture posted roster + recognised contact identities, sent through
          // sight perception. The forecast never reads this true-state roster.
          const peers = org.members.filter((m) => m.person !== person);
          stimuli.push(termStimulus(about, COMPANY.peers, peers.length, "sight"),
            termStimulus(about, COMPANY.inside, peers.filter((m) => contacted.get(person)?.has(m.person)).length, "sight"));
          stimuli.push(readyStimulus(about, "leave"), readyStimulus(about, "attend"), readyStimulus(about, "pay"), readyStimulus(about, "propose"));
          for (const proposal of current.openProposals.filter((p) => p.proposal.target === org.id)) {
            stimuli.push(...["support", "oppose", "abstain"].map((kind) => readyStimulus(about, kind)),
              termStimulus(about, "proposed_value", Number(proposal.proposal.payload?.value), "sight"));
          }
          // Founders can inspect their own posted terms. Other members retain
          // their possibly mistaken report until a refusal supplies evidence.
          if (org.founders.includes(person)) {
            const value = terms(org.charter);
            stimuli.push(termStimulus(about, "dues", value.dues, "sight"), termStimulus(about, "relief", value.relief, "sight"));
          }
        }
        current.observe(person, stimuli, { label: "fixture", kind: "own draft, purse and local notices", step });
        current.tickNeeds(person, { "body.hunger_signal": clamp(1 - ports.ledger.balance(person) / F.economy.openingPurse) });
        const decisionBalance = ports.ledger.balance(person);
        current.decide(person);
        result.decisions.push(decisionEvidence(current.runner.state.minds.find((m) => m.id === current.mindIds.get(person))!,
          current.bindings.at(-1)!.offers, person, decisionBalance, ill.has(person), scheduled.has(person)));
      }
      current.resolveProposals();
      // Independent observer accounting, every host step (including all dues
      // dates, including sourced yearly dates on the quarterly clock).
      const events = organisation.events, roster = organisation.organisations();
      for (const event of events.slice(eventCursor)) {
        if (event.intentions.some((i) => i.payload?.action === "amend")) result.amendmentTrace.push(event);
        if (event.kind === "founded") {
          result.foundings++; result.foundingTrace.push(event); births.set(event.org, event.t);
          const founding = event.intentions.find((i) => i.kind === "found") as FoundIntention | undefined;
          const founders = founding?.payload.founders ?? [];
          result.reliefFoundings += +(terms(founding?.payload.charter ?? {}).relief > 0);
          if (!founding || !founders.length || founders.some((p) => !event.intentions.some((i) => i.kind === "join" && i.person === p && i.target === founding.target))) result.ancestryErrors++;
          expected.set(event.org, new Set(founders));
        } else if (event.kind === "joined") { result.joins++; expected.get(event.org)?.add(event.intentions[0].person); }
        else if (event.kind === "left" || event.kind === "expelled") {
          result.exitTrace.push(event);
          result.leaves++; expected.get(event.org)?.delete((event.payload?.person ?? event.intentions[0]?.person) as PersonId);
        } else if (event.kind === "dissolved") {
          result.dissolutionTrace.push(event);
          result.dissolutions++; expected.delete(event.org);
          if (event.t - (births.get(event.org) ?? event.t) <= 4 * period) result.youngDeaths++; else result.oldDeaths++;
        } else if (event.kind === "split") result.splits++;
      }
      eventCursor = events.length;
      if (roster.length !== expected.size) result.membershipErrors++;
      for (const org of roster) {
        const wanted = expected.get(org.id);
        if (!wanted || org.members.length !== wanted.size || org.members.some((m) => !wanted.has(m.person))) result.membershipErrors++;
        if (new Set(org.members.map((m) => ports.aliases.get(m.person))).size > 1) result.crossHousehold++;
        for (const [i, a] of org.members.entries()) for (const b of org.members.slice(i + 1)) {
          result.memberPairs++; result.sameOccupation += +occupationMatch(a.person, b.person); result.kinPairs += +isKin(a.person, b.person);
        }
      }
      const ties = network.ties(), currentKeys = new Set<string>();
      for (const org of roster) for (const member of org.members) {
        const key = `${org.id}/${member.person}`; currentKeys.add(key);
        if (!openSpells.has(key)) {
          const peers = org.members.filter((m) => m.person !== member.person);
          const inside = peers.filter((m) => ties.some((t) => t.i === member.person && t.j === m.person || t.j === member.person && t.i === m.person)).length;
          const overlap = roster.filter((o) => o.id !== org.id && o.members.some((m) => org.members.some((n) => m.person === n.person))).length;
          openSpells.set(key, { org: org.id, person: member.person, start: member.joined_at, ties: inside, overlap });
        }
      }
      for (const [key, spell] of openSpells) if (!currentKeys.has(key)) {
        result.spells.push({ ...spell, end: current.now, censored: false }); openSpells.delete(key);
      }
      if (roster.some((o, i) => roster.slice(i + 1).some((q) => q.members.some((m) => o.members.some((n) => n.person === m.person))))) result.overlapSteps++;
      if (ports.ledger.total() !== opening || [...ports.ledger.balances.values()].some((b) => !Number.isFinite(b) || b < 0)) result.moneyErrors++;
      if (alive.size !== people.length - result.deaths || roster.some((o) => o.members.some((m) => !alive.has(m.person)))) result.populationErrors++;
      const bus = current.bus.since();
      for (const outcome of bus.slice(outcomeCursor).filter((e) => e.type === "fixture.social_outcome")) {
        const value = outcome.payload as { intention: string; result?: OrganisationEvent };
        if (value.result?.kind !== "refused") continue;
        result.refusals++;
        const record = current.runner.state.minds.flatMap((m) => m.intentions).find((r) => r.outcomeEvent === outcome.id);
        if (record && bus.some((e) => e.id === outcome.cause && e.type === "cognition.intention")) result.deliveredRefusals++;
        if (record && value.result.cause === "cannot pay dues" && value.result.intentions.some((i) => i.kind === "pay")) {
          const person = value.result.intentions[0].person;
          const dues = mean(record.trace.beliefs, topic(person, value.result.org), "dues"), balance = mean(record.trace.beliefs, "self", "balance");
          const trueDues = terms(organisation.get(value.result.org)?.charter ?? {}).dues;
          if (dues !== undefined && balance !== undefined && dues <= balance && dues < trueDues) result.mistakenPayments++;
        }
      }
      outcomeCursor = bus.length;
      // Same storage-only compaction as Cognition hungry-pair: observations,
      // beliefs, needs, episodes, current intentions and RNG are untouched.
      // Completed diagnostic traces are already counted above and causal
      // commands remain in runner.log; unresolved founding records must remain.
      current.runner.state = { ...current.runner.state, minds: current.runner.state.minds.map((mind) => ({ ...mind,
        decisions: [], learning: [], intentions: mind.intentions.filter((i) => i.outcomeEvent === undefined) })) };
    },
  });
  host.scheduler.runUntil(steps * period);
  result.positiveInteractions = host.runner.log.filter((c) => c.type === "tickNeeds" && c.inputs.outcomeTags.includes("positive_interaction")).length;
  result.openBallots = host.openProposals.length;
  for (const spell of openSpells.values()) result.spells.push({ ...spell, end: host.now, censored: true });
  const events = host.bus.since();
  const intentions = events.filter((e) => e.type === "cognition.intention");
  result.sourceIntentions = intentions.length;
  result.attempts = intentions.filter((e) => !String((e.payload as { action: string }).action).includes("wait")).length;
  result.unresolved = host.runner.state.minds.flatMap((m) => m.intentions).filter((i) => i.outcomeEvent === undefined).length;
  for (const event of result.foundingTrace) for (const source of event.intentions) {
    if (!intentions.some((e) => {
      const intention = e.payload as { action: string; target?: string; t: number; mind: string };
      return intention.action.includes(`.${source.kind}.`) && intention.target === source.target && intention.t === source.t
        && intention.mind === `cognition/${host.mindIds.get(source.person)}`;
    })) result.ancestryErrors++;
  }
  result.finalPopulation = alive.size; result.finalMoney = ports.ledger.total(); result.transfers = ports.ledger.rows.length;
  for (const row of ports.ledger.rows) {
    const total = result.ledgerTotals[row.reason] ??= { count: 0, amount: 0 };
    total.count++; total.amount += row.amount;
  }
  result.eventCount = organisation.events.length;
  const final = organisation.organisations();
  result.endSizes = final.map((o) => o.members.length).sort((a, b) => a - b);
  result.endCharters = final.map((o) => signature(o.charter)).sort();
  return result;
}
