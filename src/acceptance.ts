import type { HouseholdId, OrgId, PersonId } from "./types.ts";

export const ACCEPTANCE_PROCESS = "society.convention.payment_acceptance";

/** Host-adapted completed exchanges; recipients are the exchange's parties. */
export interface ExchangeRecord {
  readonly day: number;
  readonly legs: readonly { readonly to: PersonId; readonly asset: string }[];
}
export interface RefusalRecord {
  readonly day: number;
  readonly refusedBy: PersonId;
  readonly asset: string;
  readonly reason: "not-accepted";
}
export type AcceptanceRecord = ExchangeRecord | RefusalRecord;
export type AcceptanceGroup = OrgId | HouseholdId | ReadonlySet<PersonId> | readonly PersonId[];

/** Caller-supplied inclusive day bounds (DESIGN §1.17); no default duration. */
export interface AcceptanceWindow { readonly from: number; readonly to: number }

/** Snapshots only: resolve Society ids from supplied membership/household facts.
 * The host supplies observations in mint order; later rows break equal-day ties.
 * An explicit member set can instead be used with a plain observation array.
 */
export interface AcceptanceRecords {
  readonly observations: readonly AcceptanceRecord[];
  readonly membership?: ReadonlyMap<OrgId, readonly PersonId[]>;
  readonly households?: ReadonlyMap<HouseholdId, readonly PersonId[]>;
}

/** DESIGN §1.17 (keeper ruling, evidence level 4): latest takes / observed members.
 * Unobserved members are excluded, including when every member is unobserved.
 * This projection retains no state and never changes its input records.
 */
export function acceptance(
  group: AcceptanceGroup,
  asset: string,
  window: AcceptanceWindow | null | undefined,
  records: AcceptanceRecords | readonly AcceptanceRecord[],
): number | null {
  if (window == null || !Number.isFinite(window.from) || !Number.isFinite(window.to)
    || window.from > window.to) throw new Error("acceptance window requires finite from <= to day bounds; no default");
  const supplied = "observations" in records ? records : { observations: records };
  const members = typeof group === "string"
    ? supplied.membership?.get(group as OrgId) ?? supplied.households?.get(group as HouseholdId)
    : group;
  if (members === undefined) throw new Error(`acceptance requires supplied membership for group ${group}`);
  const included = new Set(members);
  const latest = new Map<PersonId, { day: number; take: boolean }>();
  const observe = (person: PersonId, day: number, take: boolean): void => {
    if (!included.has(person)) return;
    const previous = latest.get(person);
    if (!previous || day >= previous.day) latest.set(person, { day, take });
  };
  for (const record of supplied.observations) {
    if (!Number.isFinite(record.day)) throw new Error("acceptance record day must be finite");
    if (record.day < window.from || record.day > window.to) continue;
    if ("legs" in record) {
      for (const leg of record.legs) if (leg.asset === asset) observe(leg.to, record.day, true);
    } else if (record.reason === "not-accepted" && record.asset === asset) {
      observe(record.refusedBy, record.day, false);
    }
  }
  if (latest.size === 0) return null;
  let takes = 0;
  for (const observation of latest.values()) if (observation.take) takes++;
  return takes / latest.size;
}
