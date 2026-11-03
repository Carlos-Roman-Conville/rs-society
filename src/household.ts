import { simTime, transaction, type Participant } from "@rex/kernel";
import type { HouseholdId, PersonId } from "./types.ts";
import { validateArrangement, type HouseholdArrangement } from "./arrangement.ts";

export const HOUSEHOLD_PROCESS = "society.household.structure";

export interface HouseholdRecord {
  id: HouseholdId;
  relation: string;
  members: PersonId[];
  /** Settlement building reference, never temporary physical location. */
  residence: string | null;
  formed_at: number;
  dissolved_at: number | null;
  arrangement?: HouseholdArrangement;
}
export type KinshipRelation = "parent" | "child" | "sibling" | "spouse" | "affine";
export interface KinshipRecord {
  person: PersonId;
  relative: PersonId;
  relation: KinshipRelation;
  since: number;
}
export interface HouseholdFixture {
  constraints: { onePerPerson: boolean };
  persons: PersonId[];
  households: Omit<HouseholdRecord, "dissolved_at">[];
  kinship: { person: PersonId; relative: PersonId; relation: string; since: number }[];
}
export interface LoadedHouseholds {
  constraints: { onePerPerson: boolean };
  persons: PersonId[];
  households: HouseholdRecord[];
  kinship: KinshipRecord[];
}
export interface HouseholdFacts {
  residenceOf?(person: PersonId): string | null;
}

/** PLAN §3 H1: declared relations and fixture constraints, not a family model. */
export function loadHouseholds(fixture: HouseholdFixture, facts?: HouseholdFacts): LoadedHouseholds {
  const ids = new Set<HouseholdId>();
  const households = fixture.households.map((row): HouseholdRecord => {
    if (ids.has(row.id)) throw new Error(`duplicate household id: ${row.id}`);
    ids.add(row.id);
    if (!row.relation?.trim()) throw new Error(`empty household relation: ${row.id}`);
    if (row.arrangement !== undefined) {
      const errors = validateArrangement(row.arrangement);
      if (errors.length) throw new Error(`household ${row.id} arrangement: ${errors.join("; ")}`);
    }
    simTime(row.formed_at, `household ${row.id} formed_at`);
    const members = [...new Set(row.members)];
    if (facts?.residenceOf) for (const person of members) {
      const residence = facts.residenceOf(person);
      if (residence !== row.residence) throw new Error(
        `residence mismatch: person ${person} has ${residence}; household ${row.id} has ${row.residence}`);
    }
    return { ...row, members, dissolved_at: null };
  });
  if (fixture.constraints.onePerPerson) for (const person of fixture.persons) {
    const count = households.filter((household) => household.members.includes(person)).length;
    if (count !== 1) throw new Error(`onePerPerson: person ${person} belongs to ${count} households; expected exactly one`);
  }
  const inverse: Record<KinshipRelation, KinshipRelation> = {
    parent: "child", child: "parent", sibling: "sibling", spouse: "spouse", affine: "affine",
  };
  const kinship = fixture.kinship.map((row): KinshipRecord => {
    if (!Object.hasOwn(inverse, row.relation)) throw new Error(`invalid kinship relation: ${row.relation}`);
    simTime(row.since, "kinship since");
    return { ...row, relation: row.relation as KinshipRelation };
  });
  for (const row of kinship) {
    if (!kinship.some((other) => other.person === row.relative && other.relative === row.person
      && other.relation === inverse[row.relation])) {
      throw new Error(`asymmetric kinship: ${row.person} ${row.relation} ${row.relative} needs ${inverse[row.relation]} reverse`);
    }
  }
  const visiting = new Set<PersonId>(), visited = new Set<PersonId>();
  const visit = (person: PersonId): void => {
    if (visiting.has(person)) throw new Error(`cycle along parent edges at person ${person}`);
    if (visited.has(person)) return;
    visiting.add(person);
    for (const row of kinship) if (row.person === person && row.relation === "parent") visit(row.relative);
    visiting.delete(person);
    visited.add(person);
  };
  for (const row of kinship) visit(row.person);
  return structuredClone({ constraints: fixture.constraints, persons: fixture.persons, households, kinship });
}

export type HouseholdEventKind = "death" | "departure" | "join";
export interface HouseholdEvent {
  id: string;
  t: number;
  kind: HouseholdEventKind;
  person: PersonId;
  household?: HouseholdId;
}
export interface HouseholdLogRecord {
  eventId: string;
  t: number;
  household: HouseholdId;
  kind: "joined" | "left" | "dissolved";
  person?: PersonId;
  cause: string;
}
interface HouseholdState {
  initial: HouseholdRecord[];
  households: HouseholdRecord[];
  kinship: KinshipRecord[];
  dead: Set<PersonId>;
  applied: Set<string>;
  log: HouseholdLogRecord[];
  lastTick: number | null;
}

/** PLAN §3 H3/H6, §8.4 SN-1/SN-2: event accounting only; no holdings.
 * An id remains the household account identity at one member and after dissolution.
 * Implemented in isolation; integration and numerical verification are subsequent units.
 */
export class HouseholdStore implements Participant {
  readonly id = HOUSEHOLD_PROCESS;
  readonly #order: readonly HouseholdEventKind[];
  #state: HouseholdState;

