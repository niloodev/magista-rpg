import type { IMarkedProposal } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const proposal: IMarkedProposal = {
  id: "p1",
  source: { characterId: "a", name: "Ana", portraitUrl: null },
  trait: { name: "Visão", description: "" },
  targets: [{ characterId: "b", name: "Bruno", portraitUrl: null, status: "pending" }],
  expiresAt: new Date(0).toISOString(),
};

describe("marked slice", () => {
  it("tracks a proposal until it resolves, keeping it for the outcome", () => {
    const store = createAppStore();
    store.getState().applyMarkedProposal(proposal);
    store.getState().hideMarkedProposal();
    expect(store.getState().marked).toMatchObject({
      proposal: { id: "p1" },
      hiddenProposalId: "p1",
    });
    store
      .getState()
      .applyMarkedResolution({ proposalId: "p1", outcome: "declined", decidedBy: "Bruno" });
    expect(store.getState().marked).toMatchObject({
      proposal: null,
      hiddenProposalId: null,
      outcome: { resolution: { outcome: "declined" }, proposal: { id: "p1" } },
    });
  });

  it("ignores late updates of a resolved proposal", () => {
    const store = createAppStore();
    store.getState().applyMarkedProposal(proposal);
    store
      .getState()
      .applyMarkedResolution({ proposalId: "p1", outcome: "accepted", decidedBy: null });
    store.getState().applyMarkedProposal(proposal);
    expect(store.getState().marked.proposal).toBeNull();
    store.getState().dismissMarkedOutcome();
    expect(store.getState().marked.outcome).toBeNull();
  });

  it("stores the active share and the account characters", () => {
    const store = createAppStore();
    const share = {
      id: "s",
      source: proposal.source,
      trait: proposal.trait,
      startedAt: new Date(0).toISOString(),
    };
    store.getState().setMarkedShare(share);
    store.getState().setMarkedOwnIds(["a"]);
    expect(store.getState().marked).toMatchObject({ share: { id: "s" }, ownIds: ["a"] });
  });
});
