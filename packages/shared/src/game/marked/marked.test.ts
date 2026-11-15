import { describe, expect, it } from "vitest";

import { allTargetsAccepted, proposalCharacterIds } from "./marked";
import type { IMarkedProposal } from "./marked.types";

const proposal: IMarkedProposal = {
  id: "p",
  source: { characterId: "a", name: "A", portraitUrl: null },
  trait: { name: "Traço", description: "" },
  targets: [
    { characterId: "b", name: "B", portraitUrl: null, status: "accepted" },
    { characterId: "c", name: "C", portraitUrl: null, status: "pending" },
  ],
  expiresAt: "",
};

describe("marked", () => {
  it("knows when every target accepted", () => {
    expect(allTargetsAccepted(proposal)).toBe(false);
    const done = {
      ...proposal,
      targets: proposal.targets.map((target) => ({ ...target, status: "accepted" as const })),
    };
    expect(allTargetsAccepted(done)).toBe(true);
  });

  it("lists the source first and then the targets", () => {
    expect(proposalCharacterIds(proposal)).toEqual(["a", "b", "c"]);
  });
});
