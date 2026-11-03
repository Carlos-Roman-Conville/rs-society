import { describe, expect, it } from "vitest";
import { streams } from "@rex/kernel";
import { readFileSync } from "node:fs";
import { CHOICE_PROCESS, collectiveChoice, pairwiseCollectiveChoice, type ChoiceInput, type PairwiseChoiceInput } from "../src/choice.ts";
import { validateCharter } from "../src/charter.ts";
import { OrganisationStore } from "../src/organisation.ts";
import { mintId, type DecisionProcedure, type PersonId, type SocialIntention } from "../src/types.ts";
import { a as la, b as lb, c as lc, d as ld, charter, capabilities, foundFixture, setup, vote as lifecycleVote } from "./lifecycle-fixture.ts";

// All counts, times, thresholds and seeds in this file are fixture (test only).
const people = Array.from({ length: 6 }, (_, person) => mintId({ person }, "person").id);
const [a, b, c, d, e, outsider] = people;
const org = mintId({}, "org").id;
const majority = {
  type: "simple_majority", base: "present", // fixture (test only)
  electorate: "present", eligibility: { type: "members" },
  quorum: { type: "count", value: 1 },
} as const satisfies DecisionProcedure;
const proposal: SocialIntention = { person: a, kind: "propose", target: org, t: 0 };
const base: ChoiceInput = {
  org, t: 1, proposalId: "proposal.0001", proposal, members: [a, b, c, d, e], present: [a, b, c, d, e],
  positions: [{ role: "chair", holder: a }, { role: "clerk", holder: b }, { role: "warden", holder: c }],
  procedure: majority, intentions: [],
};
type Vote = "support" | "oppose" | "abstain";
const ballots = (kinds: readonly Vote[], voters: readonly PersonId[] = people, target = base.proposalId): SocialIntention[] =>
  kinds.map((kind, i) => ({ person: voters[i], kind, target, t: 1 }));
const choose = (kinds: readonly Vote[], extra: Partial<ChoiceInput> = {}) =>
  collectiveChoice({ ...base, intentions: ballots(kinds), ...extra });

