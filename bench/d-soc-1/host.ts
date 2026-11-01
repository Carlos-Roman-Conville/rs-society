import { EventBus, Scheduler, qualify } from "@rex/kernel";
import type { ProcessContext, RandomStreams } from "@rex/kernel";
import { MindsRunner, createMindsState, perceive } from "@rex/cognition";
import type { ActionDefinition, Intention, MindConfig, MindInput, PerceptionParams, Stimulus } from "@rex/cognition";
import { FORMATION_PROCESS, offers } from "../../src/index.ts";
import type { AffordanceState, AttemptContext, CommunicationNetwork, ContactOpportunity, FoundIntention,
  FoundingCircle, LedgerPort, OrganisationEvent, OrganisationStore, PersonId, SocialIntention,
  SocialOffer, TieKind } from "../../src/index.ts";

export type ActionModel = Omit<ActionDefinition, "id" | "target" | "targetKind" | "terms">;
export interface BoundAction { readonly offer: SocialOffer; readonly action: ActionDefinition }

/** IF-46: transport numeric leaves only. Roles, ids and executable charter data
 * remain in the host binding; no term is used as a belief or an eligibility test. */
function numericTerms(value: unknown, path = "", result: Record<string, number> = {}): Record<string, number> {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Nonfinite offer term: ${path}`);
    result[path] = value;
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) numericTerms(child, path ? `${path}.${key}` : key, result);
  }
  return result;
}

export function mapOffers(input: readonly SocialOffer[], model: (offer: SocialOffer) => ActionModel,
  ids = new Map<string, string>()): BoundAction[] {
  return input.map((source) => {
    const offer = structuredClone(source);
    // Payload distinguishes multiple payments, meetings and role proposals on one target.
    const key = JSON.stringify([offer.source.row, offer.source.id, offer.kind, offer.target, offer.payload ?? {}]);
    // The lookup key stays host-side: action ids must not smuggle charter/role
    // content into Cognition. A host retains this mint-order registry across ticks.
    if (!ids.has(key)) ids.set(key, `fixture.${offer.kind}.${ids.size + 1}`);
    const id = ids.get(key)!;
    return { offer, action: { ...model(offer), id, target: offer.target,
      targetKind: ["support", "oppose", "abstain"].includes(offer.kind) ? "proposal"
        : offer.source.row === "society.comm_network" ? "person"
          : offer.source.row === FORMATION_PROCESS ? "draft" : "organisation",
      terms: numericTerms(offer.terms) } };
  });
}

export interface HostPerson {
  readonly person: PersonId;
  readonly input: MindInput;
  readonly config: MindConfig;
}
interface Pending { person: PersonId; intention: Intention; event: string; offer: SocialOffer }
interface Circle { intention: FoundIntention; pending: Pending[]; joins: SocialIntention[]; status: FoundingCircle["status"] }
export interface HostOptions {
  readonly seed: number;
  readonly period: number;
  readonly random: RandomStreams;
  readonly organisation: OrganisationStore;
  readonly network: CommunicationNetwork;
  readonly ledger: LedgerPort;
  readonly people: readonly HostPerson[];
  readonly perception: PerceptionParams;
  readonly model: (offer: SocialOffer) => ActionModel;
  readonly draft: (person: PersonId) => { target: string; payload: FoundIntention["payload"] };
  readonly tick: (host: DSoc1Host, contacts: readonly ContactOpportunity<never>[]) => void;
  readonly feedback: (result: OrganisationEvent | undefined, intention: Intention) => readonly Stimulus[];
  readonly snapshot?: () => Partial<AffordanceState>;
  readonly attemptContext?: (offer: SocialOffer) => AttemptContext;
  readonly contactAction?: { kind: TieKind; exposure: number };
}

/** Bench-only IF-46 adapter. Society receives expressed intentions and its own
 * factual snapshots; Cognition owns every update to mind state. One scheduler
 * supplies time to both stores and all mind commands. Contacts are delivered at
 * the next host tick (latency <= period), retaining their original timestamps. */
export class DSoc1Host {
  readonly bus = new EventBus();
  readonly scheduler: Scheduler;
  readonly runner: MindsRunner;
  readonly mindIds = new Map<PersonId, string>();
  readonly inputs: { person: PersonId; t: number; provenance: unknown; stimuli: readonly Stimulus[] }[] = [];
  readonly bindings: { person: PersonId; t: number; offers: readonly SocialOffer[] }[] = [];
  private readonly configs: Record<string, MindConfig> = {};
  private readonly actionIds = new Map<string, string>();
  private readonly circles: Circle[] = [];
  private context?: ProcessContext;
  private readonly options: HostOptions;

  constructor(options: HostOptions) {
    this.options = options;
    if (options.organisation.now !== 0 || options.network.now !== 0) throw new Error("Host requires stores at t0");
    for (const row of options.people) {
      if (this.configs[row.input.config]) throw new Error("Each person requires a distinct host configuration");
      this.configs[row.input.config] = row.config;
    }
    this.runner = new MindsRunner(createMindsState(options.seed), this.configs);
    for (const row of options.people) {
      if (this.mindIds.has(row.person)) throw new Error("Duplicate host person");
      this.mindIds.set(row.person, this.runner.run({ type: "addMind", mind: row.input }).added!);
    }
    this.scheduler = new Scheduler({ rng: options.random,
      order: { phases: ["host"], order: { host: ["fixture.dsoc1.host"] } },
      emit: (event) => { this.bus.emit(event); } });
    this.scheduler.register({ id: "fixture.dsoc1.host", phase: "host", mechanisms: [], period: options.period,
      run: (ctx) => {
        this.context = ctx;
        try {
          const contacts = options.network.advanceTo<never>(ctx.t, []);
          options.organisation.advanceTo(ctx.t);
          for (const contact of contacts) ctx.emit("society.contact", contact);
          for (const circle of this.circles) {
            if (circle.status === "open" && ctx.t > circle.intention.t + circle.intention.payload.charter.founding!.window!) {
              this.resolveCircle(circle);
            }
          }
          options.tick(this, contacts);
        } finally { this.context = undefined; }
      } });
  }

  get now(): number { return this.scheduler.t; }
  get organisation(): OrganisationStore { return this.options.organisation; }
  get network(): CommunicationNetwork { return this.options.network; }
  get foundingCircles(): readonly FoundingCircle[] { return structuredClone(this.circles.map(({ intention, joins, status }) => ({ intention, joins, status }))); }
  private clock(): ProcessContext {
    if (!this.context) throw new Error("Mind input and intentions must run on the host Kernel tick");
    return this.context;
  }
  private mind(person: PersonId): string {
    const id = this.mindIds.get(person);
    if (!id) throw new Error("Unknown host person");
    return id;
  }
  private perceive(person: PersonId, stimuli: readonly Stimulus[], provenance: unknown) {
    const ctx = this.clock();
    const entity = qualify("cognition", this.mind(person));
    this.inputs.push(structuredClone({ person, t: ctx.t, provenance, stimuli }));
    return perceive(stimuli, stimuli.map(() => 1 / stimuli.length), this.options.perception,
      ctx.t, this.options.random.get("cognition.perception.detect", entity));
  }
  observe(person: PersonId, stimuli: readonly Stimulus[], provenance: unknown): void {
    const observations = this.perceive(person, stimuli, provenance);
    const mind = this.mind(person);
    this.runner.run({ type: "observe", mind, t: this.now, observations,
      perceptionState: this.options.random.state()[`cognition.perception.detect@${qualify("cognition", mind)}`] });
  }

  /** The caller chooses when a person deliberates, never which action wins. */
  decide(person: PersonId): void {
    const ctx = this.clock();
    const snapshot: AffordanceState = { organisations: this.organisation.organisations(), obligations: this.organisation.obligations,
      attendance: [], proposals: [], foundingCircles: this.foundingCircles,
      network: { known: [], ties: this.network.ties() }, ledger: this.options.ledger, facts: {}, unavailable: [],
      ...this.options.snapshot?.() };
    const offered = offers(person, ctx.t, snapshot).map((offer) => {
      if (offer.kind !== "found") return offer;
      const draft = this.options.draft(person);
      return { ...offer, target: draft.target, payload: draft.payload };
    });
    const bound = mapOffers(offered, this.options.model, this.actionIds);
    this.bindings.push({ person, t: ctx.t, offers: structuredClone(offered) });
    const row = this.options.people.find((entry) => entry.person === person)!;
    this.configs[row.input.config] = { ...row.config, generation: { ...row.config.generation, repertoire: bound.map((b) => b.action) } };
    const result = this.runner.run({ type: "decide", mind: this.mind(person), t: ctx.t });
    for (const emission of result.events) {
      ctx.emit(emission.type, emission.payload);
      if (emission.type !== "cognition.intention") continue;
      const event = this.bus.since().at(-1)!.id;
      const intention = emission.payload;
      const binding = bound.find((b) => b.action.id === intention.action && b.action.target === intention.target);
      if (!binding) {
        if (intention.action !== row.config.generation.wait.id) throw new Error("Unbound Cognition intention");
        this.finish({ person, intention, event }, undefined);
        continue;
      }
      const pending = { person, intention, event, offer: binding.offer };
      const { offer } = pending;
      if (offer.kind === "stand") throw new Error("Stand requires a host election proposal");
      const social: SocialIntention = { person, kind: offer.kind, target: offer.target, t: ctx.t, payload: offer.payload };
      if (offer.kind === "found") {
        if (this.circles.some((c) => c.intention.target === offer.target)) throw new Error("Draft identity already submitted");
        this.circles.push({ intention: social as FoundIntention, pending: [pending], joins: [], status: "open" });
        continue;
      }
      const circle = this.circles.find((c) => c.status === "open" && c.intention.target === offer.target);
      if (offer.kind === "join" && circle) {
        circle.joins.push(social);
        circle.pending.push(pending);
        if (circle.intention.payload.founders.every((p) => circle.joins.some((j) => j.person === p))) this.resolveCircle(circle);
      } else if (offer.kind === "seek_contact" || offer.kind === "avoid_contact") {
        if (offer.kind === "avoid_contact") this.network.avoid_contact(person, offer.target as PersonId, ctx.t);
        else {
          const args = this.options.contactAction;
          if (!args) throw new Error("Contact seeking requires explicit kind and exposure");
          this.network.seek_contact(person, offer.target as PersonId, ctx.t, args.kind, args.exposure);
        }
        this.finish(pending, undefined);
      } else {
        this.finish(pending, this.organisation.attempt(social, this.options.attemptContext?.(offer)));
      }
    }
  }

  private resolveCircle(circle: Circle): void {
    const event = this.organisation.found(circle.intention, circle.joins, this.network);
    circle.status = "resolved";
    for (const pending of circle.pending) this.finish(pending, event);
  }
  private finish(pending: Omit<Pending, "offer">, result: OrganisationEvent | undefined): void {
    const ctx = this.clock();
    ctx.emit("fixture.social_outcome", { intention: pending.intention.id, result }, pending.event);
    const event = this.bus.since().at(-1)!;
    const observations = this.perceive(pending.person, this.options.feedback(result, pending.intention), { outcome: event.id });
    // Resolve the public qualified id through the runner's own intention records.
    const record = this.runner.state.minds.flatMap((m) => m.intentions)
      .find((p) => qualify("cognition", p.intention.id) === pending.intention.id)!;
    const learned = this.runner.run({ type: "outcome", event: event.id, cause: pending.event,
      intention: record.intention.id, t: ctx.t,
      feedback: { observations, status: result?.kind === "refused" ? "failed" : "completed" } });
    for (const emission of learned.events) ctx.emit(emission.type, emission.payload, "cause" in emission ? emission.cause : undefined);
  }
}
