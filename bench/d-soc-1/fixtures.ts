import { DAY } from "@rex/kernel";
import type { NeedDefinition } from "@rex/cognition";

/** Every value here is a fixture, not a researched estimate. Fixed throughout
 * the final 120-run protocol; D4-D6 are observations, never calibration targets.
 *
 * fixture (inherited 5056 vocabulary, beliefs.ts): readiness support no/yes has
 * probabilities .5/.5; numeric terms start at mean 0, variance 1,000,000. Reason:
 * declare ignorance before any charter observation, not historical beliefs.
 * fixture (sensory transport): detectability 10 for readiness, 40 for numerical
 * and result cues, k=0. Reason: exercise perception without claiming calibration.
 * fixture (baseline host action units): duration=1 deliberation, capacity=1;
 * need setpoints=0 and weights=1. Reason: neutral shared baseline units. The
 * original fixtureMind beta=100 is explicitly replaced by DEFAULT_COGNITIVE_PARAMS.
 * fixture (learning): outcome episodes enabled, no charter-term latents or
 * positive-interaction reset tags in this study. Reason: a minimal forecast
 * baseline, with these omissions reported rather than fitted to D6. */
// fixture (5163 amendment transport): reuse the ordinary charter majority and
// quorum unchanged as its explicit amendment component. Proposals use existing
// positive money amounts (dues 1/3; benefits 1/3/6), excluding the current value.
// Reason: a finite member proposal vocabulary permitting both increases and
// decreases without adding a numeric parameter; zero cannot remove a component.
// One host tick is the ballot window because attempts require the original
// intention time to equal the store clock. No extra deliberations or automatic
// attendance/votes are supplied. Proposal forecasts retain the existing neutral
// action model; this missing term-sensitive forecast is reported, never fitted.
export const FIXTURES = {
  calendar: { label: "fixture", reason: "Quarterly host deliberation for five 360-day years; repeated dues, founding opportunities and deaths, not a historical generation.",
    day: DAY, period: 90 * DAY, steps: 20, seeds: Array.from({ length: 30 }, (_, i) => i + 1), decisionsPerStep: 12, adultAge: 16 },
  life: { label: "fixture", reason: "Life is absent until P3; independent per-person quarterly Bernoulli exposures, paired draws across treatments.",
    illness: 0.08, highIllness: 0.16, death: 0.005 },
  economy: { label: "fixture", reason: "Economy absent until P5; shared household purses, quarterly external income and subsistence transfers; every flow stays on the stub ledger.",
    openingPurse: 12, income: 4, subsistence: 3, illnessCost: 3, badHarvestEvery: 4, badHarvestIncome: 1, externalOpening: 1_000_000 },
  settlement: { label: "fixture", reason: "Settlement ledger absent; person accounts alias household purses. Residences, kin and work posts are the committed village fixture.",
    occupationClasses: 3 },
  network: { label: "fixture", reason: "Uncalibrated sparse quarterly contact experiment. Household and kin exposures use the genealogy; adjacent household representatives share a meeting place.",
    hours: 2, contactHours: 0.25, sharedHours: 1, lambda0: 0.0005, alpha: 0.25, halfLifeDays: 365, kinHalfLifeDays: 730, wMin: 0.01 },
  charter: { label: "fixture", reason: "Founder choice vocabulary: Cartesian product of dues and sick-relief components, plus open admission, a meeting and explicit majority rules. No reference charter is selected.",
    dues: [1, 3], sickRelief: [0, 6], foundingWindowPeriods: 2, minMembers: 1, quorum: 1, meeting: "assembly" },
  cognition: { label: "fixture", reason: "Cognition baseline with three needs; subjective one-step forecasts and finite deliberation cadence are scenario assumptions, not fitted behavior.",
    initialHunger: 0.25, initialSafety: 0.1, initialSocial: 0.5, socialRate: 1 / (90 * 86400),
    threshold: 0.75, foundCost: 0.1, actionCost: 0.02, hungerCostScale: 12, reliefScale: 6, socialAfter: 0.25,
    weber: 0.02, wrongDues: 0.5, misreportEvery: 3,
    organisationTopics: 8 }, // fixture finite declared vocabulary; unknown topics remain ignorant, never patched at runtime.
} as const;

// fixture Cognition need definitions, following its hungry-pair baseline. Safety
// is appraised from perceived illness, not supplied to Society as a mind value.
export const NEEDS: readonly NeedDefinition[] = [
  { id: "hunger", category: "physiological", source: { signal: "body.hunger_signal" }, setpoint: 0, weight: 1, salienceTags: ["food"] },
  { id: "safety", category: "safety", source: { appraisal: { about: "self", attribute: "danger", value: "yes" } }, setpoint: 0, weight: 1, salienceTags: ["threat"] },
  { id: "social_connection", category: "belonging", sdt: "relatedness", source: { accumulator: { rate: FIXTURES.cognition.socialRate, reset_on: ["positive_interaction"] } },
    setpoint: 0, weight: 1, salienceTags: ["person"] },
];