describe("collective choice applies the charter (DESIGN §1.3)", () => {
  it("simple majority records acceptance and the full tally with its causal acts", () => {
    const result = choose(["support", "support", "support", "oppose", "abstain"]);
    expect(result).toMatchObject({ org, kind: "act", cause: CHOICE_PROCESS, t: 1,
      payload: { outcome: "accepted", tally: {
        eligible: base.members, present: base.present, electorate: base.members, denominator: 5, quorumRequired: 1,
        support: [a, b, c], oppose: [d], abstain: [e], unexpressed: [], excluded: [],
      } },
    });
    expect(result.intentions).toEqual([proposal, ...ballots(["support", "support", "support", "oppose", "abstain"])]);
  });
  it("simple majority rejects at half and distinguishes a tie from rejection", () => {
    expect(choose(["support", "support", "oppose", "abstain"]).payload.outcome).toBe("rejected");
    expect(choose(["support", "oppose"]).payload).toMatchObject({ outcome: "unresolved", reason: "tie; procedure silent" });
    expect(choose([]).kind).toBe("refused");
  });
  it("present and all-member denominators differ, with remote votes only for all-member rules", () => {
    const votes = ["support", "support", "oppose", "oppose", "oppose"] as const;
    const present = choose(votes, { present: [a, b, c] });
    const all = choose(votes, { present: [a, b, c], procedure: { ...majority, base: "members", electorate: "all_members" } }); // fixture (test only)
    expect(present.payload.outcome).toBe("accepted");
    expect(present.payload.tally.excluded).toEqual([{ person: d, reason: "absent" }, { person: e, reason: "absent" }]);
    expect(all.payload.outcome).toBe("rejected");
    expect(all.payload.tally.denominator).toBe(5);
    expect(choose(["support", "support", "oppose"], {
      present: [a, b, c], procedure: { ...majority, base: "members", electorate: "all_members" }, // fixture (test only)
    }).payload.tally.unexpressed).toEqual([d, e]);
  });
  it("count and fractional quorum count eligible attendance even with remote support", () => {
    for (const quorum of [{ type: "count", value: 4 }, { type: "fraction", value: 0.8 }] as const) {
      expect(choose(["support", "support", "support", "support", "support"], {
        present: [a, b, c], procedure: { ...majority, base: "members", electorate: "all_members", quorum }, // fixture (test only)
      })).toMatchObject({ kind: "refused", payload: { reason: "no quorum", tally: { quorumRequired: 4 } } });
      expect(choose(["support", "support", "support", "support"], {
        present: [a, b, c, d], procedure: { ...majority, quorum },
      }).payload.outcome).toBe("accepted");
    }
  });
  it("qualified majority includes the threshold exactly and rejects one vote below", () => {
    const extra: Partial<ChoiceInput> = { members: [a, b, c, d], present: [a, b, c, d],
      procedure: { ...majority, type: "qualified_majority", threshold: 0.75 } };
    expect(choose(["support", "support", "support", "oppose"], extra).payload.outcome).toBe("accepted");
    expect(choose(["support", "support", "oppose", "oppose"], extra).payload.outcome).toBe("rejected");
    expect(choose(["support", "support", "support"], { ...extra, procedure: {
      ...majority, type: "qualified_majority", threshold: 0.8, electorate: "all_members",
    } }).payload.outcome).toBe("rejected");
  });
  it("qualified thresholds compare ratios without a floating-point product off-by-one", () => {
    const members = Array.from({ length: 100 }, (_, person) => mintId({ person }, "person").id);
    const kinds = members.map((_, i): Vote => i < 14 ? "support" : "oppose");
    const input = { ...base, members, present: members, intentions: ballots(kinds, members),
      procedure: { ...majority, type: "qualified_majority", threshold: 0.14 } as const };
    expect(collectiveChoice(input).payload.outcome).toBe("accepted");
    expect(collectiveChoice({ ...input, intentions: ballots(kinds.map((k, i) => i === 13 ? "oppose" : k), members) }).payload.outcome).toBe("rejected");
  });
  it("fractional quorum exactly met survives floating-point multiplication and fails one attendee below", () => {
    const members = Array.from({ length: 100 }, (_, person) => mintId({ person }, "person").id);
    const input = { ...base, members, present: members.slice(0, 14),
      intentions: ballots(Array.from({ length: 14 }, (): Vote => "support"), members),
      procedure: { ...majority, quorum: { type: "fraction", value: 0.14 } } as const };
    expect(collectiveChoice(input).payload).toMatchObject({ outcome: "accepted", tally: { quorumRequired: 14 } });
    expect(collectiveChoice({ ...input, present: members.slice(0, 13) }).payload.reason).toBe("no quorum");
  });
  it("unanimity requires every elector's explicit support, including absent all-member electors", () => {
    const procedure = { ...majority, type: "unanimity" } as const;
    expect(choose(["support", "support"], { present: [a, b], procedure }).payload.outcome).toBe("accepted");
    for (const kinds of [["support", "oppose"], ["support", "abstain"], ["support"]] as const) {
      expect(choose(kinds, { present: [a, b], procedure }).payload.outcome).toBe("rejected");
    }
    expect(choose(["support", "support"], { present: [a, b], procedure: {
      ...procedure, electorate: "all_members",
    } }).payload.outcome).toBe("rejected");
  });
  it("the named position holder alone decides; absence, vacancy and abstention never substitute another member", () => {
    const extra = { procedure: { type: "position_holder", role: "chair" } as const };
    expect(choose(["oppose", "support", "support", "support", "support"], extra).payload.outcome).toBe("rejected");
    expect(choose(["support"], { ...extra, proposal: { ...proposal, person: b } }).payload.outcome).toBe("accepted");
    expect(choose(["support"], { ...extra, present: [b, c] }).payload.reason).toBe("no quorum");
    expect(choose([], { ...extra, positions: [{ role: "chair", holder: null }] }).payload.reason).toBe("no quorum");
    expect(choose(["abstain"], extra).payload.reason).toBe("no decision");
  });
  it.each(["simple_majority", "qualified_majority", "unanimity", "position_holder"] as const)(
    "council scopes nested %s to position holders", (type) => {
      const nested: DecisionProcedure = type === "position_holder" ? { type, role: "chair" }
        : type === "qualified_majority" ? { ...majority, type, threshold: 2 / 3 } : { ...majority, type };
      const procedure: DecisionProcedure = { type: "council", roles: ["chair", "clerk", "warden"], procedure: nested };
      expect(choose(["support", "support", "support", "oppose", "oppose"], { procedure }).payload.outcome).toBe("accepted");
      expect(choose([], { procedure, proposal: { ...proposal, person: d } }).payload.reason).toBe("ineligible proposer");
    },
  );
  it("nested councils intersect membership, deduplicate multi-office people and use council quorum", () => {
    const procedure: DecisionProcedure = { type: "council", roles: ["chair", "clerk"], procedure: {
      type: "council", roles: ["clerk", "warden"], procedure: { ...majority, quorum: { type: "fraction", value: 1 } },
    } };
    const result = choose(["support", "oppose"], { procedure, positions: [
      { role: "chair", holder: a }, { role: "clerk", holder: a }, { role: "warden", holder: c },
    ] });
    expect(result.payload.tally.eligible).toEqual([a]);
    expect(result.payload.outcome).toBe("accepted");
  });
  it("a council records ties and absent-holder quorum failures against its own membership", () => {
    const procedure: DecisionProcedure = { type: "council", roles: ["chair", "clerk"], procedure: {
      ...majority, quorum: { type: "fraction", value: 1 },
    } };
    expect(choose(["support", "oppose", "support", "support"], { procedure }).payload.reason).toBe("tie; procedure silent");
    expect(choose(["support", "support"], { procedure, present: [a, c, d, e] }).payload.reason).toBe("no quorum");
  });
  it("eligibility governs both proposers and ballots; outsiders cannot supply quorum", () => {
    const procedure = { ...majority, eligibility: { type: "positions", roles: ["chair", "clerk"] } } as const;
    expect(choose(["support", "support", "oppose"], { procedure }).payload.tally.eligible).toEqual([a, b]);
    expect(choose([], { procedure, proposal: { ...proposal, person: c } }).payload.reason).toBe("ineligible proposer");
    expect(choose([], { proposal: { ...proposal, person: outsider } }).payload.reason).toBe("ineligible proposer");
    expect(choose(["support"], { procedure, present: [outsider] }).payload.reason).toBe("no quorum");
  });
});

