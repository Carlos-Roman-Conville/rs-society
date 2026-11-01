import { categorical, createBeliefStore, DEFAULT_COGNITIVE_PARAMS, gaussian, getBelief, setBelief } from "@rex/cognition";
import type { BeliefStore, MemoryState, MindConfig, MindInput, Stimulus } from "@rex/cognition";
import type { SocialOffer } from "../../src/index.ts";
import type { ActionModel } from "./host.ts";

/** fixture: the complete D-SOC-1 three-person belief vocabulary. These are host
 * hypotheses, not Society state. All priors are ignorant of the actual charter. */
export const BELIEFS = {
  ready: { attribute: (kind: string) => `ready:${kind}`, support: ["no", "yes"], prior: [0.5, 0.5] },
  dues: { attribute: "dues", priorMean: 0, priorVariance: 1_000_000 },
  relief: { attribute: "relief", priorMean: 0, priorVariance: 1_000_000 },
  balance: { about: "self", attribute: "balance", priorMean: 0, priorVariance: 1_000_000 },
  result: { about: "attempt", attribute: "result", support: ["admitted", "refused"] },
} as const;
export const KINDS = ["found", "join", "leave", "pay", "attend", "propose", "support", "oppose", "abstain",
  "seek_contact", "avoid_contact", "stand", "participate", "marry", "move"] as const;

export function mean(beliefs: BeliefStore, about: string, attribute: string): number | undefined {
  const belief = getBelief(beliefs, about, attribute);
  return belief?.kind === "gaussian" ? belief.mean : undefined;
}
export function ready(beliefs: BeliefStore, about: string, kind: string): number {
  const belief = getBelief(beliefs, about, BELIEFS.ready.attribute(kind));
  return belief?.kind === "categorical" ? belief.probabilities[belief.values.indexOf("yes")] ?? 0 : 0;
}

export function fixtureMemory(targets: readonly string[]): MemoryState {
  let beliefs = createBeliefStore();
  // Initialization declares uncertain supports only; no actual terms enter here.
  for (const target of targets) {
    for (const kind of KINDS) beliefs = setBelief(beliefs, target, BELIEFS.ready.attribute(kind),
      categorical(BELIEFS.ready.support, BELIEFS.ready.prior), "ignorance");
    for (const key of [BELIEFS.dues, BELIEFS.relief]) beliefs = setBelief(beliefs, target, key.attribute,
      gaussian(key.priorMean, key.priorVariance), "ignorance");
  }
  beliefs = setBelief(beliefs, BELIEFS.balance.about, BELIEFS.balance.attribute,
    gaussian(BELIEFS.balance.priorMean, BELIEFS.balance.priorVariance), "ignorance");
  return { beliefs, episodes: [], reliability: [] };
}

/** fixture subjective models (DESIGN §2.2 / IF-46): closures capture only action
 * identity, never offer terms, ledger balances, membership or a charter. */
export function fixtureModel(offer: Pick<SocialOffer, "kind" | "target">): ActionModel {
  const { kind, target } = offer;
  return { domain: "people", duration: 1, cost: 0, capacityRequired: 1,
    preconditions: [
      { id: "believed opportunity", probability: (beliefs) => ready(beliefs, target, kind) },
      ...(["join", "pay"].includes(kind) ? [{ id: "believed affordable dues", probability: (beliefs: BeliefStore) => {
        const balance = mean(beliefs, BELIEFS.balance.about, BELIEFS.balance.attribute);
        const dues = mean(beliefs, target, BELIEFS.dues.attribute);
        return balance !== undefined && dues !== undefined && balance >= dues ? 1 : 0;
      } }] : []),
    ],
    outcomeSpace: [
      { id: "admitted", success: true, deficits: {}, goalProgress: { mutual_aid: 1 } },
      { id: "refused", success: false, deficits: {}, goalProgress: {} },
    ],
    naiveModel: (beliefs) => {
      const p = ready(beliefs, target, kind);
      return categorical(BELIEFS.result.support, [p, 1 - p]);
    } };
}

export function fixtureMind(config: string, targets: readonly string[]): { input: MindInput; config: MindConfig } {
  const model = fixtureModel({ kind: "found", target: "self" });
  return {
    input: { config, memory: fixtureMemory(targets), capacityFunctional: 1,
      needs: { needs: [], goals: [{ id: "mutual_aid", value: 1, progress: 0 }] },
      params: { ...DEFAULT_COGNITIVE_PARAMS, beta: 100 } }, // fixture choice temperature, not calibration.
    config: { generation: { repertoire: [], thetaPre: 0.75,
      wait: { ...model, id: "fixture.wait", targetKind: "self", preconditions: [], capacityRequired: 0,
        outcomeSpace: model.outcomeSpace.map((outcome) => ({ ...outcome, goalProgress: {} })),
        naiveModel: () => categorical(BELIEFS.result.support, [1, 0]) } },
    learning: { encode: true,
      appraise: ({ observations }) => {
        const result = observations.find((o) => o.about === BELIEFS.result.about && o.attribute === BELIEFS.result.attribute);
        return { outcome: result?.kind === "categorical" ? result.value : "refused" };
      },
      latents: targets.map((target) => ({ id: `dues:${target}`, kind: "gaussian", about: target,
        attribute: BELIEFS.dues.attribute, domain: "people",
        likelihood: ({ observations, memory }) => {
          const term = observations.find((o) => o.about === target && o.attribute === BELIEFS.dues.attribute);
          if (term?.kind === "real") return { mean: term.value, variance: term.model.sigma ** 2 };
          // fixture uninformative likelihood for outcomes with no dues evidence.
          return { mean: mean(memory.beliefs, target, BELIEFS.dues.attribute)!, variance: 1e100 };
        } })),
    } },
  };
}

/** fixture sensory calibration: exact communication channel, small numeric
 * noise; report content may itself be wrong. No physical validity is claimed. */
export function termStimulus(about: string, attribute: string, value: number, channel: "sight" | "report"): Stimulus {
  return { cue: `${channel}:${about}:${attribute}`, about, attribute, kind: "real", value, channel,
    present: true, detectability: 40, domain: "people", relevance: {} };
}
export function readyStimulus(about: string, kind: string, yes = true): Stimulus {
  return { cue: `${about}:${kind}`, about, attribute: BELIEFS.ready.attribute(kind), kind: "categorical",
    value: yes ? "yes" : "no", values: BELIEFS.ready.support, channel: "sight", present: true,
    detectability: 10, domain: "people", relevance: {} };
}
