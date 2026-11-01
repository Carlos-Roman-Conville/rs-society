import type {
  Charter, CharterCapabilities, DecisionProcedure, Parameter, Schedule,
} from "./types.ts";

/** DESIGN §1.2a: validate executable inputs, never historical classifications.
 * Typed drafts may contain missing/null inputs from JSON. Errors follow component
 * array order and include a path so a founder can repair the offending rule.
 */
export function validateCharter(charter: Charter, capabilities: CharterCapabilities): string[] {
  const errors: string[] = [];
  const error = (path: string, message: string): void => { errors.push(`${path}: ${message}`); };
  const object = (value: unknown, path: string): boolean => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      error(path, "requires an object");
      return false;
    }
    return true;
  };
  const array = <T>(value: readonly T[], path: string): readonly T[] => {
    if (!Array.isArray(value)) { error(path, "requires an array"); return []; }
    return value;
  };
  if (!object(charter, "charter") || !object(capabilities, "capabilities")) return errors;
  const names = <T extends string>(value: readonly T[], path: string): readonly T[] =>
    Array.from(array(value, path)).filter((name, i) => {
      if (typeof name === "string" && name.trim()) return true;
      error(`${path}[${i}]`, "requires a nonempty value");
      return false;
    });
  const events = new Set(names(capabilities.events, "capabilities.events"));
  const ports = new Set(names(capabilities.ports, "capabilities.ports"));
  const procedures = new Set(names(capabilities.procedures, "capabilities.procedures"));
  const components = <T>(value: readonly T[] | undefined, path: string): readonly T[] =>
    value === undefined ? [] : array(value, path);
  const positionRules = components(charter.positions, "positions");
  const positions = new Set(positionRules.map((position) => position?.position).filter((name) => typeof name === "string"));
  // Exhaustiveness makes vocabulary extensions require a validator change.
  const unsupported = (_value: never, path: string): void => error(path, "unsupported component type");
  const text = (value: string, path: string): void => {
    if (typeof value !== "string" || !value.trim()) error(path, "requires a nonempty value");
  };
  const positive = (value: Parameter, path: string, integer = false): void => {
    if (value === null || !Number.isFinite(value) || value <= 0 || (integer && !Number.isInteger(value))) {
      error(path, `requires a finite positive ${integer ? "integer" : "number"}`);
    }
  };
  const fraction = (value: Parameter, path: string): void => {
    if (value === null || !Number.isFinite(value) || value <= 0 || value > 1) {
      error(path, "requires a fraction greater than 0 and at most 1");
    }
  };
  const port = (required: string, path: string): void => {
    if (!ports.has(required)) error(path, `requires port ${required}`);
  };
  const event = (required: string, path: string): void => {
    if (!events.has(required)) error(path, `requires emitted event ${required}`);
  };
  const role = (required: string, path: string): void => {
    if (!positions.has(required)) error(path, `requires position ${required}`);
  };
  const roles = (required: readonly string[], path: string): void => {
    if (!Array.isArray(required)) { error(path, "requires an array of positions"); return; }
    if (required.length === 0) error(path, "requires at least one position");
    required.forEach((entry, i) => role(entry, `${path}[${i}]`));
  };
  const schedule = (value: Schedule, path: string): void => {
    if (!object(value, path)) return;
    if (value.first === null || !Number.isFinite(value.first)) error(`${path}.first`, "requires a finite time");
    positive(value.period, `${path}.period`);
  };
  const procedure = (value: DecisionProcedure, path: string): void => {
    if (!object(value, path)) return;
    switch (value.type) {
      case "position_holder":
        role(value.role, `${path}.role`);
        break;
      case "council":
        roles(value.roles, `${path}.roles`);
        procedure(value.procedure, `${path}.procedure`);
        break;
      case "simple_majority":
      case "qualified_majority":
      case "unanimity":
        if (value.type !== "unanimity" && !["cast", "present", "members"].includes(value.base)) {
          error(`${path}.base`, "requires cast, present or members; no default");
        }
        if (value.electorate !== "present" && value.electorate !== "all_members") error(`${path}.electorate`, "requires present or all_members");
        if (object(value.eligibility, `${path}.eligibility`)) {
          if (value.eligibility.type === "positions") roles(value.eligibility.roles, `${path}.eligibility.roles`);
          else if (value.eligibility.type !== "members") unsupported(value.eligibility as never, `${path}.eligibility`);
        }
        if (object(value.quorum, `${path}.quorum`)) {
          if (value.quorum.type === "count") positive(value.quorum.value, `${path}.quorum`, true);
          else if (value.quorum.type === "fraction") fraction(value.quorum.value, `${path}.quorum`);
          else unsupported(value.quorum as never, `${path}.quorum`);
        }
        if (value.type === "qualified_majority") fraction(value.threshold, `${path}.threshold`);
        if (value.type === "simple_majority" && value.tie_break !== undefined && object(value.tie_break, `${path}.tie_break`)) {
          switch (value.tie_break.type) {
            case "position_holder": role(value.tie_break.role, `${path}.tie_break.role`); break;
            case "lots": break;
            default: unsupported(value.tie_break, `${path}.tie_break`);
          }
        }
        break;
      default: return unsupported(value, path);
    }
    if (!procedures.has(value.type)) error(path, `requires implemented procedure ${value.type}`);
  };

  // DESIGN §1.14 3: every executable draft supplies its founding terms.
  if (object(charter.founding, "founding") && charter.founding) {
    positive(charter.founding.window, "founding.window", true);
    positive(charter.founding.min_members, "founding.min_members", true);
    if (!Number.isSafeInteger(charter.founding.window)) error("founding.window", "requires safe integer milliseconds");
    if (!Number.isSafeInteger(charter.founding.min_members)) error("founding.min_members", "requires a safe integer");
  }
  if (!charter.admission?.length) error("admission", "requires at least one admission rule");
  components(charter.admission, "admission").forEach((value, i) => {
    const path = `admission[${i}]`;
    if (!object(value, path)) return;
    switch (value.type) {
      case "open": break;
      case "sponsored": positive(value.members, `${path}.members`, true); break;
      case "vote": procedure(value.procedure, `${path}.procedure`); break;
      case "kinship": text(value.relation, `${path}.relation`); break;
      case "occupation":
        text(value.occupation, `${path}.occupation`);
        port(value.port, path);
        break;
      case "fee":
        positive(value.amount, `${path}.amount`);
        port("settlement.ledger", path);
        break;
      default: unsupported(value, path);
    }
  });
  components(charter.obligations, "obligations").forEach((value, i) => {
    const path = `obligations[${i}]`;
    if (!object(value, path)) return;
    switch (value.type) {
      case "dues":
        positive(value.amount, `${path}.amount`);
        schedule(value.schedule, `${path}.schedule`);
        port("settlement.ledger", path);
        break;
      case "attendance":
      case "service":
        text(value.activity, `${path}.activity`);
        schedule(value.schedule, `${path}.schedule`);
        if (value.type === "service") positive(value.hours, `${path}.hours`);
        break;
      case "exclusivity":
        if (value.organisations?.length === 0) error(path, "requires named organisations");
        array(value.organisations, `${path}.organisations`).forEach((org, j) => text(org, `${path}.organisations[${j}]`));
        break;
      default: unsupported(value, path);
    }
  });
  components(charter.benefits, "benefits").forEach((value, i) => {
    const path = `benefits[${i}]`;
    if (!object(value, path)) return;
    switch (value.type) {
      case "transfer":
      case "loan":
        event(value.event, path);
        port("settlement.ledger", path);
        positive(value.amount, `${path}.amount`);
        if (value.type === "loan") positive(value.repayment_period, `${path}.repayment_period`);
        break;
      case "goods":
        event(value.event, path);
        port("economy.inventory", path);
        text(value.good, `${path}.good`);
        positive(value.quantity, `${path}.quantity`);
        break;
      case "meeting":
        text(value.activity, `${path}.activity`);
        schedule(value.schedule, `${path}.schedule`);
        break;
      default: unsupported(value, path);
    }
  });
  if (charter.decision_procedure !== undefined) procedure(charter.decision_procedure, "decision_procedure");
  const seenPositions = new Set<string>();
  positionRules.forEach((value, i) => {
    const path = `positions[${i}]`;
    if (!object(value, path)) return;
    text(value.position, `${path}.position`);
    if (seenPositions.has(value.position)) error(path, `duplicate position ${value.position}`);
    seenPositions.add(value.position);
    if (value.term !== "indefinite") positive(value.term, `${path}.term`);
    procedure(value, path);
  });
  components(charter.sanctions, "sanctions").forEach((value, i) => {
    const path = `sanctions[${i}]`;
    if (!object(value, path)) return;
    procedure(value.procedure, `${path}.procedure`);
    switch (value.type) {
      case "fine":
        positive(value.amount, `${path}.amount`);
        port("settlement.ledger", path);
        break;
      case "suspension": positive(value.duration, `${path}.duration`); break;
      case "expulsion": break;
      default: unsupported(value, path);
    }
  });
  if (charter.amendment !== undefined) procedure(charter.amendment, "amendment");
  return errors;
}

