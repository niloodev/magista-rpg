import { describe, expect, it, vi } from "vitest";

import { createEmptySheet } from "@magista/shared";
import type { ICharacter, IArenaToken, IArenaTurnOrder } from "@magista/shared";

import type { ArenaTurnChange } from "@/core/models/arenaTurn";

import { createArenaTurnController } from "./arenaTurn";
import { arenaTurnErrors } from "./arenaTurn.errors";

const LIVE = "11111111-1111-4111-8111-111111111111";
const PREP = "22222222-2222-4222-8222-222222222222";
const ANA = "33333333-3333-4333-8333-333333333333";
const T_ANA = "44444444-4444-4444-8444-444444444444";
const T_WOLF = "55555555-5555-4555-8555-555555555555";
const T_HIDDEN = "66666666-6666-4666-8666-666666666666";
const T_PREP = "77777777-7777-4777-8777-777777777777";
const MISSING = "88888888-8888-4888-8888-888888888888";
const T_SHADOW = "99999999-9999-4999-8999-999999999999";

const gm = { accountId: "gm", role: "GM" as const };
const alice = { accountId: "alice", role: "PLAYER" as const };
const bob = { accountId: "bob", role: "PLAYER" as const };

function token(id: string, sceneId: string, extra: Partial<IArenaToken> = {}): IArenaToken {
  return {
    id,
    sceneId,
    characterId: null,
    name: "Lobo",
    imageUrl: null,
    imageThumbUrl: null,
    style: "portrait",
    showName: true,
    x: 0,
    y: 0,
    size: 140,
    hidden: false,
    position: 0,
    initiativeBonus: 0,
    ...extra,
  };
}

function build(options: { orders?: Record<string, Partial<IArenaTurnOrder>>; d20?: number } = {}) {
  const tokenList = [
    token(T_ANA, LIVE, { characterId: ANA, name: "Ana" }),
    token(T_WOLF, LIVE, { initiativeBonus: 3 }),
    token(T_HIDDEN, LIVE, { hidden: true }),
    token(T_PREP, PREP),
    token(T_SHADOW, LIVE, { characterId: ANA, name: "Ana", hidden: true }),
  ];
  const orders = new Map<string, IArenaTurnOrder>(
    [LIVE, PREP].map((sceneId) => [
      sceneId,
      { sceneId, round: 1, currentTokenId: null, entries: [], ...options.orders?.[sceneId] },
    ]),
  );
  const turns = {
    findOrder: vi.fn(async (sceneId: string) => orders.get(sceneId) ?? null),
    change: vi.fn(async (sceneId: string, apply: ArenaTurnChange) => {
      const stored = orders.get(sceneId);
      if (!stored) return null;
      const next = apply(stored);
      if (!next) return { order: stored, changed: false };
      orders.set(sceneId, next);
      return { order: next, changed: true };
    }),
  };
  let time = 1000;
  const empty = createEmptySheet();
  const sheet = {
    ...empty,
    attributes: { ...empty.attributes, des: { value: 14, proficient: false } },
  };
  const characters = {
    findById: vi.fn(async (id: string) =>
      id === ANA ? ({ id: ANA, sheet, features: [] } as unknown as ICharacter) : null,
    ),
    listAccessibleIds: vi.fn(async (accountId: string) => (accountId === "alice" ? [ANA] : [])),
  };
  const controller = createArenaTurnController({
    turns,
    tokens: {
      listByScene: vi.fn(async (sceneId: string, { includeHidden }) =>
        tokenList.filter((item) => item.sceneId === sceneId && (includeHidden || !item.hidden)),
      ),
    },
    scenes: { findActiveSceneId: vi.fn(async () => LIVE) },
    characters,
    randomInt: () => options.d20 ?? 10,
    now: () => time,
  });
  const advance = (ms: number) => {
    time += ms;
  };
  return { controller, orders, turns, advance };
}

const entry = (tokenId: string, initiative: number | null) => ({ tokenId, initiative });