describe("hand-worked tie outcomes under simple majority (PLAN §3 C, DC-16)", () => {
  const twoTwo = ["support", "support", "oppose", "oppose"] as const;
  const four = [a, b, c, d] as const;
  const tied = (extra: Partial<ChoiceInput> = {}) => choose(twoTwo, {
    members: [...four], present: [...four], intentions: ballots(twoTwo, four),
    positions: [{ role: "chair", holder: a }, { role: "clerk", holder: b }],
    ...extra,
  });
  it("simple majority with no tie_break: a 2–2 tie is unresolved (tie; procedure silent)", () => {
    expect(tied().payload).toMatchObject({ outcome: "unresolved", reason: "tie; procedure silent",
      tally: { support: [a, b], oppose: [c, d], denominator: 4 } }); // fixture (test only)
  });
  it("simple majority with tie_break no_act: the same 2–2 ballots give no_act (tie; declared no act)", () => {
    const procedure = { ...majority, tie_break: { type: "no_act" } } as const; // fixture (test only)
    expect(tied({ procedure }).payload).toMatchObject({ outcome: "no_act", reason: "tie; declared no act" });
  });
  it("position_holder tie_break with a vacant chair leaves the tie unresolved (chair gave no casting choice)", () => {
    const procedure = { ...majority, tie_break: { type: "position_holder", role: "chair" } } as const; // fixture (test only)
    expect(tied({ procedure, positions: [{ role: "chair", holder: null }, { role: "clerk", holder: b }] }).payload.reason)
      .toBe("chair gave no casting choice");
  });
  it("position_holder tie_break with an absent chair leaves the tie unresolved (chair gave no casting choice)", () => {
    const procedure = { ...majority, tie_break: { type: "position_holder", role: "chair" } } as const; // fixture (test only)
    const voters = [b, c, d, e] as const;
    expect(choose(["support", "support", "oppose", "oppose"], {
      members: [a, ...voters], present: [...voters], procedure,
      intentions: ballots(["support", "support", "oppose", "oppose"], voters),
      positions: [{ role: "chair", holder: a }, { role: "clerk", holder: b }],
    }).payload.reason).toBe("chair gave no casting choice");
  });
  it("position_holder tie_break with an abstaining chair leaves the tie unresolved (chair gave no casting choice)", () => {
    const procedure = { ...majority, tie_break: { type: "position_holder", role: "chair" } } as const; // fixture (test only)
    expect(choose(["abstain", "support", "oppose"], { members: four, present: four, procedure }).payload.reason)
      .toBe("chair gave no casting choice");
  });
  it("position_holder tie_break with the chair present and voting: the chair's side wins", () => {
    const procedure = { ...majority, tie_break: { type: "position_holder", role: "chair" } } as const; // fixture (test only)
    expect(choose(["support", "oppose"], { members: [a, b], present: [a, b], positions: [{ role: "chair", holder: a }], procedure }).payload)
      .toMatchObject({ outcome: "accepted", tieBreak: { type: "position_holder", person: a } });
  });
  it("simple majority with base cast: an empty denominator stays no decision (unchanged)", () => {
    const procedure = { ...majority, base: "cast" } as const; // fixture (test only)
    expect(choose(["abstain", "abstain"], { members: [a, b], present: [a, b], positions: [], procedure }).payload.reason).toBe("no decision");
  });
  it("an unresolved close commits nothing through the store (membership and charter unchanged)", () => {
    const dues = { action: "amend", section: "obligations", component: 0, parameter: "amount", value: 99 };
    const rules = { ...charter, decision_interval: 4,
      amendment: { ...lifecycleVote, base: "present" as const }, // fixture (test only)
      obligations: [{ type: "dues" as const, amount: 2, schedule: { first: 4, period: 4 } }] };
    const { ledger, views } = setup();
    const store = new OrganisationStore({ start: 0, counters: {}, ledger, views, capabilities, streams: streams(27) });
    const org = foundFixture(store, [la, lb, lc, ld], rules);
    const charterBefore = structuredClone(store.get(org)!.charter);
    const membersBefore = [la, lb, lc, ld].map((person) => store.memberships(person));
    const request = { proposalId: "proposal.1", proposal: { person: la, kind: "propose" as const, target: org, t: 0,
      payload: dues }, ballots: [] as SocialIntention[] };
    store.attempt(request.proposal, { decision: request });
    store.advanceTo(1);
    for (const person of [la, lb, lc, ld]) {
      store.attempt({ person, kind: "attend", target: "proposal.1", t: 1 });
    }
    store.advanceTo(2);
    for (const person of [la, lb, lc, ld]) {
      const kind = person === la || person === lb ? "support" : "oppose"; // fixture (test only)
      store.attempt({ person, kind, target: "proposal.1", t: 2 });
    }
    store.advanceTo(4);
    const closed = store.proposals.find((p) => p.id === "proposal.1")!.result!;
    expect(closed.payload).toMatchObject({ outcome: "unresolved", reason: "tie; procedure silent" });
    expect(store.get(org)!.charter).toEqual(charterBefore);
    expect([la, lb, lc, ld].map((person) => store.memberships(person))).toEqual(membersBefore);
    expect(store.events.some((e) => e.payload?.amendmentApplied)).toBe(false);
  });
});

