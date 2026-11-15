import { createEmptySheet, type ICharacter, type IMarkedShare } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import type { IMarkedShareModels } from "@/core/models/markedShare";

import { createMarkedController } from "./marked";
import { markedErrors } from "./marked.errors";

const A = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
const B = "7a2d1c3f-9b54-4d5f-8c9e-3a4b2d6e8f01";
const C = "8b3e2d40-ac65-4e60-9daf-4b5c3e7f9012";
const PROPOSAL = "1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b";
const SHARE = "2a3b4c5d-6e7f-4809-9a1b-2c3d4e5f6a7b";

function character(id: string, name: string, marked = true): ICharacter {
  const sheet = createEmptySheet();
  sheet.traits = [{ id: "t1", name: "Visão Rúnica", description: "Vê runas ocultas." }];
  return {
    id,
    name,
    avatarUrl: null,
    artUrl: null,
    sheet,
    sheetVersion: 1,
    features: marked ? ["marked"] : [],
    updatedAt: new Date(0).toISOString(),
  };
}

const access: Record<string, string[]> = { alice: [A], bob: [B], carol: [C] };
const alice = { accountId: "alice", role: "PLAYER" as const };
const bob = { accountId: "bob", role: "PLAYER" as const };
const carol = { accountId: "carol", role: "PLAYER" as const };
const gm = { accountId: "gm", role: "GM" as const };

function build(options: { offline?: string[]; plain?: string[]; time?: { value: number } } = {}) {
  const roster = [character(A, "Ana"), character(B, "Bruno"), character(C, "Caio")].map((entry) =>
    options.plain?.includes(entry.id)
      ? { ...entry, features: [] as ICharacter["features"] }
      : entry,
  );
  let active: IMarkedShare | null = null;
  const shares: IMarkedShareModels = {
    findActive: vi.fn(async () => active),
    start: vi.fn(async ({ sourceCharacterId, trait }) => {
      if (active) return null;
      active = {
        id: SHARE,
        source: { characterId: sourceCharacterId, name: "Ana", portraitUrl: null },
        trait,
        startedAt: new Date(0).toISOString(),
      };
      return active;
    }),
    stop: vi.fn(async (id) => {
      const removed = active?.id === id;
      if (removed) active = null;
      return removed;
    }),
    stopBySource: vi.fn(async (id) => {
      const removed = active?.source.characterId === id;
      if (removed) active = null;
      return removed;
    }),
  };
  const time = options.time ?? { value: 0 };
  const controller = createMarkedController({
    characters: {
      findById: vi.fn(async (id) => roster.find((entry) => entry.id === id) ?? null),
      hasAccess: vi.fn(async (id, accountId) => access[accountId]?.includes(id) ?? false),
      listByFeature: vi.fn(async () =>
        roster
          .filter((entry) => entry.features.includes("marked"))
          .map((entry) => ({ id: entry.id, name: entry.name, portraitUrl: null })),
      ),
    },
    shares,
    isAttended: async (id) => !options.offline?.includes(id),
    createId: () => PROPOSAL,
    now: () => new Date(time.value),
    timeoutMs: 60_000,
  });
  return { controller, shares, time };
}

const proposeAsAlice = (controller: ReturnType<typeof build>["controller"]) =>
  controller.propose(alice, { characterId: A, traitId: "t1" });

