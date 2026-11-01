import type { Organisation } from "./organisation.ts";
import type { OrganisationEvent } from "./types.ts";

/** DESIGN §1.4 (Ostrom 1990, interpretation): observer-only conjunction of
 * recognised offices with executable succession, an applied sanction, and
 * collected revenue. A passed but unfunded sanction is not an application.
 * History here means the caller's Society event log, not a History engine port.
 */
export function classifyInstitution(org: Organisation, history: readonly OrganisationEvent[]): boolean {
  const recognised = org.positions.some((office) => office.holder !== null
    && org.members.some((member) => member.person === office.holder)
    && org.charter.positions?.some((rule) => rule.position === office.role));
  const own = history.filter((event) => event.org === org.id && event.t >= org.founded_at);
  const sanction = own.some((event) => event.kind === "act" && event.payload?.sanctionApplied === true);
  const revenue = own.some((event) => (event.kind === "act" || event.kind === "founded" || event.kind === "joined")
    && typeof event.payload?.revenueCollected === "number" && Number.isFinite(event.payload.revenueCollected)
    && event.payload.revenueCollected > 0);
  return recognised && sanction && revenue;
}
