import type { IArenaToken, IArenaView } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

function token(id: string, extra: Partial<IArenaToken> = {}): IArenaToken {
  return {
    id,
    sceneId: "s1",
    characterId: null,
    name: id,
    imageUrl: null,
    x: 0,
    y: 0,
    size: 140,
    hidden: false,
    position: 0,
    ...extra,
  };
}

const view: IArenaView = {
  activeSceneId: "s1",
  scene: { id: "s1", name: "Ruínas", mapUrl: null, position: 0 },
  tokens: [token("a", { position: 0 }), token("b", { position: 1 })],
  controllableCharacterIds: [],
};

function loaded() {
  const store = createAppStore();
  store.getState().startArenaLoad();
  store.getState().finishArenaLoad(view);
  return store;
}

describe("arena slice", () => {
  it("loads once and refreshes without going back to loading", () => {
    const store = createAppStore();
    store.getState().startArenaLoad();
    expect(store.getState().arena.status).toBe("loading");
    store.getState().finishArenaLoad(view);
    store.getState().startArenaLoad();
    expect(store.getState().arena).toMatchObject({
      status: "ready",
      view: { scene: { id: "s1" } },
    });
    store.getState().failArenaLoad("falhou");
    expect(store.getState().arena).toMatchObject({ status: "ready", error: "falhou" });
  });

  it("upserts tokens of the shown scene only and keeps the drawing order", () => {
    const store = loaded();
    store.getState().applyArenaToken(token("c", { position: 2 }));
    store.getState().applyArenaToken(token("a", { position: 0, x: 50 }));
    store.getState().applyArenaToken(token("z", { sceneId: "other" }));
    expect(store.getState().arena.view?.tokens.map((entry) => [entry.id, entry.x])).toEqual([
      ["a", 50],
      ["b", 0],
      ["c", 0],
    ]);
  });

  it("tracks drag previews until the final move arrives", () => {
    const store = loaded();
    store.getState().applyArenaDrag({
      moves: [
        { tokenId: "a", x: 10, y: 20 },
        { tokenId: "ghost", x: 1, y: 1 },
      ],
    });
    expect(store.getState().arena.previews).toEqual({ a: { x: 10, y: 20 } });
    store.getState().applyArenaToken(token("a", { x: 12, y: 22 }));
    expect(store.getState().arena.previews).toEqual({});
  });

  it("drops the selection when its token is removed or disappears on reload", () => {
    const store = loaded();
    store.getState().selectArenaTokens(["a", "b"], "replace");
    store.getState().removeArenaToken({ id: "b", sceneId: "s1" });
    expect(store.getState().arena.selectedTokenIds).toEqual(["a"]);
    store.getState().finishArenaLoad({ ...view, tokens: [token("b")] });
    expect(store.getState().arena.selectedTokenIds).toEqual([]);
  });

  it("replaces, adds to and toggles the selection", () => {
    const store = loaded();
    store.getState().selectArenaTokens(["a"], "replace");
    store.getState().selectArenaTokens(["b"], "add");
    expect(store.getState().arena.selectedTokenIds).toEqual(["a", "b"]);
    store.getState().selectArenaTokens(["a"], "toggle");
    expect(store.getState().arena.selectedTokenIds).toEqual(["b"]);
    store.getState().selectArenaTokens([], "replace");
    expect(store.getState().arena.selectedTokenIds).toEqual([]);
  });

  it("moves tokens locally before the server confirms", () => {
    const store = loaded();
    store.getState().placeArenaTokens([
      { tokenId: "a", x: 5, y: 6 },
      { tokenId: "b", x: 300, y: 40 },
    ]);
    expect(store.getState().arena.view?.tokens.map((entry) => [entry.x, entry.y])).toEqual([
      [5, 6],
      [300, 40],
    ]);
  });

  it("patches size and visibility locally", () => {
    const store = loaded();
    store.getState().patchArenaTokens([
      { id: "a", size: 200 },
      { id: "b", hidden: true },
    ]);
    expect(store.getState().arena.view?.tokens.map((entry) => [entry.size, entry.hidden])).toEqual([
      [200, false],
      [140, true],
    ]);
  });
});