describe("only declared tie-breaks may resolve equal support and opposition", () => {
  const tie = ["support", "oppose"] as const;
  it("a named chair's expressed side breaks a tie, but an absent or abstaining chair does not", () => {
    const procedure = { ...majority, tie_break: { type: "position_holder", role: "chair" } } as const;
    expect(choose(tie, { present: [a, b], procedure }).payload).toMatchObject({ outcome: "accepted", tieBreak: { type: "position_holder", person: a } });
    expect(choose(["abstain", "support", "oppose"], { procedure }).payload.reason).toBe("chair gave no casting choice");
    expect(choose(["support", "oppose"], { procedure, intentions: ballots(tie, [b, c]), present: [b, c] }).payload.reason).toBe("chair gave no casting choice");
  });
  it("lots use exactly the organisation's Kernel stream and replay after restore", () => {
    const random = streams(27), reference = streams(27);
    const procedure = { ...majority, tie_break: { type: "lots" } } as const;
    const snapshot = random.state();
    const draw = reference.get(CHOICE_PROCESS, org)();
    const first = choose(tie, { procedure, streams: random, present: [a, b] });
    expect(first.payload).toMatchObject({ outcome: draw < 0.5 ? "accepted" : "rejected", tieBreak: { type: "lots", draw } });
    expect(random.state()).toEqual(reference.state());
    random.restore(snapshot);
    expect(choose(tie, { procedure, streams: random, present: [a, b] })).toEqual(first);
  });
  it("ordinary decisions, refusals and undeclared ties consume no randomness", () => {
    const random = streams(27);
    choose(tie, { streams: random });
    const procedure = { ...majority, tie_break: { type: "lots" } } as const;
    choose(["support", "support", "support"], { procedure, streams: random });
    choose(tie, { procedure, streams: random, present: [] });
    choose(tie, { procedure, streams: random, proposal: { ...proposal, person: outsider } });
    expect(random.state()).toEqual({});
    expect(() => choose(tie, { procedure })).toThrow("Kernel streams");
  });
  it("lots are isolated by organisation and both equal-lot outcomes occur across fixture seeds", () => {
    const procedure = { ...majority, tie_break: { type: "lots" } } as const;
    const otherOrg = mintId({ org: 1 }, "org").id;
    const random = streams(27);
    choose(tie, { procedure, streams: random, org: otherOrg, proposal: { ...proposal, target: otherOrg } });
    expect(choose(tie, { procedure, streams: random })).toEqual(choose(tie, { procedure, streams: streams(27) }));
    expect(new Set(Array.from({ length: 32 }, (_, seed) => choose(tie, { procedure, streams: streams(seed) }).payload.outcome)))
      .toEqual(new Set(["accepted", "rejected"]));
  });
  it("charter validation checks tie-break references and rejects unknown tie-break vocabulary", () => {
    const capabilities = { events: [], ports: [], procedures: ["simple_majority"] as const };
    const charter = { founding: { window: 10, min_members: 1 }, // fixture (test only)
      admission: [{ type: "open" as const }], decision_procedure: { ...majority, tie_break: { type: "lots" as const } } };
    expect(validateCharter(charter, capabilities)).toEqual([]);
    expect(validateCharter({ ...charter, decision_procedure: { ...majority, tie_break: { type: "position_holder", role: "missing" } } }, capabilities))
      .toEqual(["decision_procedure.tie_break.role: requires position missing"]);
    expect(validateCharter({ ...charter, decision_procedure: { ...majority, tie_break: { type: "unknown" } } } as never, capabilities))
      .toEqual(["decision_procedure.tie_break: unsupported component type"]);
  });
});

