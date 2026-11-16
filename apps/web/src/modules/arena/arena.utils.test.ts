import type { IArenaToken, IArenaView } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import {
  pickAttacker,
  tokenDisplayName,
  dropPlacements,
  hasTransparentEdges,
  pastePlacements,
  tokenNameFromFile,
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
  changeTargets,
  placeMenu,
  statusReadout,
  filterEffects,
  readChangePreference,
  saveChangePreference,
} from "./arena.utils";
import { ARENA_EFFECT_CATALOG } from "./arena.constants";

function token(id: string, characterId: string | null): IArenaToken {
  return {
    id,
    sceneId: "s",
    characterId,
    name: id,
    imageUrl: characterId ? `/media/${id}.png` : null,
    imageThumbUrl: null,
    style: "portrait",
    showName: true,
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
  statuses: { ana: { health: { current: 4, max: 10 }, sanity: { current: null, max: null } } },
};

const media = (path: string | null) => (path ? `http://api${path}` : null);

describe("arena utils", () => {
  it("marks what a player controls and owns", () => {
    const tokens = toRenderTokens(view, false, media);
    expect(tokens.map((entry) => [entry.id, entry.controllable, entry.tone])).toEqual([
      ["ana", true, "own"],
      ["bruno", false, "other"],
      ["lobo", false, "other"],
    ]);
    expect(tokens[0]?.imageUrl).toBe("http://api/media/ana.png");
  });

  it("lets the GM control everything and highlights NPCs as theirs", () => {
    const tokens = toRenderTokens(view, true, media);
    expect(tokens.every((entry) => entry.controllable)).toBe(true);
    expect(tokens.map((entry) => entry.tone)).toEqual(["other", "other", "own"]);
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

describe("docked tabs", () => {
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

describe("arena utils: token status", () => {
  it("passes each visible status to the board", () => {
    const tokens = toRenderTokens(view, false, media);
    expect(tokens[0]?.status?.health).toEqual({ current: 4, max: 10 });
    expect(tokens[1]?.status).toBeNull();
  });

  it("writes the readout of a status", () => {
    expect(
      statusReadout({ health: { current: 12, max: 20 }, sanity: { current: 8, max: 15 } }),
    ).toBe("Vida 12/20 · Sanidade 8/15");
    expect(
      statusReadout({ health: { current: 3, max: 9 }, sanity: { current: null, max: null } }),
    ).toBe("Vida 3/9");
    expect(statusReadout(null)).toBeNull();
  });

  it("applies a change to the selection only when the token belongs to it", () => {
    expect(changeTargets(["a", "b"], "a")).toEqual(["a", "b"]);
    expect(changeTargets(["a", "b"], "c")).toEqual(["c"]);
  });

  it("keeps the menu inside the screen", () => {
    const size = { width: 300, height: 200 };
    const screen = { width: 1000, height: 800 };
    expect(placeMenu({ x: 100, y: 100 }, size, screen)).toEqual({ x: 100, y: 100 });
    expect(placeMenu({ x: 900, y: 700 }, size, screen)).toEqual({ x: 600, y: 500 });
  });
});

describe("arena utils: effect picker", () => {
  it("filters by tag, by what fits the action and by name or description", () => {
    expect(filterEffects(ARENA_EFFECT_CATALOG, "", "all", "damage", "health")).toHaveLength(4);
    expect(filterEffects(ARENA_EFFECT_CATALOG, "", "fits", "heal", "sanity")).toEqual(["clarity"]);
    expect(filterEffects(ARENA_EFFECT_CATALOG, "", "damage", "heal", "health")).toEqual([
      "strike",
      "fissure",
    ]);
    expect(filterEffects(ARENA_EFFECT_CATALOG, "brasa", "all", "damage", "health")).toEqual([
      "ember",
    ]);
    expect(filterEffects(ARENA_EFFECT_CATALOG, "petalas", "all", "damage", "health")).toEqual([
      "ember",
    ]);
  });
});

describe("arena utils: change preference", () => {
  it("keeps a valid preference and drops anything malformed", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
    expect(readChangePreference()).toEqual({
      kind: "damage",
      resource: "health",
      amount: 5,
      effect: "auto",
    });
    saveChangePreference({ kind: "heal", resource: "sanity", amount: 12, effect: "ember" });
    expect(readChangePreference()).toEqual({
      kind: "heal",
      resource: "sanity",
      amount: 12,
      effect: "ember",
    });
    window.localStorage.setItem(
      "magista-arena-change",
      JSON.stringify({ kind: "heal", resource: "sanity", amount: 12, effect: "nope" }),
    );
    expect(readChangePreference().effect).toBe("auto");
    window.localStorage.setItem(
      "magista-arena-change",
      JSON.stringify({ kind: "heal", resource: "sanity", amount: 5000, effect: "ember" }),
    );
    expect(readChangePreference().amount).toBe(5);
    window.localStorage.setItem("magista-arena-change", "{oops");
    expect(readChangePreference().kind).toBe("damage");
    vi.unstubAllGlobals();
  });
});

describe("pastePlacements", () => {
  const bounds = { width: 1000, height: 800 };
  const copied = [
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 200, y: 140 },
  ];

  it("centers the group on the pointer keeping its layout", () => {
    expect(pastePlacements(copied, { x: 500, y: 400 }, bounds)).toEqual([
      { sourceId: "a", x: 450, y: 380 },
      { sourceId: "b", x: 550, y: 420 },
    ]);
  });

  it("shifts one board unit without a pointer and stays on the board", () => {
    expect(pastePlacements(copied, null, bounds)).toEqual([
      { sourceId: "a", x: 170, y: 170 },
      { sourceId: "b", x: 270, y: 210 },
    ]);
    expect(pastePlacements(copied, { x: 990, y: 790 }, bounds).map((copy) => copy.x)).toEqual([
      940, 1000,
    ]);
  });
});

describe("tokenNameFromFile", () => {
  it("drops the extension and turns separators into spaces", () => {
    expect(tokenNameFromFile("goblin_arqueiro-2.png")).toBe("goblin arqueiro 2");
    expect(tokenNameFromFile(".png")).toBe("Token");
    expect(tokenNameFromFile(`${"a".repeat(90)}.webp`)).toHaveLength(60);
  });
});

describe("dropPlacements", () => {
  it("lines the tokens up around the drop point, inside the board", () => {
    expect(dropPlacements({ x: 500, y: 300 }, 1, { width: 1000, height: 800 })).toEqual([
      { x: 500, y: 300 },
    ]);
    expect(dropPlacements({ x: 20, y: 300 }, 2, { width: 1000, height: 800 })).toEqual([
      { x: 0, y: 300 },
      { x: 107.5, y: 300 },
    ]);
  });
});

describe("hasTransparentEdges", () => {
  const pixels = (width: number, height: number, alphaAt: (x: number, y: number) => number) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1) data[(y * width + x) * 4 + 3] = alphaAt(x, y);
    return data;
  };

  it("spots a cut-out figure by its transparent border", () => {
    const figure = pixels(8, 8, (x, y) => (x > 1 && x < 6 && y > 1 && y < 6 ? 255 : 0));
    expect(hasTransparentEdges(figure, 8, 8)).toBe(true);
  });

  it("treats an opaque picture as a portrait", () => {
    expect(
      hasTransparentEdges(
        pixels(8, 8, () => 255),
        8,
        8,
      ),
    ).toBe(false);
  });
});

describe("tokenDisplayName", () => {
  it("hides a hidden name from players only", () => {
    expect(tokenDisplayName({ name: "Ogro", showName: false }, false)).toBe("Token");
    expect(tokenDisplayName({ name: "Ogro", showName: false }, true)).toBe("Ogro");
    expect(tokenDisplayName({ name: "Ogro", showName: true }, false)).toBe("Ogro");
  });
});

describe("pickAttacker", () => {
  const options = [{ id: "ana" }, { id: "bruno" }];

  it("starts a player with their own token and the GM with nobody", () => {
    expect(pickAttacker(options, null, false)).toBe("ana");
    expect(pickAttacker([], null, false)).toBe("");
    expect(pickAttacker(options, null, true)).toBe("");
  });

  it("keeps the choice, nobody included, and drops one no longer listed", () => {
    expect(pickAttacker(options, "", false)).toBe("");
    expect(pickAttacker(options, "bruno", false)).toBe("bruno");
    expect(pickAttacker(options, "gone", false)).toBe("");
  });
});
