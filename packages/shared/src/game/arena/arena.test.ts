import { describe, expect, it } from "vitest";

import {
  createArenaTokenInputSchema,
  moveArenaTokenInputSchema,
  moveArenaTokensInputSchema,
  updateArenaTokenInputSchema,
} from "../../schemas/arena";
import { canControlToken, clampToMap } from "./arena";

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
