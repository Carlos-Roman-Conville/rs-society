import { describe, expect, it } from "vitest";
import { mint } from "@rex/kernel";
import { mintId, type Affordance, type OrganisationEvent, type SocialIntention, type TieKind } from "../src/index.ts";

describe("shared records (DESIGN §1.1, §2.1–§2.2)", () => {
  it.each(["person", "household", "org", "tie"] as const)("mints %s ids using Kernel counters", (entity) => {
    const counters = { [entity]: 2 }; // fixture (test only)
    expect(mintId(counters, entity)).toEqual(mint(counters, entity));
    expect(counters).toEqual({ [entity]: 2 });
    const first = mintId({}, entity);
    const second = mintId(first.counters, entity);
    expect(first.id < second.id).toBe(true);
  });

  it("shares ids across intentions, affordances, events and co-member ties", () => {
    const person = mintId({}, "person").id;
    const org = mintId({}, "org").id;
    const intention: SocialIntention = { person, kind: "join", target: org, t: 0 }; // fixture (test only)
    const offer: Affordance = { person, kind: "join", target: org, terms: {} };
    const event: OrganisationEvent = {
      org, kind: "joined", t: intention.t, cause: "accepted join", intentions: [intention],
    };
    const tie: TieKind = `co-member:${org}`;
    expect(offer.target).toBe(event.org);
    expect(tie).toBe(`co-member:${event.org}`);
  });

  it("keeps entity id types distinct", () => {
    const org = mintId({}, "org").id;
    // @ts-expect-error an organisation cannot be the person expressing an act
    const invalid: SocialIntention = { person: org, kind: "abstain", t: 0 }; // fixture (test only)
    expect(invalid.person).toBe(org);
  });
});
