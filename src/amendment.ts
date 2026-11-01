import type { Charter, Parameter, SocialIntention } from "./types.ts";

/** DESIGN §1.2a, §1.3: a member supplies a new parameter for a named existing
 * component. Array indices retain charter order; no components are invented.
 * Structural replacements and schedule changes need a separate proposal shape.
 */
export interface AmendmentTarget {
  readonly section: "obligations" | "benefits";
  readonly component: number;
  readonly parameter: "amount" | "quantity" | "hours" | "repayment_period";
}
export interface AmendmentPayload extends AmendmentTarget, Readonly<Record<string, unknown>> {
  readonly action: "amend";
  readonly value: Parameter;
}

export function amendmentTargets(charter: Charter): readonly (AmendmentTarget & { readonly value: Parameter })[] {
  const targets: (AmendmentTarget & { value: Parameter })[] = [];
  for (const section of ["obligations", "benefits"] as const) {
    (charter[section] ?? []).forEach((rule, component) => {
      for (const parameter of ["amount", "quantity", "hours", "repayment_period"] as const) {
        if (parameter in rule) {
          targets.push({ section, component, parameter, value: (rule as unknown as Record<string, Parameter>)[parameter] ?? null });
        }
      }
    });
  }
  return targets;
}

/** Prepare a detached draft; the owner must validate it and obtain the current
 * charter's amendment decision before committing it (DESIGN §1.2a–§1.3).
 */
export function amendmentDraft(charter: Charter, payload: SocialIntention["payload"]):
  { charter: Charter; change: AmendmentPayload; previous: Parameter } | { reason: string } {
  const target = amendmentTargets(charter).find((entry) => entry.section === payload?.section
    && entry.component === payload.component && entry.parameter === payload.parameter);
  if (!target) return { reason: "amendment requires a named numeric obligation or benefit parameter" };
  const value = payload?.value ?? null;
  if (value !== null && typeof value !== "number") return { reason: "amendment value must be a number or null" };
  const change: AmendmentPayload = { action: "amend", section: target.section,
    component: target.component, parameter: target.parameter, value };
  const rules = charter[target.section]!.map((rule, component) => component === target.component
    ? { ...rule, [target.parameter]: value } : rule);
  return { charter: structuredClone({ ...charter, [target.section]: rules }), change, previous: target.value };
}
