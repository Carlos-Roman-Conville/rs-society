import type { Charter, PersonId, Schedule } from "../../src/index.ts";

/** DESIGN §1.16.3: summons are decision opportunities, never attendance.
 * Inspect the roster at this tick; departed/dead people are not summoned.
 * A person with several simultaneous meetings still deliberates once. */
export function meetingMembers(organisations: readonly { charter: Charter; members: readonly { person: PersonId }[] }[], t: number): PersonId[] {
  const due = (s: Schedule) => s.first !== null && s.period !== null && s.period > 0 && t >= s.first && (t - s.first) % s.period === 0;
  const members = new Set<PersonId>();
  for (const org of organisations) {
    const schedules = [
      ...(org.charter.benefits ?? []).flatMap((c) => c.type === "meeting" ? [c.schedule] : []),
      ...(org.charter.obligations ?? []).flatMap((c) => c.type === "attendance" ? [c.schedule] : []),
    ];
    if (schedules.some(due)) for (const member of org.members) members.add(member.person);
  }
  return [...members];
}
