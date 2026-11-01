import { DAY } from "@rex/kernel";
import type { NeedDefinition } from "@rex/cognition";
import economy from "../../data/fixtures/village/economy.json" with { type: "json" };
import reference from "../../data/charters/reference.json" with { type: "json" };

/** DESIGN §1.16: row IDs are the citations; no fallback for missing research. */
export const ECONOMY_ROWS = {
  labourer: "labourer_household_annual_income",
  craftsmanWage: "carpenter_day_wage_1384_5",
  craftsmanDays: "craftsman_days_worked_per_year",
  smallholder: "smallholder_net_produce_money_value",
  subsistence: "household_annual_subsistence_cost",
  rent: "rent_cottage_or_holding",
  illness: "illness_incidence_per_person_year",
  illnessCost: "wages_lost_to_sickness_wage_earners",
  death: "crude_death_rate_non_plague_years",
  harvestFrequency: "bad_harvest_frequency_1370_1400",
  goodYield: "yield_ratio_good_harvest_c1300",
  poorYield: "yield_ratio_poor_harvest_c1300",
} as const;
type EconomyRow = { id: string; value: unknown };
export const economyRows: readonly EconomyRow[] = Object.values(economy).flat();
export function economyErrors(rows: readonly EconomyRow[] = economyRows): string[] {
  return Object.values(ECONOMY_ROWS).flatMap((id) => {
    const row = rows.find((r) => r.id === id);
    return typeof row?.value !== "number" || !Number.isFinite(row.value) || row.value < 0
      ? [`economy.json row ${id}: required finite nonnegative number; got ${String(row?.value)}`] : [];
  });
}
export function sourcedEconomy(rows: readonly EconomyRow[] = economyRows) {
  const errors = economyErrors(rows);
  if (errors.length) throw new Error(`D-SOC-1 §1.16 refused:\n${errors.join("\n")}`);
  const value = (key: keyof typeof ECONOMY_ROWS) => rows.find((r) => r.id === ECONOMY_ROWS[key])!.value as number;
  // Four quarters/year; no work-day convention replaces observed days. The
  // craftsman is a carpenter proxy. Occupation assignment remains a fixture.
  const income = [value("labourer") / 4, value("craftsmanWage") * value("craftsmanDays") / 4,
    value("smallholder") / 4];
  // Annual cases/person and deaths/1000 divided into four exposures; explicit
  // Bernoulli stand-in, not an inferred survival model. High illness retains
  // the original twofold experimental contrast, not a historical estimate.
  const illness = value("illness") / 4, death = value("death") / 1000 / 4;
  const harvest = value("harvestFrequency") / (10 * 4);
  if ([illness * 2, death].some((p) => p > 1)) throw new Error("Sourced quarterly Life exposure exceeds 1; cannot use Bernoulli stand-in");
  if (harvest > 1) throw new Error(`economy.json row ${ECONOMY_ROWS.harvestFrequency}: more than one harvest shortfall per quarter is unsupported`);
  if (value("goodYield") <= 0) throw new Error(`economy.json row ${ECONOMY_ROWS.goodYield}: requires positive yield`);
  return { income, subsistence: value("subsistence") / 4, rent: value("rent") / 4,
    illness, highIllness: illness * 2, death, illnessCost: value("illnessCost"), harvest,
    // Explicit pre-plague depth proxy, 2/7, only for smallholder produce.
    harvestRatio: value("poorYield") / value("goodYield") };
}

/** Source IDs and component indices travel with every offered component.
 * Amounts stay in English pence; foreign currencies and null amounts are not
 * offered. This is a vocabulary of components, not historical whole charters. */
export const CHARTER_COMPONENTS = reference.flatMap((row) => row.components.map((component, index) =>
  ({ source: `${row.id}/components/${index}`, component })))
  .filter(({ component: c }) => !("amount" in c) || typeof c.amount === "number" &&
    "unit" in c && c.unit === "penny (English d.)");

/** Remaining fixture values are scenario/cognition/transport assumptions, never
 * estimates fitted to a verdict. Founding window and decision interval retain
 * the two-quarter fixture; opening purses retain the original initial stock. */
export const FIXTURES = {
  calendar: { label: "fixture", reason: "Quarterly host deliberation for five 360-day years; repeated dues, founding opportunities and deaths, not a historical generation.",
    day: DAY, period: 90 * DAY, steps: 20, seeds: Array.from({ length: 30 }, (_, i) => i + 1), decisionsPerStep: 12, adultAge: 16 },
  economy: { label: "fixture", reason: "Initial ledger stocks only; all flows and hazards require economy.json.",
    openingPurse: 12, externalOpening: 1_000_000 },
  settlement: { label: "fixture", reason: "Settlement ledger absent; person accounts alias household purses. Residences, kin and work posts are the committed village fixture.",
    occupationClasses: 3 },
  network: { label: "fixture", reason: "Uncalibrated sparse quarterly contact experiment. Household and kin exposures use the genealogy; adjacent household representatives share a meeting place.",
    hours: 2, contactHours: 0.25, sharedHours: 1, lambda0: 0.0005, alpha: 0.25, halfLifeDays: 365, kinHalfLifeDays: 730, wMin: 0.01 },
  charter: { label: "fixture", reason: "Founding/decision timing only; offered components come from reference.json.",
    foundingWindowPeriods: 2, minMembers: 1 },
  cognition: { label: "fixture", reason: "Cognition baseline with three needs; subjective one-step forecasts and finite deliberation cadence are scenario assumptions, not fitted behavior.",
    initialHunger: 0.25, initialSafety: 0.1, initialSocial: 0.5, socialRate: 1 / (90 * 86400),
    threshold: 0.75, foundCost: 0.1, actionCost: 0.02, hungerCostScale: 12, reliefScale: 6,
    weber: 0.02, wrongDues: 0.5, misreportEvery: 3,
    organisationTopics: 8 }, // fixture finite declared vocabulary; unknown topics remain ignorant, never patched at runtime.
} as const;

// fixture (DESIGN §1.15.1): posted rosters/testimony report other members;
// members recognise their previously contacted peers on that roster. Unknown
// counts start at zero with the existing broad numeric prior variance. Reason:
// company requires perceived peers, never a reward for the organisation label.
// The saturating n/(n+1) forecast has a one-peer scale, an unsourced one-step
// expectation, not a contact hazard or a fitted retention coefficient.
export const COMPANY = { label: "fixture", peerScale: 1, priorMean: 0, priorVariance: 1_000_000,
  peers: "company_peers", inside: "inside_contacts" } as const;

// fixture Cognition need definitions, following its hungry-pair baseline. Safety
// is appraised from perceived illness, not supplied to Society as a mind value.
export const NEEDS: readonly NeedDefinition[] = [
  { id: "hunger", category: "physiological", source: { signal: "body.hunger_signal" }, setpoint: 0, weight: 1, salienceTags: ["food"] },
  { id: "safety", category: "safety", source: { appraisal: { about: "self", attribute: "danger", value: "yes" } }, setpoint: 0, weight: 1, salienceTags: ["threat"] },
  { id: "social_connection", category: "belonging", sdt: "relatedness", source: { accumulator: { rate: FIXTURES.cognition.socialRate, reset_on: ["positive_interaction"] } },
    setpoint: 0, weight: 1, salienceTags: ["person"] },
];
