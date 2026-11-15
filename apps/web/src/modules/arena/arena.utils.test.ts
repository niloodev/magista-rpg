import type { IArenaToken, IArenaView } from "@magista/shared";
import { describe, expect, it } from "vitest";

import {
  arenaHint,
  arrowDelta,
  panelWidth,
  parseArenaHint,
  parseSidebarState,
  roundPoint,
  selectionSummary,
  toRenderTokens,
} from "./arena.utils";

function token(id: string, characterId: string | null): IArenaToken {
  return {
    id,
    sceneId: "s",
    characterId,
    name: id,
    imageUrl: characterId ? `/media/${id}.png` : null,
    x: 10,
    y: 20,
    size: 140,
    hidden: false,
    position: 0,
  };
}

const view: IArenaView = {
  activeSceneId: "s",
  scene: { id: "s", name: "Cena", folderId: null, mapUrl: null, position: 0 },
  tokens: [token("ana", "c-ana"), token("bruno", "c-bruno"), token("lobo", null)],
  controllableCharacterIds: ["c-ana"],
};

const media = (path: string | null) => (path ? `http://api${path}` : null);

describe("arena utils", () => {
  it("marks what a player controls and owns", () => {
    const tokens = toRenderTokens(view, {}, false, media);
    expect(tokens.map((entry) => [entry.id, entry.controllable, entry.tone])).toEqual([
      ["ana", true, "own"],
      ["bruno", false, "other"],
      ["lobo", false, "other"],
    ]);
    expect(tokens[0]?.imageUrl).toBe("http://api/media/ana.png");
  });

  it("lets the GM control everything and highlights NPCs as theirs", () => {
    const tokens = toRenderTokens(view, {}, true, media);
    expect(tokens.every((entry) => entry.controllable)).toBe(true);
    expect(tokens.map((entry) => entry.tone)).toEqual(["other", "other", "own"]);
  });

  it("uses live drag previews over stored positions", () => {
    const [ana] = toRenderTokens(view, { ana: { x: 99, y: 98 } }, false, media);
    expect(ana).toMatchObject({ x: 99, y: 98 });
  });

  it("keeps only counts and widths in the skeleton hint and reads it back safely", () => {
    const panels = {
      open: true,
      tab: "characters" as const,
      rollsOpen: false,
      width: 420,
      rollsWidth: 300,
    };
    expect(arenaHint(30, "Ruínas", panels)).toEqual([12, 6, 420, 0, 0]);
    expect(arenaHint(0, null, { ...panels, tab: "scenes" })[4]).toBe(1);
    expect(parseArenaHint([2, 6, 0, 330, 1])).toEqual({
      known: true,
      tray: 2,
      nameLength: 6,
      sidebarWidth: 0,
      rollsWidth: 330,
      tab: "scenes",
    });
    expect(parseArenaHint([99, -3, 9999, 10])).toEqual({
      known: true,
      tray: 12,
      nameLength: 0,
      sidebarWidth: 560,
      rollsWidth: 340,
      tab: "characters",
    });
    for (const value of [null, "x", [1], [1, "a"], [Number.NaN, 1]])
      expect(parseArenaHint(value)).toEqual({
        known: false,
        tray: 0,
        nameLength: 18,
        sidebarWidth: 360,
        rollsWidth: 340,
        tab: "characters",
      });
  });

  it("sends a saved width below the minimum back to the default and keeps closed panels", () => {
    const limits = { default: 340, min: 320, max: 520 };
    expect(panelWidth(300, limits, false)).toBe(340);
    expect(panelWidth(0, limits, true)).toBe(0);
    expect(panelWidth(330.6, limits, false)).toBe(331);
    expect(panelWidth(999, limits, false)).toBe(520);
    expect(panelWidth("x", limits, true)).toBe(340);
  });

  it("reads the saved panels state safely", () => {
    expect(
      parseSidebarState(
        '{"open":false,"tab":"scenes","rollsOpen":false,"width":480,"rollsWidth":9}',
      ),
    ).toEqual({ open: false, tab: "scenes", rollsOpen: false, width: 480, rollsWidth: 340 });
    expect(parseSidebarState('{"open":"x","tab":"rolls","width":2000}')).toEqual({
      open: true,
      tab: "characters",
      rollsOpen: true,
      width: 560,
      rollsWidth: 340,
    });
    expect(parseSidebarState("not json")).toMatchObject({ open: true, width: 360 });
  });

  it("rounds positions to one decimal", () => {
    expect(roundPoint({ x: 10.04, y: 3.96 })).toEqual({ x: 10, y: 4 });
  });

  it("maps arrow keys to directions", () => {
    expect(arrowDelta("ArrowLeft")).toEqual({ x: -1, y: 0 });
    expect(arrowDelta("a")).toBeNull();
  });

  it("summarizes the selection for the bar", () => {
    const ana = token("ana", "c-ana");
    const lobo = { ...token("lobo", null), size: 220, hidden: true };
    expect(selectionSummary([ana, lobo], true, [])).toEqual({
      size: 220,
      allHidden: false,
      sheetTarget: null,
    });
    expect(selectionSummary([ana], false, ["c-ana"])).toMatchObject({ sheetTarget: "c-ana" });
    expect(selectionSummary([ana], false, [])).toMatchObject({ sheetTarget: null });
    expect(selectionSummary([lobo], true, [])).toMatchObject({
      allHidden: true,
      sheetTarget: null,
    });
  });
});
