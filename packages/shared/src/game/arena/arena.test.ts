import { describe, expect, it } from "vitest";

import {
  applyArenaChangeInputSchema,
  createArenaTokenInputSchema,
  updateArenaTokensInputSchema,
  moveArenaTokenInputSchema,
  moveArenaTokensInputSchema,
  updateArenaTokenInputSchema,
} from "../../schemas/arena";
import {
  autoEffectStyle,
  resolveAutoEffect,
  applyResourceChange,
  canControlToken,
  canSeeTokenStatus,
  clampToMap,
  fitBoard,
  hasResource,
  resolveBoard,
  scaleBoardPoint,
} from "./arena";

const ID = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";

describe("arena rules", () => {
  it("lets the GM control every token", () => {
    expect(canControlToken({ role: "GM" }, { characterId: null }, [])).toBe(true);
    expect(canControlToken({ role: "GM" }, { characterId: ID }, [])).toBe(true);
  });

  it("lets a player control only granted character tokens", () => {
    expect(canControlToken({ role: "PLAYER" }, { characterId: ID }, [ID])).toBe(true);
    expect(canControlToken({ role: "PLAYER" }, { characterId: ID }, [])).toBe(false);
    expect(canControlToken({ role: "PLAYER" }, { characterId: null }, [ID])).toBe(false);
  });

  it("clamps points to the map", () => {
    expect(clampToMap({ x: -5, y: 900 }, { width: 800, height: 600 })).toEqual({ x: 0, y: 600 });
    expect(clampToMap({ x: 10, y: 20 }, { width: 800, height: 600 })).toEqual({ x: 10, y: 20 });
  });
});

describe("arena board", () => {
  const map = { width: 4096, height: 3072 };

  it("keeps the map aspect ratio, ignoring a requested height", () => {
    expect(fitBoard({ width: 2048, height: 9999 }, map)).toEqual({ width: 2048, height: 1536 });
  });

  it("grows or shrinks both sides together to fit the limits", () => {
    expect(fitBoard({ width: 100 }, map)).toEqual({ width: 466.67, height: 350 });
    expect(fitBoard({ width: 30_000 }, map)).toEqual({ width: 20_000, height: 15_000 });
    expect(fitBoard({ width: 20_000 }, { width: 100, height: 1 })).toEqual({
      width: 20_000,
      height: 200,
    });
  });

  it("lets a board without a map take any size within the limits", () => {
    expect(fitBoard({ width: 700, height: 1400 }, null)).toEqual({ width: 700, height: 1400 });
    expect(fitBoard({ width: 10 }, null)).toEqual({ width: 350, height: 350 });
  });

  it("resolves the chosen board, then the map size, then the default", () => {
    const none = { boardWidth: null, boardHeight: null, mapWidth: null, mapHeight: null };
    expect(resolveBoard(none)).toEqual({ width: 1750, height: 1750 });
    expect(resolveBoard({ ...none, mapWidth: 1024, mapHeight: 512 })).toEqual({
      width: 1024,
      height: 512,
    });
    expect(
      resolveBoard({ boardWidth: 2000, boardHeight: 1000, mapWidth: 1024, mapHeight: 512 }),
    ).toEqual({ width: 2000, height: 1000 });
  });

  it("keeps a point on the same spot of the map when the board changes", () => {
    const from = { width: 1000, height: 500 };
    expect(scaleBoardPoint({ x: 250, y: 100 }, from, { width: 2000, height: 1000 })).toEqual({
      x: 500,
      y: 200,
    });
    expect(scaleBoardPoint({ x: 1000, y: 500 }, from, { width: 400, height: 400 })).toEqual({
      x: 400,
      y: 400,
    });
  });
});

describe("arena schemas", () => {
  it("requires a character or a name to create a token", () => {
    expect(createArenaTokenInputSchema.safeParse({}).success).toBe(false);
    const npc = createArenaTokenInputSchema.parse({ name: " Lobo " });
    expect(npc).toMatchObject({ characterId: null, name: "Lobo", x: 0, size: 140, hidden: false });
    expect(createArenaTokenInputSchema.safeParse({ characterId: ID }).success).toBe(true);
  });

  it("rejects empty token updates and out of range sizes", () => {
    expect(updateArenaTokenInputSchema.safeParse({}).success).toBe(false);
    expect(updateArenaTokenInputSchema.safeParse({ size: 10 }).success).toBe(false);
    expect(updateArenaTokenInputSchema.safeParse({ hidden: true }).success).toBe(true);
  });

  it("rejects moves outside the coordinate range", () => {
    expect(moveArenaTokenInputSchema.safeParse({ tokenId: ID, x: -1, y: 0 }).success).toBe(false);
    expect(moveArenaTokenInputSchema.safeParse({ tokenId: ID, x: 1e9, y: 0 }).success).toBe(false);
    expect(moveArenaTokenInputSchema.safeParse({ tokenId: ID, x: 12.5, y: 40 }).success).toBe(true);
  });

  it("accepts group moves without repeated tokens", () => {
    const move = { tokenId: ID, x: 1, y: 1 };
    expect(moveArenaTokensInputSchema.safeParse({ moves: [move] }).success).toBe(true);
    expect(moveArenaTokensInputSchema.safeParse({ moves: [] }).success).toBe(false);
    expect(moveArenaTokensInputSchema.safeParse({ moves: [move, move] }).success).toBe(false);
  });
});

