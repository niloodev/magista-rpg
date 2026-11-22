import type { IArenaToken, IArenaView } from "@magista/shared";
import { describe, expect, it } from "vitest";

import {
  createTurnRowsSelector,
  currentTurnToken,
  sameTurnRows,
  turnRows,
} from "./useArenaTurns.utils";

function token(id: string, extra: Partial<IArenaToken> = {}): IArenaToken {
  return {
    id,
    sceneId: "s",
    characterId: null,
    name: id,
    imageUrl: `/media/${id}.webp`,
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

const view: IArenaView = {
  activeSceneId: "s",
  scene: null,
  tokens: [
    token("ana", { characterId: "c-ana" }),
    token("lobo", { showName: false }),
    token("bruno", { characterId: "c-bruno" }),
  ],
  controllableCharacterIds: ["c-ana"],
  statuses: {},
  turnOrder: {
    sceneId: "s",
    round: 2,
    currentTokenId: "lobo",
    entries: [
      { tokenId: "lobo", initiative: 18 },
      { tokenId: "gone", initiative: 15 },
      { tokenId: "ana", initiative: 12 },
      { tokenId: "bruno", initiative: null },
    ],
  },
  worldLive: false,
  world: null,
};

const media = (path: string | null) => (path ? `http://api${path}` : null);

describe("turn rows", () => {
  it("lists the entries the viewer sees, in order, marking the current one", () => {
    const rows = turnRows(view, view.turnOrder, {}, false, media);
    expect(rows.map((row) => [row.id, row.initiative, row.current])).toEqual([
      ["lobo", 18, true],
      ["ana", 12, false],
      ["bruno", null, false],
    ]);
    expect(rows[0]?.name).toBe("Token");
    expect(rows.map((row) => row.upNext)).toEqual([false, true, false]);
    expect(rows.map((row) => row.tone)).toEqual(["other", "own", "other"]);
    expect(turnRows(view, view.turnOrder, {}, true, media)[0]).toMatchObject({
      name: "lobo",
      tone: "own",
    });
  });

  it("spins the rolling lines and lists tokens joining the order", () => {
    const rows = turnRows(
      { ...view, tokens: [...view.tokens, token("novo")] },
      view.turnOrder,
      { ana: 9, novo: 9 },
      true,
      media,
    );
    expect(rows.map((row) => [row.id, row.rolling])).toEqual([
      ["lobo", false],
      ["ana", true],
      ["bruno", false],
      ["novo", true],
    ]);
  });

  it("compares rows by what they show", () => {
    const rows = turnRows(view, view.turnOrder, {}, false, media);
    expect(sameTurnRows(rows, turnRows(view, view.turnOrder, {}, false, media))).toBe(true);
    const moved = { ...view, tokens: view.tokens.map((item) => ({ ...item, x: item.x + 10 })) };
    expect(sameTurnRows(rows, turnRows(moved, view.turnOrder, {}, false, media))).toBe(true);
    expect(sameTurnRows(rows, turnRows(view, view.turnOrder, {}, true, media))).toBe(false);
  });

  it("keeps the same rows while only token positions change", () => {
    const select = createTurnRowsSelector(false, media);
    const first = select(view, view.turnOrder, {});
    const moved = { ...view, tokens: view.tokens.map((item) => ({ ...item, y: item.y + 5 })) };
    expect(select(moved, view.turnOrder, {})).toBe(first);
    expect(select(view, null, {})).toEqual([]);
  });

  it("finds the token whose turn it is", () => {
    expect(currentTurnToken(view, view.turnOrder)?.id).toBe("lobo");
    expect(currentTurnToken(view, null)).toBeNull();
    expect(currentTurnToken(null, view.turnOrder)).toBeNull();
  });
});
