import { describe, expect, it } from "vitest";

import { arenaTurnCommandSchema } from "../../schemas/arena";
import {
  advanceTurn,
  canEndTurn,
  moveTurnEntry,
  placeTurnEntries,
  removeTurnEntries,
  sortTurnEntries,
  tokenInitiativeExpression,
  visibleTurnOrder,
} from "./arena.turns";

const ID = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";

const entry = (tokenId: string, initiative: number | null) => ({ tokenId, initiative });

const ids = (entries: { tokenId: string }[]) => entries.map((item) => item.tokenId);

describe("turn order placement", () => {
  it("places rolled entries in descending order, ties after the first", () => {
    const entries = [entry("a", 18), entry("b", 12), entry("c", null)];
    expect(ids(placeTurnEntries(entries, [entry("d", 12)]))).toEqual(["a", "b", "d", "c"]);
    expect(ids(placeTurnEntries(entries, [entry("d", 20)]))).toEqual(["d", "a", "b", "c"]);
    expect(ids(placeTurnEntries(entries, [entry("d", 1)]))).toEqual(["a", "b", "d", "c"]);
  });

  it("moves an entry whose value changed and keeps a valueless one in place", () => {
    const entries = [entry("a", 18), entry("b", 12)];
    expect(placeTurnEntries(entries, [entry("b", 19)])).toEqual([entry("b", 19), entry("a", 18)]);
    expect(placeTurnEntries(entries, [entry("a", null)])).toEqual([
      entry("a", null),
      entry("b", 12),
    ]);
    expect(ids(placeTurnEntries(entries, [entry("c", null)]))).toEqual(["a", "b", "c"]);
  });

  it("sorts by initiative with valueless entries last", () => {
    const sorted = sortTurnEntries([entry("a", null), entry("b", 3), entry("c", 9), entry("d", 3)]);
    expect(ids(sorted)).toEqual(["c", "b", "d", "a"]);
  });

  it("moves an entry to another index", () => {
    const entries = [entry("a", 1), entry("b", 2), entry("c", 3)];
    expect(ids(moveTurnEntry(entries, "c", 0))).toEqual(["c", "a", "b"]);
    expect(ids(moveTurnEntry(entries, "a", 99))).toEqual(["b", "c", "a"]);
    expect(ids(moveTurnEntry(entries, "x", 0))).toEqual(["a", "b", "c"]);
  });
});

describe("turn passing", () => {
  const entries = [entry("a", 18), entry("b", 12), entry("c", 5)];

  it("passes forward and wraps into a new round", () => {
    expect(advanceTurn({ entries, round: 1, currentTokenId: null }, 1)).toEqual({
      round: 1,
      currentTokenId: "a",
    });
    expect(advanceTurn({ entries, round: 1, currentTokenId: "b" }, 1)).toEqual({
      round: 1,
      currentTokenId: "c",
    });
    expect(advanceTurn({ entries, round: 1, currentTokenId: "c" }, 1)).toEqual({
      round: 2,
      currentTokenId: "a",
    });
  });

  it("passes back into the previous round, never below the first", () => {
    expect(advanceTurn({ entries, round: 2, currentTokenId: "a" }, -1)).toEqual({
      round: 1,
      currentTokenId: "c",
    });
    expect(advanceTurn({ entries, round: 1, currentTokenId: "a" }, -1)).toEqual({
      round: 1,
      currentTokenId: "c",
    });
    expect(advanceTurn({ entries: [], round: 3, currentTokenId: null }, 1)).toEqual({
      round: 3,
      currentTokenId: null,
    });
  });

  it("hands the turn to the next entry when the current one is removed", () => {
    expect(removeTurnEntries({ entries, round: 1, currentTokenId: "b" }, ["b"])).toEqual({
      entries: [entry("a", 18), entry("c", 5)],
      round: 1,
      currentTokenId: "c",
    });
    expect(removeTurnEntries({ entries, round: 1, currentTokenId: "c" }, ["c"])).toMatchObject({
      round: 2,
      currentTokenId: "a",
    });
    expect(removeTurnEntries({ entries, round: 1, currentTokenId: "a" }, ["a", "b", "c"])).toEqual({
      entries: [],
      round: 1,
      currentTokenId: null,
    });
    expect(removeTurnEntries({ entries, round: 1, currentTokenId: "a" }, ["c"])).toMatchObject({
      currentTokenId: "a",
    });
  });
});

describe("turn visibility and permissions", () => {
  const order = {
    sceneId: "s",
    round: 1,
    currentTokenId: "hidden",
    entries: [entry("a", 10), entry("hidden", 8)],
  };

  it("hides the entries and the current turn of tokens the viewer cannot see", () => {
    expect(visibleTurnOrder(order, new Set(["a"]))).toEqual({
      sceneId: "s",
      round: 1,
      currentTokenId: null,
      entries: [entry("a", 10)],
    });
  });

  it("lets the GM or the owner of the current token end the turn", () => {
    const token = { id: "hidden", characterId: ID };
    expect(canEndTurn({ role: "GM" }, order, token, [])).toBe(true);
    expect(canEndTurn({ role: "PLAYER" }, order, token, [ID])).toBe(true);
    expect(canEndTurn({ role: "PLAYER" }, order, token, [])).toBe(false);
    expect(canEndTurn({ role: "PLAYER" }, order, { id: "a", characterId: ID }, [ID])).toBe(false);
  });

  it("builds the initiative of a token without a sheet", () => {
    expect(tokenInitiativeExpression(0)).toBe("1d20");
    expect(tokenInitiativeExpression(3)).toBe("1d20 + 3");
    expect(tokenInitiativeExpression(-2)).toBe("1d20 - 2");
  });

  it("validates turn commands", () => {
    expect(arenaTurnCommandSchema.safeParse({ action: "next", sceneId: ID }).success).toBe(true);
    expect(
      arenaTurnCommandSchema.safeParse({
        action: "set",
        sceneId: ID,
        tokenId: ID,
        initiative: 1000,
      }).success,
    ).toBe(false);
    expect(
      arenaTurnCommandSchema.safeParse({ action: "add", sceneId: ID, tokenIds: [ID, ID] }).success,
    ).toBe(false);
    expect(arenaTurnCommandSchema.safeParse({ action: "jump", sceneId: ID }).success).toBe(false);
  });
});