describe("arena turn controller: GM", () => {
  it("adds tokens, rolls them and passes turns across rounds", async () => {
    const { controller, orders } = build();
    const added = await controller.command(gm, {
      action: "add",
      sceneId: LIVE,
      tokenIds: [T_ANA, T_HIDDEN],
    });
    if ("error" in added) throw new Error(added.error);
    expect(added.payload.delivery.gm.entries).toEqual([entry(T_ANA, null), entry(T_HIDDEN, null)]);
    expect(added.payload.delivery.table?.entries).toEqual([entry(T_ANA, null)]);
    expect(added.payload.changed).toBe(true);

    const rolled = await controller.command(gm, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_WOLF],
    });
    if ("error" in rolled) throw new Error(rolled.error);
    expect(rolled.payload.changed).toBe(false);
    expect(rolled.payload.rolls?.secret).toEqual([entry(T_WOLF, 13)]);
    expect(orders.get(LIVE)?.entries).toHaveLength(2);
    await controller.recordRolled(LIVE, rolled.payload.rolls?.secret ?? []);
    expect(orders.get(LIVE)?.entries[0]).toEqual(entry(T_WOLF, 13));

    await controller.command(gm, { action: "next", sceneId: LIVE });
    expect(orders.get(LIVE)?.currentTokenId).toBe(T_WOLF);
    await controller.command(gm, { action: "previous", sceneId: LIVE });
    expect(orders.get(LIVE)).toMatchObject({ round: 1, currentTokenId: T_HIDDEN });
    const next = await controller.command(gm, { action: "next", sceneId: LIVE });
    if ("error" in next) throw new Error(next.error);
    expect(next.payload.delivery.gm).toMatchObject({ round: 2, currentTokenId: T_WOLF });
  });

  it("hands character tokens to the sheet roll and spins the visible lines", async () => {
    const { controller, advance } = build();
    const result = await controller.command(gm, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_ANA, T_HIDDEN],
    });
    if ("error" in result) throw new Error(result.error);
    expect(result.payload.rolls).toMatchObject({
      characters: [{ tokenId: T_ANA, characterId: ANA }],
      secret: [entry(T_HIDDEN, 10)],
      pending: { sceneId: LIVE, gm: [T_ANA, T_HIDDEN], table: [T_ANA] },
    });
    const again = await controller.command(gm, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_ANA],
    });
    if ("error" in again) throw new Error(again.error);
    expect(again.payload.rolls).toBeNull();
    advance(10_000);
    const later = await controller.command(gm, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_ANA],
    });
    if ("error" in later) throw new Error(later.error);
    expect(later.payload.rolls?.characters).toHaveLength(1);
  });

  it("rolls in secret a character token the table may not see", async () => {
    const { controller } = build({ d20: 15 });
    const result = await controller.command(gm, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_SHADOW],
    });
    if ("error" in result) throw new Error(result.error);
    expect(result.payload.rolls).toMatchObject({
      characters: [],
      secret: [entry(T_SHADOW, 17)],
      pending: { gm: [T_SHADOW], table: [] },
    });
  });

  it("hides the current turn of a hidden token from the players", async () => {
    const { controller } = build({
      orders: { [LIVE]: { currentTokenId: T_ANA, entries: [entry(T_ANA, 9), entry(T_HIDDEN, 5)] } },
    });
    const result = await controller.command(gm, { action: "next", sceneId: LIVE });
    if ("error" in result) throw new Error(result.error);
    expect(result.payload.delivery.gm.currentTokenId).toBe(T_HIDDEN);
    expect(result.payload.delivery.table).toMatchObject({
      currentTokenId: null,
      entries: [entry(T_ANA, 9)],
    });
  });

  it("edits, moves, focuses, sorts and clears the order", async () => {
    const { controller, orders } = build({
      orders: { [LIVE]: { entries: [entry(T_ANA, 9), entry(T_WOLF, 5)] } },
    });
    await controller.command(gm, { action: "set", sceneId: LIVE, tokenId: T_WOLF, initiative: 12 });
    expect(orders.get(LIVE)?.entries.map((item) => item.tokenId)).toEqual([T_WOLF, T_ANA]);
    await controller.command(gm, { action: "move", sceneId: LIVE, tokenId: T_WOLF, index: 1 });
    expect(orders.get(LIVE)?.entries.map((item) => item.tokenId)).toEqual([T_ANA, T_WOLF]);
    await controller.command(gm, { action: "sort", sceneId: LIVE });
    expect(orders.get(LIVE)?.entries.map((item) => item.tokenId)).toEqual([T_WOLF, T_ANA]);
    await controller.command(gm, { action: "focus", sceneId: LIVE, tokenId: T_ANA });
    expect(orders.get(LIVE)?.currentTokenId).toBe(T_ANA);
    await controller.command(gm, { action: "remove", sceneId: LIVE, tokenIds: [T_ANA, MISSING] });
    expect(orders.get(LIVE)).toMatchObject({ currentTokenId: T_WOLF, round: 2 });
    await controller.command(gm, { action: "clear", sceneId: LIVE });
    expect(orders.get(LIVE)).toMatchObject({ entries: [], round: 1, currentTokenId: null });
  });

  it("keeps a scene that is not live away from the players", async () => {
    const { controller } = build();
    const result = await controller.command(gm, {
      action: "add",
      sceneId: PREP,
      tokenIds: [T_PREP],
    });
    if ("error" in result) throw new Error(result.error);
    expect(result.payload.delivery.table).toBeNull();
  });

  it("refuses tokens of another scene and bad commands", async () => {
    const { controller } = build();
    expect(
      await controller.command(gm, { action: "add", sceneId: LIVE, tokenIds: [T_PREP] }),
    ).toEqual({ error: arenaTurnErrors.tokenNotFound });
    expect(await controller.command(gm, { action: "jump", sceneId: LIVE })).toEqual({
      error: arenaTurnErrors.invalidCommand,
    });
    expect(await controller.command(gm, { action: "next", sceneId: MISSING })).toEqual({
      error: arenaTurnErrors.sceneNotFound,
    });
  });
});