/** DESIGN §1.14 1: references record evidence, not executable drafts.
 * Accept a research row's section-tagged components or a charter-shaped record.
 * A source-silent annotation on an object covers its nested null fields; each
 * component starts a new annotation scope. Unknown types remain errors even
 * when annotated. No admission, founding terms or execution ports are required.
 */
export function validateReference(reference: unknown): string[] {
  const errors: string[] = [];
  const error = (path: string, message: string): void => { errors.push(`${path}: ${message}`); };
  const object = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  const procedures = ["position_holder", "simple_majority", "qualified_majority", "unanimity", "council"];
  const sections: Record<string, readonly string[]> = {
    admission: ["open", "sponsored", "vote", "kinship", "occupation", "fee"],
    obligation: ["dues", "attendance", "service", "exclusivity"],
    benefit: ["transfer", "goods", "meeting", "loan"],
    sanction: ["fine", "suspension", "expulsion"],
    position: procedures, decision_procedure: procedures, amendment: procedures,
  };
  const known = new Set([...Object.values(sections).flat(), "members", "positions", "count", "fraction", "lots"]);
  const nestedTypes: Record<string, readonly string[]> = {
    procedure: procedures, eligibility: ["members", "positions"], quorum: ["count", "fraction"],
    tie_break: ["position_holder", "lots"],
  };
  const walk = (value: unknown, path: string, annotated = false, types?: readonly string[]): void => {
    if (value === null) {
      if (!annotated) error(path, "null requires source_silent: true and a nonempty note");
      return;
    }
    if (Array.isArray(value)) {
      if (types) { error(path, "requires a component object"); return; }
      value.forEach((child, i) => walk(child, `${path}[${i}]`, annotated));
      return;
    }
    if (!object(value)) {
      if (types) error(path, "requires a component object");
      return;
    }
    const note = value.note ?? value.notes;
    const silent = annotated || (value.source_silent === true && typeof note === "string" && !!note.trim());
    if (types || "type" in value) {
      if (value.type === null) {
        if (!silent) error(`${path}.type`, "null requires source_silent: true and a nonempty note");
      } else if (typeof value.type !== "string" || !(types ?? [...known]).includes(value.type)) {
        error(`${path}.type`, "unsupported component type");
      }
    }
    for (const [key, child] of Object.entries(value)) {
      walk(child, `${path}.${key}`, silent, Object.hasOwn(nestedTypes, key) ? nestedTypes[key] : undefined);
    }
  };
  if (!object(reference)) return ["reference: requires an object"];
  if ("components" in reference) {
    for (const [key, value] of Object.entries(reference)) if (key !== "components") walk(value, key);
    if (!Array.isArray(reference.components)) error("components", "requires an array");
    else reference.components.forEach((component, i) => {
      const path = `components[${i}]`;
      if (!object(component)) { error(path, "requires a component object"); return; }
      const types = typeof component.section === "string" && Object.hasOwn(sections, component.section)
        ? sections[component.section] : undefined;
      if (!types) error(`${path}.section`, "unsupported component section");
      walk(component, path, false, types ?? []);
    });
  } else {
    const arrays: Record<string, string> = {
      admission: "admission", obligations: "obligation", benefits: "benefit", positions: "position", sanctions: "sanction",
    };
    for (const [key, value] of Object.entries(reference)) {
      if (Object.hasOwn(arrays, key)) {
        if (!Array.isArray(value)) { error(key, "requires an array"); continue; }
        value.forEach((component, i) => {
          if (!object(component)) error(`${key}[${i}]`, "requires a component object");
          else walk(component, `${key}[${i}]`, false, sections[arrays[key]]);
        });
      } else walk(value, key, false, Object.hasOwn(sections, key) ? sections[key] : undefined);
    }
  }
  return errors;
}
