import type {
  Charter, CharterCapabilities, DecisionProcedure, Parameter, Schedule,
} from "./types.ts";

/** DESIGN §1.2a: validate executable inputs, never historical classifications.
 * Accepts a typed draft, not arbitrary untrusted JSON. Errors follow component
 * array order and include a path so a founder can repair the offending rule.
 */
export function validateCharter(charter: Charter, capabilities: CharterCapabilities): string[] {
  const errors: string[] = [];
  const events = new Set(capabilities.events);
  const ports = new Set(capabilities.ports);
  const procedures = new Set(capabilities.procedures);
  const positions = new Set((charter.positions ?? []).map((position) => position.position));
  const error = (path: string, message: string): void => { errors.push(`${path}: ${message}`); };
  // Exhaustiveness makes vocabulary extensions require a validator change.
  const unsupported = (_value: never, path: string): void => error(path, "unsupported component type");
  const text = (value: string, path: string): void => {
    if (!value.trim()) error(path, "requires a nonempty value");
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
    if (required.length === 0) error(path, "requires at least one position");
    required.forEach((entry, i) => role(entry, `${path}[${i}]`));
  };
  const schedule = (value: Schedule, path: string): void => {
    if (value.first === null || !Number.isFinite(value.first)) error(`${path}.first`, "requires a finite time");
    positive(value.period, `${path}.period`);
  };
  const procedure = (value: DecisionProcedure, path: string): void => {
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
        if (value.eligibility.type === "positions") roles(value.eligibility.roles, `${path}.eligibility.roles`);
        if (value.quorum.type === "count") positive(value.quorum.value, `${path}.quorum`, true);
        else fraction(value.quorum.value, `${path}.quorum`);
        if (value.type === "qualified_majority") fraction(value.threshold, `${path}.threshold`);
        if (value.type === "simple_majority" && value.tie_break) {
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

  if (charter.founding) {
    positive(charter.founding.window, "founding.window", true);
    positive(charter.founding.minimum, "founding.minimum", true);
    if (!Number.isSafeInteger(charter.founding.window)) error("founding.window", "requires safe integer milliseconds");
    if (!Number.isSafeInteger(charter.founding.minimum)) error("founding.minimum", "requires a safe integer");
  }
  if (!charter.admission?.length) error("admission", "requires at least one admission rule");
  charter.admission?.forEach((value, i) => {
    const path = `admission[${i}]`;
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
  charter.obligations?.forEach((value, i) => {
    const path = `obligations[${i}]`;
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
        if (value.organisations.length === 0) error(path, "requires named organisations");
        value.organisations.forEach((org, j) => text(org, `${path}.organisations[${j}]`));
        break;
      default: unsupported(value, path);
    }
  });
  charter.benefits?.forEach((value, i) => {
    const path = `benefits[${i}]`;
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
  if (charter.decision_procedure) procedure(charter.decision_procedure, "decision_procedure");
  const seenPositions = new Set<string>();
  charter.positions?.forEach((value, i) => {
    const path = `positions[${i}]`;
    text(value.position, `${path}.position`);
    if (seenPositions.has(value.position)) error(path, `duplicate position ${value.position}`);
    seenPositions.add(value.position);
    if (value.term !== "indefinite") positive(value.term, `${path}.term`);
    procedure(value, path);
  });
  charter.sanctions?.forEach((value, i) => {
    const path = `sanctions[${i}]`;
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
  if (charter.amendment) procedure(charter.amendment, "amendment");
  return errors;
}
