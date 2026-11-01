import type { Mind } from "@rex/cognition";
import type { SocialOffer } from "../../src/index.ts";

/** Observer only: these records never feed a host decision or Society state.
 * Need powers decompose the inside of Cognition's nonlinear drive, not additive
 * utility or a claim that a stochastic intention has one exclusive motive. */
export function decisionEvidence(mind: Mind, offers: readonly SocialOffer[], person: string,
  balance: number, ill: boolean, scheduled: boolean) {
  const trace = mind.decisions.at(-1)!;
  const chosen = trace.candidates.find((c) => c.candidate.action === trace.intention.action)!;
  const kind = trace.intention.action.split(".")[1];
  const founding = kind === "found" || kind === "join" && trace.intention.target?.startsWith("draft.");
  const checks = trace.inputs.generation.checks;
  const consent = checks.filter((c) => c.action.includes(".join.") && c.target?.startsWith("draft."));
  const consentOffered = offers.some((o) => o.kind === "join" && o.target.startsWith("draft."));
  return { person, t: trace.t, intention: trace.intention.id, action: trace.intention.action,
    kind, target: trace.intention.target, balance, ill, scheduled,
    eligibleFound: checks.filter((c) => c.action.includes(".found.") && c.eligible).length,
    consentOffered, eligibleConsent: consent.filter((c) => c.eligible).length,
    consentUnaffordable: consentOffered && consent.some((c) => !c.eligible &&
      c.preconditions.some((p) => p.id === "believed affordable" && p.probability === 0)),
    ...(founding ? { founding: {
      needs: Object.fromEntries(trace.needs.needs.map((n) => [n.definition.id, n.deficit])),
      drivePowers: Object.fromEntries(trace.needs.needs.map((n) => [n.definition.id,
        n.definition.weight * (n.deficit ** trace.params.n -
          (chosen.candidate.effects.find((e) => e.success)?.deficits[n.definition.id] ?? n.deficit) ** trace.params.n)])),
      expectedUtility: chosen.expectedUtility, probability: chosen.probability,
      observations: mind.observations.filter((o) => o.t === trace.t && o.about === "self"),
      matchingEpisodes: trace.inputs.episodes.filter((e) => e.action === trace.intention.action &&
        Object.entries(e.context).every(([key, value]) => trace.inputs.context[key] === value)),
    } } : {}),
  };
}
export type DecisionEvidence = ReturnType<typeof decisionEvidence>;
