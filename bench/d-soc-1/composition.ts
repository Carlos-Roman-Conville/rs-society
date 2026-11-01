import type { Charter, FoundIntention, PersonId } from "../../src/index.ts";
import { CHARTER_COMPONENTS, FIXTURES as F } from "./fixtures.ts";

// DESIGN §1.16: compose executable components across references, freely.
// The source records the amount for one payment. Weekly relief is offered as
// that payment, not multiplied by an invented illness duration. Recurrence and
// qualifying periods are not implemented by Society's transfer component.
// Unsupported events/procedures are excluded, never repaired with fixture data.
const unique = <T>(rows: T[], key: (row: T) => string) => rows.filter((row, i) => rows.findIndex((other) => key(other) === key(row)) === i);
const fees = unique(CHARTER_COMPONENTS.flatMap(({ source, component: c }) =>
  c.section === "admission" && c.type === "fee" && typeof c.amount === "number"
    ? [{ source, amount: c.amount }] : []), (r) => String(r.amount));
const dues = unique(CHARTER_COMPONENTS.flatMap(({ source, component: c }) => {
  if (c.section !== "obligation" || c.type !== "dues" || typeof c.amount !== "number") return [];
  // Stated quarterly/yearly obligations align exactly with the four-quarter
  // clock. Weekly and movable feast schedules need a finer calendar; omit.
  const quarters = c.stated_schedule === "quarterly" || c.stated_schedule === "per meeting (four a year)" ? 1
    : c.stated_schedule === "yearly" || c.stated_schedule === "at the annual mass" ? 4 : undefined;
  return quarters ? [{ source, amount: c.amount, quarters }] : [];
}), (r) => `${r.amount}/${r.quarters}`);
const relief = unique(CHARTER_COMPONENTS.flatMap(({ source, component: c }) =>
  c.section === "benefit" && c.type === "transfer" && "event" in c && c.event === "sickness" && typeof c.amount === "number"
    ? [{ source, amount: c.amount }] : []), (r) => String(r.amount));
const meetings = unique(CHARTER_COMPONENTS.flatMap(({ source, component: c }) =>
  c.section === "benefit" && c.type === "meeting" && "activity" in c && typeof c.activity === "string" && c.stated_schedule === "yearly"
    ? [{ source, activity: c.activity, quarters: 4 }] : []), (r) => `${r.activity}/${r.quarters}`);

// No invented amount axes: each choice carries an actual source component.
// Absence of an optional component is a composition choice, not a zero amount.
export const COMPOSITIONS = fees.flatMap((admission) => dues.flatMap((obligation) =>
  [undefined, ...relief].flatMap((benefit) => meetings.map((meeting) => ({ admission, obligation, benefit, meeting })))));
export const AMENDMENT_AMOUNTS = { obligations: [...new Set(dues.map((r) => r.amount))], benefits: [...new Set(relief.map((r) => r.amount))] };

export function compose(person: PersonId, step: number): { target: string; payload: FoundIntention["payload"] }[] {
  return COMPOSITIONS.map((choice, index) => {
    const charter: Charter = {
      founding: { window: F.charter.foundingWindowPeriods * F.calendar.period, min_members: F.charter.minMembers },
      decision_interval: F.charter.foundingWindowPeriods * F.calendar.period,
      admission: [{ type: "fee", amount: choice.admission.amount }],
      obligations: [{ type: "dues", amount: choice.obligation.amount,
        schedule: { first: (step + choice.obligation.quarters) * F.calendar.period, period: choice.obligation.quarters * F.calendar.period } }],
      benefits: [...(choice.benefit ? [{ type: "transfer" as const, event: "illness", amount: choice.benefit.amount }] : []),
        { type: "meeting", activity: choice.meeting.activity,
          schedule: { first: step * F.calendar.period, period: choice.meeting.quarters * F.calendar.period } }],
      // All reference amendment procedures lack executable quorum inputs.
      // Do not offer an invented majority/quorum in their place.
    };
    return { target: `draft.${person}.${step}.${index}`, payload: { charter, founders: [person],
      purpose: `Components: ${[choice.admission.source, choice.obligation.source, choice.benefit?.source, choice.meeting.source].filter(Boolean).join(", ")}` } };
  });
}
