import type { IMarkedProposal } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { actsFor, answerableTargets, outcomeText, secondsLeft } from "./marked.utils";

const proposal: IMarkedProposal = {
  id: "p",
  source: { characterId: "a", name: "Ana", portraitUrl: null },
  trait: { name: "Visão", description: "" },
  targets: [
    { characterId: "b", name: "Bruno", portraitUrl: null, status: "pending" },
    { characterId: "c", name: "Caio", portraitUrl: null, status: "accepted" },
    { characterId: "d", name: "Dara", portraitUrl: null, status: "pending" },
  ],
  expiresAt: new Date(10_000).toISOString(),
};

describe("marked utils", () => {
  it("lets the GM act for anyone and players for their own sheets", () => {
    expect(actsFor({ isGm: true, ownIds: [] }, "x")).toBe(true);
    expect(actsFor({ isGm: false, ownIds: ["b"] }, "b")).toBe(true);
    expect(actsFor({ isGm: false, ownIds: ["b"] }, "c")).toBe(false);
  });

  it("lists only the pending targets the viewer answers for", () => {
    expect(answerableTargets(proposal, { isGm: false, ownIds: ["b", "c"] })).toHaveLength(1);
    expect(
      answerableTargets(proposal, { isGm: true, ownIds: [] }).map((t) => t.characterId),
    ).toEqual(["b", "d"]);
  });

  it("counts down without going negative", () => {
    expect(secondsLeft(proposal.expiresAt, 1_500)).toBe(9);
    expect(secondsLeft(proposal.expiresAt, 20_000)).toBe(0);
    expect(secondsLeft(new Date(90_000).toISOString(), 0)).toBe(60);
  });

  it("names who refused", () => {
    expect(
      outcomeText({
        resolution: { proposalId: "p", outcome: "declined", decidedBy: "Bruno" },
        proposal,
      }).message,
    ).toBe("Bruno recusou o compartilhamento.");
  });
});