describe("arena turn controller: players", () => {
  it("lets a player end only the turn of a token they control", async () => {
    const { controller, orders } = build({
      orders: { [LIVE]: { currentTokenId: T_ANA, entries: [entry(T_ANA, 9), entry(T_WOLF, 5)] } },
    });
    expect(
      await controller.command(bob, { action: "endTurn", sceneId: LIVE, tokenId: T_ANA }),
    ).toEqual({ error: arenaTurnErrors.forbidden });
    await controller.command(alice, { action: "endTurn", sceneId: LIVE, tokenId: T_ANA });
    expect(orders.get(LIVE)?.currentTokenId).toBe(T_WOLF);
    await controller.command(alice, { action: "endTurn", sceneId: LIVE, tokenId: T_ANA });
    expect(orders.get(LIVE)?.currentTokenId).toBe(T_WOLF);
  });

  it("keeps the GM actions and other scenes away from players", async () => {
    const { controller } = build();
    expect(await controller.command(alice, { action: "next", sceneId: LIVE })).toEqual({
      error: arenaTurnErrors.gmOnly,
    });
    expect(
      await controller.command(alice, { action: "roll", sceneId: PREP, tokenIds: [T_PREP] }),
    ).toEqual({ error: arenaTurnErrors.notLive });
    expect(
      await controller.command(alice, { action: "roll", sceneId: LIVE, tokenIds: [T_WOLF] }),
    ).toEqual({ error: arenaTurnErrors.forbidden });
    expect(
      await controller.command(alice, { action: "roll", sceneId: LIVE, tokenIds: [T_HIDDEN] }),
    ).toEqual({ error: arenaTurnErrors.tokenNotFound });
  });

  it("lets a player roll a token only while it has no initiative", async () => {
    const { controller } = build();
    const first = await controller.command(alice, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_ANA],
    });
    if ("error" in first) throw new Error(first.error);
    expect(first.payload.rolls?.characters).toEqual([{ tokenId: T_ANA, characterId: ANA }]);
    const valued = build({ orders: { [LIVE]: { entries: [entry(T_ANA, 6)] } } });
    const again = await valued.controller.command(alice, {
      action: "roll",
      sceneId: LIVE,
      tokenIds: [T_ANA],
    });
    if ("error" in again) throw new Error(again.error);
    expect(again.payload.rolls).toBeNull();
  });
});

describe("arena turn controller: sheet initiative", () => {
  it("puts a revealed initiative on every token of the character in the live scene", async () => {
    const { controller, orders } = build({
      orders: { [LIVE]: { entries: [entry(T_WOLF, 12)] } },
    });
    const delivery = await controller.recordInitiative(ANA, 18);
    expect(delivery?.table?.entries).toEqual([entry(T_ANA, 18), entry(T_WOLF, 12)]);
    expect(orders.get(LIVE)?.entries[0]).toEqual(entry(T_ANA, 18));
    expect(await controller.recordInitiative(MISSING, 18)).toBeNull();
  });

  it("lists the tokens a sheet initiative reaches, visible ones for the players", async () => {
    const { controller } = build();
    expect(await controller.initiativePending(ANA)).toEqual({
      sceneId: LIVE,
      gm: [T_ANA, T_SHADOW],
      table: [T_ANA],
    });
    expect(await controller.initiativePending(MISSING)).toBeNull();
  });

  it("delivers the order of a scene again", async () => {
    const { controller } = build({
      orders: { [LIVE]: { entries: [entry(T_HIDDEN, 3), entry(T_ANA, 2)] } },
    });
    const delivery = await controller.delivery(LIVE);
    expect(delivery?.gm.entries).toHaveLength(2);
    expect(delivery?.table?.entries).toEqual([entry(T_ANA, 2)]);
    expect(await controller.delivery(MISSING)).toBeNull();
    expect(await controller.delivery(PREP)).toBeNull();
  });
});
