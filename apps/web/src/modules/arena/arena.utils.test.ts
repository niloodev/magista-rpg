import type { IArenaToken, IArenaView } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import {
  arenaHint,
  arrowDelta,
  dockedIdOf,
  dockTabKey,
  dockZoneAt,
  fitPanels,
  panelWidth,
  placementPoint,
  parseArenaHint,
  parseSidebarState,
  roundPoint,
  selectionSummary,
  toRenderTokens,
  dockedTabsOf,
  livePreviews,
  withPreviews,
} from "./arena.utils";

function token(id: string, characterId: string | null): IArenaToken {
  return {
    id,
    sceneId: "s",
    characterId,
    name: id,
    imageUrl: characterId ? `/media/${id}.png` : null,
    imageThumbUrl: null,
    x: 10,
    y: 20,
    size: 140,
    hidden: false,
    position: 0,
  };
}

const view: IArenaView = {
  activeSceneId: "s",
  scene: {
    id: "s",
    name: "Cena",
    folderId: null,
    mapUrl: null,
    mapThumbUrl: null,
    width: 1750,
    height: 1750,
    mapWidth: null,
    mapHeight: null,
    position: 0,
  },
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

  it("keeps a new token inside the map, or anywhere while the map size is unknown", () => {
    expect(placementPoint({ x: -20, y: 4000.04 }, { width: 1600, height: 1000 })).toEqual({
      x: 0,
      y: 1000,
    });
    expect(placementPoint({ x: 812.34, y: 90.06 }, { width: 0, height: 0 })).toEqual({
      x: 812.3,
      y: 90.1,
    });
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

  it("names docked sheet tabs and finds the panel under a dragged window", () => {
    expect(dockedIdOf(dockTabKey("c1"))).toBe("c1");
    expect(dockedIdOf("characters")).toBeNull();
    const panels = { left: 340, right: 360 };
    expect(dockZoneAt(200, 1440, panels)).toBe("left");
    expect(dockZoneAt(1200, 1440, panels)).toBe("right");
    expect(dockZoneAt(700, 1440, panels)).toBeNull();
    expect(dockZoneAt(10, 1440, { left: 0, right: 360 })).toBeNull();
  });

  it("shrinks wide panels on a narrow screen so some map is always left", () => {
    expect(fitPanels(340, 360, 1440)).toEqual({ left: 340, right: 360 });
    expect(fitPanels(520, 560, 1024)).toEqual({ left: 320, right: 344 });
    expect(fitPanels(0, 560, 1024)).toEqual({ left: 0, right: 560 });
    expect(fitPanels(520, 560, 700)).toEqual({ left: 320, right: 300 });
  });
});

describe("drag previews and docked tabs", () => {
  const token = {
    id: "t",
    name: "Ana",
    imageUrl: null,
    imageThumbUrl: null,
    x: 1,
    y: 2,
    size: 140,
    hidden: false,
    controllable: true,
    tone: "own" as const,
  };

  it("applies live previews and keeps the same list without any", () => {
    const list = [token];
    expect(withPreviews(list, {})).toBe(list);
    expect(withPreviews(list, { t: { x: 9, y: 8 } })[0]).toMatchObject({ x: 9, y: 8 });
  });

  it("drops queued previews whose stale timer already fired", () => {
    const queued = new Map([
      ["a", { tokenId: "a", x: 1, y: 1 }],
      ["b", { tokenId: "b", x: 2, y: 2 }],
    ]);
    expect(livePreviews(queued, new Map([["a", 1]])).map((move) => move.tokenId)).toEqual(["a"]);
  });

  it("lists the docked sheets of a side with their names", () => {
    const show = vi.fn();
    const tabs = dockedTabsOf(
      "left",
      { left: ["c1"], right: [] },
      { left: "c1", right: null },
      {},
      [{ id: "c1", name: "Ana" }],
      show,
    );
    expect(tabs.sheets).toEqual([{ id: "c1", name: "Ana" }]);
    expect(tabs.active).toBe("c1");
    tabs.onShow(null);
    expect(show).toHaveBeenCalledWith("left", null);
  });
});