  constructor(loaded: LoadedHouseholds, order: readonly HouseholdEventKind[]) {
    if (!Array.isArray(order) || order.length !== 3 || new Set(order).size !== 3
      || !["death", "departure", "join"].every((kind) => order.includes(kind as HouseholdEventKind))) {
      throw new Error("household event order must declare death, departure and join exactly once");
    }
    this.#order = [...order];
    this.#state = structuredClone({ initial: loaded.households, households: loaded.households,
      kinship: loaded.kinship, dead: new Set<PersonId>(), applied: new Set<string>(), log: [], lastTick: null });
    // Clone separately: initial membership is the immutable base for historical queries.
    this.#state.initial = structuredClone(loaded.households);
  }

  snapshot(): unknown { return structuredClone(this.#state); }
  /** Kernel supplies our own snapshot. Assignment cannot throw; ticks copy before writing. */
  restore(snapshot: unknown): void { this.#state = snapshot as HouseholdState; }

  /** Historical membership is the end-of-tick view; returned ids follow fixture order. */
  householdsOf(person: PersonId, t?: number): HouseholdId[] {
    if (t === undefined) return this.#state.households.filter((row) => row.members.includes(person)).map((row) => row.id);
    simTime(t);
    return this.#state.initial.filter((row) => {
      if (row.formed_at > t) return false;
      let member = row.members.includes(person);
      for (const event of this.#state.log) if (event.household === row.id && event.person === person && event.t <= t) {
        if (event.kind === "joined") member = true;
        if (event.kind === "left") member = false;
      }
      return member;
    }).map((row) => row.id);
  }
  household(id: HouseholdId): HouseholdRecord | undefined {
    return structuredClone(this.#state.households.find((row) => row.id === id));
  }
  members(id: HouseholdId): PersonId[] { return this.household(id)?.members ?? []; }
  /** A detached declaration; membership events never change its terms (PLAN H6). */
  arrangement(household: HouseholdId): HouseholdArrangement | undefined {
    return structuredClone(this.#state.households.find((row) => row.id === household)?.arrangement);
  }
  isMember(person: PersonId, household: HouseholdId, t?: number): boolean {
    if (t !== undefined) return this.householdsOf(person, t).includes(household);
    return this.#state.households.some((row) => row.id === household && row.members.includes(person));
  }
  kin(person: PersonId): KinshipRecord[] {
    return structuredClone(this.#state.kinship.filter((row) => row.person === person));
  }
  log(): HouseholdLogRecord[] { return structuredClone(this.#state.log); }

  applyTick(t: number, events: readonly HouseholdEvent[], extra: readonly Participant[] = []): HouseholdLogRecord[] {
    return transaction([this, ...extra], () => {
      simTime(t);
      const pending = events.filter((event) => !this.#state.applied.has(event.id));
      if (pending.length === 0) return [];
      if (this.#state.lastTick !== null && t < this.#state.lastTick) throw new Error("household tick cannot move backwards");
      this.#state = structuredClone(this.#state);
      const start = this.#state.log.length;
      const sorted = [...pending].sort((a, b) => this.#order.indexOf(a.kind) - this.#order.indexOf(b.kind)
        || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      for (const event of sorted) {
        if (this.#state.applied.has(event.id)) continue;
        if (event.t !== t) throw new Error(`event ${event.id} time ${event.t} differs from tick ${t}`);
        if (!this.#order.includes(event.kind)) throw new Error(`unknown household event kind: ${event.kind}`);
        if (event.kind === "death") {
          this.#state.dead.add(event.person);
          for (const household of this.#state.households) this.#leave(household, event);
        } else {
          if (event.household === undefined) throw new Error(`${event.kind} event ${event.id} requires household`);
          // Administrative departure after death is already accounted for.
          if (event.kind === "departure" && this.#state.dead.has(event.person)) {
            this.#state.applied.add(event.id);
            continue;
          }
          const household = this.#state.households.find((row) => row.id === event.household);
          if (!household) throw new Error(`unknown household ${event.household} in event ${event.id}`);
          if (event.kind === "departure") this.#leave(household, event);
          else {
            if (this.#state.dead.has(event.person)) throw new Error(`dead person ${event.person} cannot join household ${household.id}`);
            if (household.dissolved_at !== null) throw new Error(`cannot join dissolved household ${household.id}; ids are never reused`);
            if (t < household.formed_at) throw new Error(`event ${event.id} precedes household ${household.id} formation`);
            if (!household.members.includes(event.person)) {
              household.members.push(event.person);
              this.#emit(household, event, "joined", "join");
            }
          }
        }
        this.#state.applied.add(event.id);
      }
      this.#state.lastTick = t;
      return structuredClone(this.#state.log.slice(start));
    });
  }

  // PLAN §8.3.1 / §8.4 SN-1: M_next = (M \ L) union J, per ordered event;
  // arrays represent sets, so repeated removals or joins do not alter counts.
  #leave(household: HouseholdRecord, event: HouseholdEvent): void {
    if (!household.members.includes(event.person)) return;
    if (event.t < household.formed_at) throw new Error(`event ${event.id} precedes household ${household.id} formation`);
    household.members = household.members.filter((person) => person !== event.person);
    this.#emit(household, event, "left", event.kind);
    if (household.members.length === 0) {
      household.dissolved_at = event.t;
      this.#emit(household, event, "dissolved", `last member ${event.kind}`);
    }
  }
  #emit(household: HouseholdRecord, event: HouseholdEvent, kind: HouseholdLogRecord["kind"], cause: string): void {
    this.#state.log.push({ eventId: event.id, t: event.t, household: household.id, kind, cause,
      ...(kind === "dissolved" ? {} : { person: event.person }) });
  }
}
