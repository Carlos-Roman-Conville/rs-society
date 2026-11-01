import { MindsRunner, reduceMinds } from "@rex/cognition";
import type { MindCommand, MindResult, MindsConfig, MindsState } from "@rex/cognition";

/** Bench-only storage optimisation. The public reducer touches one mind per
 * command, with global counters/streams. Clone that mind, call the SAME reducer,
 * and splice its result back in mint order. Cross-mind duplicate outcome checks
 * fall back to the stock full-state path. No belief, need or choice rule changes.
 * Equivalence to the stock runner is checked with full command/result traces. */
export class StudyMindsRunner extends MindsRunner {
  private readonly studyConfigs: MindsConfig;
  constructor(state: MindsState, configs: MindsConfig) {
    super(state, configs);
    this.studyConfigs = configs;
  }
  override run(command: MindCommand): MindResult {
    if (command.type === "outcome" && this.state.minds.some((m) => m.intentions.some((i) => i.outcomeEvent === command.event))) return super.run(command);
    const logged = structuredClone(command), before = this.state;
    const index = command.type === "addMind" ? -1 : command.type === "outcome"
      ? before.minds.findIndex((m) => m.intentions.some((i) => i.intention.id === command.intention))
      : before.minds.findIndex((m) => m.id === command.mind);
    const selected = { ...before, minds: index < 0 ? [] : [before.minds[index]] };
    const reduced = reduceMinds(structuredClone(selected), command, this.studyConfigs);
    const minds = command.type === "addMind" ? [...before.minds, ...reduced.state.minds]
      : before.minds.map((mind, i) => i === index ? reduced.state.minds[0] : mind);
    const result = { ...reduced, state: { ...reduced.state, minds } };
    this.state = result.state;
    this.log.push(logged);
    this.events.push(...result.events);
    return result;
  }
}