describe("token status", () => {
  const PLAYER = { role: "PLAYER" as const, accountId: "acc-1" };
  const closed = { public: false, accountIds: [] };

  it("lets the GM see every status", () => {
    expect(
      canSeeTokenStatus(
        { role: "GM", accountId: "gm" },
        { characterId: null },
        {
          accessibleCharacterIds: [],
          access: closed,
        },
      ),
    ).toBe(true);
  });

  it("lets a player see the status of granted sheets", () => {
    const rules = { accessibleCharacterIds: [ID], access: closed };
    expect(canSeeTokenStatus(PLAYER, { characterId: ID }, rules)).toBe(true);
    expect(canSeeTokenStatus(PLAYER, { characterId: null }, rules)).toBe(false);
  });

  it("follows the token permissions", () => {
    const none = { accessibleCharacterIds: [] };
    expect(canSeeTokenStatus(PLAYER, { characterId: ID }, { ...none, access: closed })).toBe(false);
    expect(
      canSeeTokenStatus(
        PLAYER,
        { characterId: null },
        {
          ...none,
          access: { public: false, accountIds: ["acc-1"] },
        },
      ),
    ).toBe(true);
    expect(
      canSeeTokenStatus(
        PLAYER,
        { characterId: null },
        {
          ...none,
          access: { public: true, accountIds: [] },
        },
      ),
    ).toBe(true);
  });

  it("applies damage down to zero and healing up to the maximum", () => {
    expect(applyResourceChange({ current: 10, max: 20 }, "damage", 4)).toEqual({
      current: 6,
      max: 20,
    });
    expect(applyResourceChange({ current: 3, max: 20 }, "damage", 9)).toEqual({
      current: 0,
      max: 20,
    });
    expect(applyResourceChange({ current: 18, max: 20 }, "heal", 9)).toEqual({
      current: 20,
      max: 20,
    });
    expect(applyResourceChange({ current: 5, max: null }, "heal", 9)).toEqual({
      current: 14,
      max: null,
    });
  });

  it("starts an empty current value from the maximum and keeps values above it", () => {
    expect(applyResourceChange({ current: null, max: 12 }, "damage", 2)).toEqual({
      current: 10,
      max: 12,
    });
    expect(applyResourceChange({ current: 25, max: 20 }, "heal", 3)).toEqual({
      current: 25,
      max: 20,
    });
  });

  it("never heals past the sheet limit", () => {
    expect(applyResourceChange({ current: 999_990, max: null }, "heal", 50)).toEqual({
      current: 999_999,
      max: null,
    });
  });

  it("knows when a resource is undefined", () => {
    expect(hasResource({ current: null, max: null })).toBe(false);
    expect(hasResource({ current: 0, max: null })).toBe(true);
  });

  it("validates token edits and changes", () => {
    expect(
      updateArenaTokensInputSchema.safeParse({ updates: [{ id: ID, statusPublic: true }] }).success,
    ).toBe(true);
    expect(updateArenaTokensInputSchema.safeParse({ updates: [{ id: ID }] }).success).toBe(false);
    expect(updateArenaTokenInputSchema.safeParse({ statusViewerIds: [ID, ID] }).success).toBe(
      false,
    );
    expect(
      applyArenaChangeInputSchema.safeParse({
        tokenIds: [ID],
        kind: "damage",
        resource: "health",
        amount: 5,
      }).success,
    ).toBe(true);
    expect(
      applyArenaChangeInputSchema.safeParse({
        tokenIds: [ID],
        kind: "heal",
        resource: "sanity",
        amount: 0,
      }).success,
    ).toBe(false);
    expect(
      applyArenaChangeInputSchema.safeParse({
        tokenIds: [ID],
        kind: "damage",
        resource: "health",
        amount: 2,
        attackerTokenId: ID,
      }).success,
    ).toBe(false);
  });
});

describe("effect styles", () => {
  it("picks the automatic animation of each change", () => {
    expect(autoEffectStyle("damage", "health")).toBe("strike");
    expect(autoEffectStyle("damage", "sanity")).toBe("fissure");
    expect(autoEffectStyle("heal", "health")).toBe("ember");
    expect(autoEffectStyle("heal", "sanity")).toBe("clarity");
  });
});

describe("resolveAutoEffect", () => {
  it("uses the attacking sheet's animation, else the default of the action", () => {
    const effects = { damage: { health: "fissure" as const } };
    expect(resolveAutoEffect("damage", "health", effects)).toBe("fissure");
    expect(resolveAutoEffect("damage", "sanity", effects)).toBe("fissure");
    expect(resolveAutoEffect("heal", "health", effects)).toBe("ember");
    expect(resolveAutoEffect("heal", "sanity", null)).toBe("clarity");
  });
});