// May 1952, level 1: exhaustive fully expressed binary profiles (2–5 voters).
// Presence/quorum/eligibility stay fixed; abstentions in a head-count denominator
// are not the symmetric binary rule and are tested separately above.
const profiles = Array.from({ length: 4 }, (_, i) => i + 2).flatMap((n) =>
  Array.from({ length: 2 ** n }, (_, mask) => Array.from({ length: n }, (_, j): Vote => mask & (1 << j) ? "support" : "oppose")));
function binary(kinds: readonly Vote[]) {
  const members = people.slice(0, kinds.length);
  return choose(kinds, { members, present: members, positions: [] }).payload.outcome;
}
describe("May's conditions for simple majority on two expressed alternatives", () => {
  it("anonymity: permuting persons never changes the outcome", () => {
    for (const profile of profiles) {
      for (let i = 0; i < profile.length; i++) for (let j = i + 1; j < profile.length; j++) {
        const swapped = [...profile];
        [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
        expect(binary(swapped)).toBe(binary(profile));
      }
    }
  });
  it("neutrality: exchanging the alternatives exchanges the outcome and preserves ties", () => {
    const opposite = { accepted: "rejected", rejected: "accepted", no_act: "no_act", unresolved: "unresolved" };
    for (const profile of profiles) {
      expect(binary(profile.map((v) => v === "support" ? "oppose" : "support"))).toBe(opposite[binary(profile)]);
    }
  });
  it("positive responsiveness: a move toward a tied or winning alternative makes it win", () => {
    for (const profile of profiles) if (binary(profile) !== "rejected") {
      for (let i = 0; i < profile.length; i++) if (profile[i] === "oppose") {
        expect(binary(profile.map((v, j) => j === i ? "support" : v))).toBe("accepted");
      }
    }
  });
});

function pairwise(cycle = true): PairwiseChoiceInput {
  const ids = ["proposal.0001", "proposal.0002", "proposal.0003"];
  // Expressed orders A>B>C, B>C>A, C>A>B give A>B, B>C, C>A (2–1 each).
  return { ...base, members: [a, b, c], present: [a, b, c], procedure: majority,
    proposals: ids.map((id, i) => ({ id, intention: { ...proposal, person: people[i] } })),
    comparisons: [
      { first: ids[0], second: ids[1], intentions: ballots(["support", "oppose", "support"], people, ids[0]) },
      { first: ids[0], second: ids[2], intentions: ballots(["support", "oppose", cycle ? "oppose" : "support"], people, ids[0]) },
      { first: ids[1], second: ids[2], intentions: ballots(["support", "support", "oppose"], people, ids[1]) },
    ],
  };
}
describe("pairwise majority reports cycles instead of imposing an agenda (DESIGN §1.3)", () => {
  it("reports the hand-worked three-proposal Condorcet cycle with all three tallies", () => {
    const result = pairwiseCollectiveChoice(pairwise());
    expect(result).toMatchObject({ kind: "refused", payload: { outcome: "no_act", reason: "majority cycle",
      cycle: ["proposal.0001", "proposal.0002", "proposal.0003", "proposal.0001"],
    } });
    expect(result.payload.winner).toBeUndefined();
    expect(result.payload.comparisons.map((r) => [r.event.payload.tally.support.length, r.event.payload.tally.oppose.length]))
      .toEqual([[2, 1], [1, 2], [2, 1]]);
    expect(result.intentions).toHaveLength(12);
  });
  it("reports a proposal beating every other proposal, independent of comparison order", () => {
    const input = pairwise(false);
    const result = pairwiseCollectiveChoice(input);
    expect(result).toMatchObject({ kind: "act", payload: { outcome: "accepted", winner: "proposal.0001" } });
    expect(pairwiseCollectiveChoice({ ...input, comparisons: [...input.comparisons].reverse() })).toEqual(result);
  });
  it("refuses quorum failures, ineligible proposers, incomplete pairs and unresolved relations", () => {
    const input = pairwise();
    expect(pairwiseCollectiveChoice({ ...input, present: [] }).payload.reason).toBe("no quorum");
    expect(pairwiseCollectiveChoice({ ...input, proposals: input.proposals.map((p, i) => i === 2 ? { ...p, intention: { ...p.intention, person: outsider } } : p) }).payload.reason).toBe("ineligible proposer");
    expect(() => pairwiseCollectiveChoice({ ...input, comparisons: input.comparisons.slice(1) })).toThrow("exactly one");
    expect(pairwiseCollectiveChoice({ ...input, comparisons: input.comparisons.map((p) => ({ ...p, intentions: [] })) }).payload.reason).toBe("tie; procedure silent");
    expect(() => pairwiseCollectiveChoice({ ...input, procedure: { ...majority, tie_break: { type: "lots" } } })).toThrow("without a tie-break");
  });
});

describe("pairwise trace integrity", () => {
  it("retains every expressed ballot on an ineligible proposal and checks both proposals' timing", () => {
    const input = pairwise();
    const result = pairwiseCollectiveChoice({ ...input, proposals: input.proposals.map((p, i) => i === 2
      ? { ...p, intention: { ...p.intention, person: outsider } } : p) });
    expect(result.intentions).toHaveLength(12);
    expect(result.payload.comparisons.every((r) => r.event.payload.tally.support.length + r.event.payload.tally.oppose.length === 3)).toBe(true);
    expect(() => pairwiseCollectiveChoice({ ...input, t: 3, proposals: input.proposals.map((p, i) => i === 2
      ? { ...p, intention: { ...p.intention, t: 2 } } : p) })).toThrow("predates compared proposal");
  });
});

describe("choice input integrity and deterministic trace", () => {
  it("uses only expressed intentions, never reads opaque payloads, and does not mutate inputs", () => {
    const input = { ...base, intentions: ballots(["support", "support", "support"]) };
    const before = structuredClone(input);
    const payload = new Proxy({}, { get: () => { throw new Error("opaque payload read"); } });
    const result = collectiveChoice({ ...input, proposal: { ...proposal, payload }, intentions: input.intentions.map((v) => ({ ...v, payload })) });
    expect(result.payload.outcome).toBe("accepted");
    expect(input).toEqual(before);
  });
  it("canonicalises records in mint order including ids beyond the four-digit boundary", () => {
    const earlier = mintId({ person: 9998 }, "person").id, later = mintId({ person: 9999 }, "person").id;
    const input = { ...base, members: [a, earlier, later], present: [a, earlier, later],
      positions: [], intentions: ballots(["support", "support", "oppose"], [a, earlier, later]) };
    const expected = collectiveChoice(input);
    expect(collectiveChoice({ ...input, members: [...input.members].reverse(), present: [...input.present].reverse(), intentions: [...input.intentions].reverse() })).toEqual(expected);
    expect(expected.payload.tally.electorate).toEqual([a, earlier, later]);
  });
  it("rejects duplicate members, attendance, ballots and position assignments", () => {
    for (const extra of [{ members: [a, a] }, { present: [a, a] }, { intentions: ballots(["support", "oppose"], [a, a]) },
      { positions: [{ role: "chair", holder: a }, { role: "chair", holder: b }] }]) {
      expect(() => collectiveChoice({ ...base, ...extra })).toThrow("duplicate");
    }
  });
  it("rejects misdirected, non-voting and out-of-time acts", () => {
    for (const intention of [
      { ...ballots(["support"])[0], target: "another-proposal" },
      { ...ballots(["support"])[0], kind: "join" as const },
      { ...ballots(["support"])[0], t: -1 }, { ...ballots(["support"])[0], t: 2 },
    ]) expect(() => collectiveChoice({ ...base, intentions: [intention] })).toThrow();
    expect(() => collectiveChoice({ ...base, proposal: { ...proposal, kind: "support" } })).toThrow("propose");
    expect(() => collectiveChoice({ ...base, proposal: { ...proposal, target: "other-org" } })).toThrow("propose");
  });
  it.each([null, undefined, 0, -1, NaN, Infinity, 1.1])("rejects missing or invalid fractions: %s", (threshold) => {
    expect(() => choose([], { procedure: { ...majority, type: "qualified_majority", threshold } as DecisionProcedure })).toThrow("threshold");
    expect(() => choose([], { procedure: { ...majority, quorum: { type: "fraction", value: threshold } } as DecisionProcedure })).toThrow("quorum");
  });
  it("rejects undeclared procedures and roles rather than selecting a fallback", () => {
    expect(() => choose([], { procedure: { type: "unknown" } as never })).toThrow("unsupported");
    expect(() => choose([], { procedure: { type: "position_holder", role: "missing" } })).toThrow("requires position");
    expect(() => choose([], { procedure: { ...majority, quorum: { type: "count", value: 1.5 } } })).toThrow("quorum");
  });
  it("declares its process and observable event output in kernel.json", () => {
    const manifest = JSON.parse(readFileSync(new URL("../kernel.json", import.meta.url), "utf8"));
    expect(manifest.processes.filter((p: { id: string }) => p.id === CHOICE_PROCESS)).toEqual([{
      id: CHOICE_PROCESS, mechanisms: ["society.organisation.collective_choice", "society.organisation.actors"],
      reads: ["mind.intention", "society.organisation", "society.membership", "society.meeting_attendance"],
      writes: ["society.organisation_event"],
    }]);
  });
});
