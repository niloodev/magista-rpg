import { describe, expect, it } from "vitest";

import { withoutRefused } from "./arenaTurn.utils";

describe("arena turn handler utils", () => {
  it("drops the refused character tokens from the rolls and the spinning lines", () => {
    const rolls = {
      sceneId: "s",
      secret: [{ tokenId: "npc", initiative: 9 }],
      characters: [
        { tokenId: "a", characterId: "c" },
        { tokenId: "b", characterId: "c" },
      ],
      pending: { sceneId: "s", gm: ["npc", "a", "b"], table: ["a", "b"] },
    };
    const accepted = rolls.characters.slice(0, 1);
    expect(withoutRefused(rolls, accepted, new Set(["b"]))).toEqual({
      ...rolls,
      characters: accepted,
      pending: { sceneId: "s", gm: ["npc", "a"], table: ["a"] },
    });
    expect(withoutRefused(rolls, rolls.characters, new Set())).toBe(rolls);
  });
});