describe("marked controller", () => {
  it("sends the trait to every other Marcado", async () => {
    const { controller } = build();
    const result = await proposeAsAlice(controller);
    expect(result).toMatchObject({
      payload: {
        proposal: {
          id: PROPOSAL,
          source: { characterId: A, name: "Ana" },
          trait: { name: "Visão Rúnica" },
          targets: [
            { characterId: B, status: "pending" },
            { characterId: C, status: "pending" },
          ],
          expiresAt: new Date(60_000).toISOString(),
        },
        characterIds: [A, B, C],
      },
    });
  });

  it("refuses characters the viewer cannot act for or without the Marca", async () => {
    expect(await build().controller.propose(bob, { characterId: A, traitId: "t1" })).toEqual({
      error: markedErrors.forbidden,
    });
    expect(await proposeAsAlice(build({ plain: [A] }).controller)).toEqual({
      error: markedErrors.notMarked,
    });
  });

  it("refuses unknown traits, a lonely Marcado and absent Marcados", async () => {
    expect(await build().controller.propose(alice, { characterId: A, traitId: "x" })).toEqual({
      error: markedErrors.traitNotFound,
    });
    expect(await proposeAsAlice(build({ plain: [B, C] }).controller)).toEqual({
      error: markedErrors.noOtherMarked,
    });
    expect(await proposeAsAlice(build({ offline: [C] }).controller)).toEqual({
      error: markedErrors.targetOffline,
    });
  });

  it("allows a single pending proposal", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    expect(await controller.propose(gm, { characterId: B, traitId: "t1" })).toEqual({
      error: markedErrors.proposalPending,
    });
  });

  it("fails as soon as one Marcado declines", async () => {
    const { controller, shares } = build();
    await proposeAsAlice(controller);
    const result = await controller.answer(bob, {
      proposalId: PROPOSAL,
      characterId: B,
      accept: false,
    });
    expect(result).toMatchObject({
      payload: { resolution: { outcome: "declined", decidedBy: "Bruno" }, share: null },
    });
    expect(shares.start).not.toHaveBeenCalled();
    expect(
      await controller.answer(carol, { proposalId: PROPOSAL, characterId: C, accept: true }),
    ).toEqual({ error: markedErrors.proposalNotFound });
  });

  it("starts the group share once everyone accepts, the GM answering for NPCs", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    const first = await controller.answer(bob, {
      proposalId: PROPOSAL,
      characterId: B,
      accept: true,
    });
    expect(first).toMatchObject({ payload: { resolution: null, share: null } });
    const last = await controller.answer(gm, {
      proposalId: PROPOSAL,
      characterId: C,
      accept: true,
    });
    expect(last).toMatchObject({
      payload: {
        resolution: { outcome: "accepted" },
        share: { id: SHARE, trait: { name: "Visão Rúnica" } },
        characterIds: [A, B, C],
      },
    });
    expect(await proposeAsAlice(controller)).toEqual({ error: markedErrors.shareActive });
  });

  it("only lets each target answer once and only for its own sheet", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    expect(
      await controller.answer(bob, { proposalId: PROPOSAL, characterId: C, accept: true }),
    ).toEqual({ error: markedErrors.forbidden });
    expect(
      await controller.answer(alice, { proposalId: PROPOSAL, characterId: A, accept: true }),
    ).toEqual({ error: markedErrors.notTarget });
    await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true });
    expect(
      await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true }),
    ).toEqual({ error: markedErrors.alreadyAnswered });
  });

  it("expires after the deadline, naming who did not answer", async () => {
    const { controller, time } = build();
    await proposeAsAlice(controller);
    time.value = 60_000;
    expect(
      await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true }),
    ).toEqual({ error: markedErrors.proposalNotFound });
    expect(await controller.expire(PROPOSAL)).toMatchObject({
      resolution: { outcome: "expired", decidedBy: "Bruno" },
    });
    expect(await controller.expire(PROPOSAL)).toBeNull();
  });

  it("lets only the source cancel a pending proposal", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    expect(await controller.cancel(bob, { proposalId: PROPOSAL })).toEqual({
      error: markedErrors.forbidden,
    });
    expect(await controller.cancel(alice, { proposalId: PROPOSAL })).toMatchObject({
      payload: { resolution: { outcome: "cancelled" } },
    });
  });

  it("lets the source or the GM stop the share", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true });
    await controller.answer(carol, { proposalId: PROPOSAL, characterId: C, accept: true });
    expect(await controller.stop(bob, { shareId: SHARE })).toEqual({
      error: markedErrors.forbidden,
    });
    expect(await controller.stop(alice, { shareId: SHARE })).toMatchObject({
      payload: { characterIds: [A, B, C] },
    });
    expect(await controller.stop(gm, { shareId: SHARE })).toEqual({
      error: markedErrors.shareNotFound,
    });
  });

  it("shows the share only to the GM and players of a Marcado", async () => {
    const { controller } = build({ plain: [C] });
    await controller.propose(alice, { characterId: A, traitId: "t1" });
    await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true });
    expect(await controller.current(gm)).toMatchObject({ payload: { id: SHARE } });
    expect(await controller.current(bob)).toMatchObject({ payload: { id: SHARE } });
    expect(await controller.current(carol)).toMatchObject({ payload: null });
  });

  it("sends the pending proposal only to the GM and players involved", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    expect(await controller.pendingFor(gm)).toMatchObject({ id: PROPOSAL });
    expect(await controller.pendingFor(bob)).toMatchObject({ id: PROPOSAL });
    expect(await controller.pendingFor({ accountId: "nobody", role: "PLAYER" })).toBeNull();
  });

  it("resolves as cancelled when the share cannot be stored", async () => {
    const { controller, shares } = build();
    vi.mocked(shares.start).mockRejectedValueOnce(new Error("fk"));
    await proposeAsAlice(controller);
    await controller.answer(bob, { proposalId: PROPOSAL, characterId: B, accept: true });
    const result = await controller.answer(carol, {
      proposalId: PROPOSAL,
      characterId: C,
      accept: true,
    });
    expect(result).toMatchObject({
      payload: { resolution: { outcome: "cancelled" }, share: null },
    });
  });

  it("releases the proposal and the share of a character that lost the Marca", async () => {
    const { controller } = build();
    await proposeAsAlice(controller);
    expect(await controller.release(B)).toMatchObject({
      resolution: { outcome: "cancelled" },
      involvedIds: [A, B, C],
      stillMarked: true,
    });
  });
});
