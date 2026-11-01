import { categorical, DEFAULT_COGNITIVE_PARAMS, evaluateNeeds, gaussian, setBelief } from "@rex/cognition";
import type { Mind } from "@rex/cognition";
import type { SocialOffer } from "../../src/index.ts";
import { COMPOSITIONS } from "./composition.ts";
import { BELIEFS, fixtureMind, mean, ready } from "./beliefs.ts";
import { COMPANY, FIXTURES as F, NEEDS } from "./fixtures.ts";
import type { ActionModel } from "./host.ts";

export const clamp = (x: number) => Math.min(1, Math.max(0, x));

export const TOPICS = [...COMPOSITIONS.map((_, index) => `draft-option.${index}`),
  ...Array.from({ length: F.cognition.organisationTopics }, (_, i) => `known-org.${i}`)];
export function studyMind(id: string) {
  const row = fixtureMind(id, TOPICS);
  const memory = { ...row.input.memory, beliefs: setBelief(row.input.memory.beliefs, "self", "danger",
    categorical(["no", "yes"], [1 - F.cognition.initialSafety, F.cognition.initialSafety])) };
  for (const target of TOPICS) for (const attribute of [COMPANY.peers, COMPANY.inside]) {
    memory.beliefs = setBelief(memory.beliefs, target, attribute,
      gaussian(COMPANY.priorMean, COMPANY.priorVariance), "ignorance");
  }
  return { config: { ...row.config, learning: { ...row.config.learning!, latents: [] },
    generation: { ...row.config.generation, thetaPre: F.cognition.threshold } },
    input: { ...row.input, memory, params: DEFAULT_COGNITIVE_PARAMS,
      needs: { goals: [], needs: evaluateNeeds(NEEDS, { beliefs: memory.beliefs,
        signals: { "body.hunger_signal": F.cognition.initialHunger }, accumulators: { social_connection: F.cognition.initialSocial },
        elapsedSeconds: 0, outcomeTags: [], cues: [] }) } } };
}

/** fixture one-step forecasts, DESIGN §2.2 / IF-46. Only the deciding mind's
 * subjective beliefs/needs enter these expressions. Offer terms are not read.
 * This is a limited composition vocabulary, not a learned charter-writing model. */
export function studyModel(offer: Pick<SocialOffer, "kind" | "target">, mind: Mind): ActionModel {
  const { kind, target } = offer, beliefs = mind.memory.beliefs;
  const before = Object.fromEntries(mind.needs.needs.map((n) => [n.definition.id, n.deficit]));
  const dues = Math.max(0, mean(beliefs, target, BELIEFS.dues.attribute) ?? 0);
  const relief = Math.max(0, mean(beliefs, target, BELIEFS.relief.attribute) ?? 0);
  const after = { ...before };
  // DESIGN §1.15.1, labelled COMPANY fixture: subjective peers only. No true
  // membership/offer terms enter this forecast; self is excluded in observations.
  const peers = Math.max(0, mean(beliefs, target, COMPANY.peers) ?? COMPANY.priorMean);
  const inside = Math.max(0, mean(beliefs, target, COMPANY.inside) ?? COMPANY.priorMean);
  if (["found", "join", "attend"].includes(kind)) {
    after.social_connection = before.social_connection * COMPANY.peerScale / (peers + COMPANY.peerScale);
  }
  if (["found", "join", "pay", "attend"].includes(kind)) {
    after.safety = before.safety / (1 + relief / F.cognition.reliefScale);
    after.hunger = clamp(before.hunger + dues / F.cognition.hungerCostScale);
  } else if (kind === "leave") {
    after.hunger = clamp(before.hunger - dues / F.cognition.hungerCostScale);
    after.social_connection = clamp(before.social_connection + inside / (inside + COMPANY.peerScale));
  }
  return { domain: "people", duration: 1, capacityRequired: 1,
    cost: kind === "found" ? F.cognition.foundCost : F.cognition.actionCost,
    preconditions: [{ id: "perceived opportunity", probability: (b) => ready(b, target, kind) },
      ...(["join", "pay"].includes(kind) ? [{ id: "believed affordable", probability: (b: typeof beliefs) =>
        (mean(b, "self", "balance") ?? 0) >= (mean(b, target, "dues") ?? Infinity) ? 1 : 0 }] : [])],
    outcomeSpace: [{ id: "admitted", success: true, deficits: after, goalProgress: {} },
      { id: "refused", success: false, deficits: before, goalProgress: {} }],
    naiveModel: (b) => { const p = ready(b, target, kind); return categorical(BELIEFS.result.support, [p, 1 - p]); } };
}
