import type { IArenaFolder, IArenaScene, IArenaToken } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import type { IArenaSceneModels } from "@/core/models/arenaScene";
import type { IArenaSceneFolderModels } from "@/core/models/arenaSceneFolder";
import type { IArenaMoveGuard, IArenaTokenModels, IArenaTokenMove } from "@/core/models/arenaToken";
import type { IArenaImageStore } from "@/core/services/media";

import { createArenaController } from "./arena";
import { arenaErrors } from "./arena.errors";

const LIVE = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
const PREP = "7a2d1c3f-9b54-4d5f-8c9e-3a4b2d6e8f01";
const ANA = "8b3e2d40-ac65-4e60-9daf-4b5c3e7f9012";
const BRUNO = "9c4f3e51-bd76-4f71-8eb0-5c6d4f8a0123";
const T_ANA = "1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b";
const T_BRUNO = "2a3b4c5d-6e7f-4809-9a1b-2c3d4e5f6a7b";
const T_WOLF = "3b4c5d6e-7f80-4910-8b2c-3d4e5f6a7b8c";
const T_HIDDEN = "4c5d6e7f-8091-4a21-9c3d-4e5f6a7b8c9d";
const T_PREP = "5d6e7f80-91a2-4b32-8d4e-5f6a7b8c9dae";
const F_ROOT = "7f8091a2-b3c4-4d54-8e6f-7a8b9cadbecf";
const F_CHILD = "8091a2b3-c4d5-4e65-9f70-8b9cadbecfd0";
const MISSING = "6e7f8091-a2b3-4c43-9e5f-6a7b8c9daebf";

const gm = { accountId: "gm", role: "GM" as const };
const alice = { accountId: "alice", role: "PLAYER" as const };
const access: Record<string, string[]> = { alice: [ANA] };

function token(id: string, sceneId: string, extra: Partial<IArenaToken> = {}): IArenaToken {
  return {
    id,
    sceneId,
    characterId: null,
    name: "Lobo",
    imageUrl: null,
    x: 10,
    y: 10,
    size: 140,
    hidden: false,
    position: 0,
    ...extra,
  };
}

function build(options: { active?: string | null } = {}) {
  const sceneList: IArenaScene[] = [
    { id: LIVE, name: "Ruínas", folderId: null, mapUrl: null, position: 0 },
    { id: PREP, name: "Taverna", folderId: F_ROOT, mapUrl: null, position: 1 },
  ];
  let active = options.active === undefined ? LIVE : options.active;
  let tokenList: IArenaToken[] = [
    token(T_ANA, LIVE, { characterId: ANA, name: "Ana" }),
    token(T_BRUNO, LIVE, { characterId: BRUNO, name: "Bruno" }),
    token(T_WOLF, LIVE),
    token(T_HIDDEN, LIVE, { hidden: true, name: "Emboscada" }),
    token(T_PREP, PREP, { characterId: ANA, name: "Ana" }),
  ];
  const mapKeys: Record<string, string | null> = {};
  const scenes: IArenaSceneModels = {
    list: vi.fn(async () => sceneList),
    findById: vi.fn(async (id) => sceneList.find((scene) => scene.id === id) ?? null),
    create: vi.fn(async (name, folderId) => ({
      id: MISSING,
      name,
      folderId,
      mapUrl: null,
      position: 2,
    })),
    rename: vi.fn(async (id, name) => {
      const scene = sceneList.find((entry) => entry.id === id);
      return scene ? { ...scene, name } : null;
    }),
    remove: vi.fn(async (id) => {
      if (!sceneList.some((scene) => scene.id === id)) return null;
      const tokenIds = tokenList.filter((entry) => entry.sceneId === id).map((entry) => entry.id);
      tokenList = tokenList.filter((entry) => entry.sceneId !== id);
      return { tokenIds };
    }),
    setMapKey: vi.fn(async (id, key) => {
      const scene = sceneList.find((entry) => entry.id === id);
      if (!scene) return null;
      const previousKey = mapKeys[id] ?? null;
      mapKeys[id] = key;
      return { scene: { ...scene, mapUrl: `/media/${key}` }, previousKey };
    }),
    findActiveSceneId: vi.fn(async () => active),
    setActiveScene: vi.fn(async (id) => {
      active = id;
    }),
  };
  const tokens: IArenaTokenModels = {
    listByScene: vi.fn(async (sceneId, { includeHidden }) =>
      tokenList.filter((entry) => entry.sceneId === sceneId && (includeHidden || !entry.hidden)),
    ),
    findById: vi.fn(async (id) => tokenList.find((entry) => entry.id === id) ?? null),
    findManyByIds: vi.fn(async (ids) => tokenList.filter((entry) => ids.includes(entry.id))),
    moveMany: vi.fn(async (moves: IArenaTokenMove[], guard?: IArenaMoveGuard) =>
      moves.flatMap(({ tokenId, x, y }) => {
        const found = tokenList.find((entry) => entry.id === tokenId);
        if (!found || (guard && (found.sceneId !== guard.sceneId || found.hidden))) return [];
        return [{ ...found, x, y }];
      }),
    ),
    create: vi.fn(async (sceneId, input) =>
      token(MISSING, sceneId, { ...input, name: input.name ?? "Ana" }),
    ),
    update: vi.fn(async (id, input) => {
      const found = tokenList.find((entry) => entry.id === id);
      return found ? { ...found, ...input } : null;
    }),
    remove: vi.fn(async (id) => {
      const found = tokenList.find((entry) => entry.id === id);
      if (!found) return null;
      tokenList = tokenList.filter((entry) => entry.id !== id);
      return { id, sceneId: found.sceneId, hidden: found.hidden };
    }),
    updateMany: vi.fn(async (patches: { id: string; patch: Partial<IArenaToken> }[]) =>
      patches.flatMap(({ id, patch }) => {
        const found = tokenList.find((entry) => entry.id === id);
        return found ? [{ ...found, ...patch }] : [];
      }),
    ),
    removeMany: vi.fn(async (ids: string[]) =>
      tokenList
        .filter((entry) => ids.includes(entry.id))
        .map(({ id, sceneId, hidden }) => ({ id, sceneId, hidden })),
    ),
    setImageKey: vi.fn(async (id, key) => {
      const found = tokenList.find((entry) => entry.id === id);
      return found ? { token: { ...found, imageUrl: `/media/${key}` }, previousKey: "old" } : null;
    }),
  };
  let folderList: IArenaFolder[] = [
    { id: F_ROOT, name: "Campanha", parentId: null, position: 0 },
    { id: F_CHILD, name: "Dungeon", parentId: F_ROOT, position: 0 },
  ];
  const folders: IArenaSceneFolderModels = {
    list: vi.fn(async () => folderList),
    findById: vi.fn(async (id) => folderList.find((folder) => folder.id === id) ?? null),
    create: vi.fn(async (name, parentId) => ({ id: MISSING, name, parentId, position: 0 })),
    rename: vi.fn(async (id, name) => {
      const folder = folderList.find((entry) => entry.id === id);
      return folder ? { ...folder, name } : null;
    }),
    remove: vi.fn(async (id) => {
      const exists = folderList.some((folder) => folder.id === id);
      folderList = folderList.filter((folder) => folder.id !== id);
      return exists;
    }),
    moveFolder: vi.fn(async () => true),
    moveScene: vi.fn(async () => undefined),
  };
  const images: IArenaImageStore = {
    sizeOf: vi.fn((body: Buffer) =>
      body.toString() === "huge" ? { width: 20_000, height: 100 } : { width: 2400, height: 1600 },
    ),
    storeMap: vi.fn(async (sceneId, body) =>
      body.toString() === "not-an-image" ? null : `arena/maps/${sceneId}/map-new.png`,
    ),
    storeToken: vi.fn(async (tokenId) => `arena/tokens/${tokenId}/token-new.png`),
    remove: vi.fn(async () => undefined),
    removeScene: vi.fn(async () => undefined),
    removeToken: vi.fn(async () => undefined),
  };
  const controller = createArenaController({
    scenes,
    folders,
    tokens,
    images,
    characters: {
      exists: vi.fn(async (id) => [ANA, BRUNO].includes(id)),
      listAccessibleIds: vi.fn(async (accountId) => access[accountId] ?? []),
    },
  });
  return { controller, scenes, tokens, images, folders };
}

const png = Buffer.from("png-bytes");

describe("arena controller: view", () => {
  it("shows a player the live scene without hidden tokens and with what they control", async () => {
    const { controller } = build();
    const result = await controller.getView(alice, PREP);
    if ("error" in result) throw new Error(result.error);
    expect(result.payload.scene?.id).toBe(LIVE);
    expect(result.payload.tokens.map((entry) => entry.id)).toEqual([T_ANA, T_BRUNO, T_WOLF]);
    expect(result.payload.controllableCharacterIds).toEqual([ANA]);
  });

  it("lets the GM preview any scene, hidden tokens included", async () => {
    const { controller } = build();
    const live = await controller.getView(gm);
    if ("error" in live) throw new Error(live.error);
    expect(live.payload.tokens).toHaveLength(4);
    const preview = await controller.getView(gm, PREP);
    if ("error" in preview) throw new Error(preview.error);
    expect(preview.payload).toMatchObject({ activeSceneId: LIVE, scene: { id: PREP } });
    expect(await controller.getView(gm, "nope")).toEqual({ error: arenaErrors.sceneNotFound });
    expect(await controller.getView(gm, MISSING)).toEqual({ error: arenaErrors.sceneNotFound });
  });

  it("returns an empty view when no scene is live", async () => {
    const { controller } = build({ active: null });
    const result = await controller.getView(alice);
    if ("error" in result) throw new Error(result.error);
    expect(result.payload).toEqual({
      activeSceneId: null,
      scene: null,
      tokens: [],
      controllableCharacterIds: [],
    });
  });
});

describe("arena controller: movement", () => {
  const one = (tokenId: string, x = 1, y = 1) => ({ moves: [{ tokenId, x, y }] });

  it("lets a player move their own token on the live scene", async () => {
    const { controller, tokens } = build();
    const result = await controller.move(alice, one(T_ANA, 300, 120.5));
    expect(result).toMatchObject({
      payload: { changes: [{ token: { x: 300, y: 120.5 }, audience: "table" }], refused: [] },
    });
    expect(tokens.moveMany).toHaveBeenCalledWith([{ tokenId: T_ANA, x: 300, y: 120.5 }], {
      sceneId: LIVE,
    });
  });

  it("refuses other characters, NPCs, hidden tokens and other scenes for players", async () => {
    const { controller, tokens } = build();
    expect(await controller.move(alice, one(T_BRUNO))).toEqual({ error: arenaErrors.forbidden });
    expect(await controller.move(alice, one(T_WOLF))).toEqual({ error: arenaErrors.forbidden });
    expect(await controller.move(alice, one(T_HIDDEN))).toEqual({
      error: arenaErrors.tokenNotFound,
    });
    expect(await controller.move(alice, one(T_PREP))).toEqual({ error: arenaErrors.tokenNotFound });
    expect(tokens.moveMany).not.toHaveBeenCalled();
  });

  it("moves only the controlled part of a mixed group and reports the rest", async () => {
    const { controller } = build();
    const result = await controller.move(alice, {
      moves: [
        { tokenId: T_ANA, x: 10, y: 10 },
        { tokenId: T_BRUNO, x: 20, y: 20 },
        { tokenId: T_HIDDEN, x: 30, y: 30 },
      ],
    });
    expect(result).toMatchObject({
      payload: { changes: [{ token: { id: T_ANA } }], refused: [T_BRUNO, T_HIDDEN] },
    });
  });

  it("reports a move lost to a race (token hidden after the check)", async () => {
    const { controller, tokens } = build();
    vi.mocked(tokens.moveMany).mockResolvedValueOnce([]);
    expect(await controller.move(alice, one(T_ANA))).toEqual({ error: arenaErrors.tokenNotFound });
  });

  it("lets the GM move anything and keeps hidden moves between GMs", async () => {
    const { controller } = build();
    const result = await controller.move(gm, {
      moves: [
        { tokenId: T_HIDDEN, x: 5, y: 5 },
        { tokenId: T_PREP, x: 5, y: 5 },
        { tokenId: T_WOLF, x: 5, y: 5 },
      ],
    });
    if ("error" in result) throw new Error(result.error);
    const audiences = Object.fromEntries(
      result.payload.changes.map((change) => [change.token.id, change.audience]),
    );
    expect(audiences).toEqual({ [T_HIDDEN]: "gm", [T_PREP]: "gm", [T_WOLF]: "table" });
  });

  it("validates the batch", async () => {
    const { controller } = build();
    expect(await controller.move(gm, one(T_ANA, -1, 0))).toEqual({
      error: arenaErrors.invalidMove,
    });
    expect(await controller.move(gm, { moves: [] })).toEqual({ error: arenaErrors.invalidMove });
    expect(await controller.move(gm, one(MISSING))).toEqual({ error: arenaErrors.tokenNotFound });
  });

  it("relays drag previews grouped by audience and never persists them", async () => {
    const { controller, tokens } = build();
    expect(await controller.drag(alice, one(T_ANA, 40, 50))).toEqual({
      message: "Arrastando",
      payload: {
        groups: [{ audience: "table", event: { moves: [{ tokenId: T_ANA, x: 40, y: 50 }] } }],
      },
    });
    const mixed = await controller.drag(gm, {
      moves: [
        { tokenId: T_WOLF, x: 1, y: 1 },
        { tokenId: T_HIDDEN, x: 2, y: 2 },
      ],
    });
    expect(mixed).toMatchObject({
      payload: {
        groups: [
          { audience: "table", event: { moves: [{ tokenId: T_WOLF }] } },
          { audience: "gm", event: { moves: [{ tokenId: T_HIDDEN }] } },
        ],
      },
    });
    expect(await controller.drag(alice, one(T_BRUNO))).toEqual({ error: arenaErrors.forbidden });
    expect(tokens.moveMany).not.toHaveBeenCalled();
  });
});

describe("arena controller: GM tools", () => {
  it("keeps every management action for the GM", async () => {
    const { controller } = build();
    expect(await controller.listScenes(alice)).toEqual({ error: arenaErrors.gmOnly });
    expect(await controller.createScene(alice, { name: "x" })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.setActiveScene(alice, { sceneId: PREP })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.createToken(alice, LIVE, { name: "Lobo" })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.deleteToken(alice, T_WOLF)).toEqual({ error: arenaErrors.gmOnly });
  });

  it("creates and renames scenes with valid names", async () => {
    const { controller } = build();
    expect(await controller.createScene(gm, { name: "  " })).toEqual({
      error: arenaErrors.invalidName,
    });
    expect(await controller.createScene(gm, { name: "Floresta" })).toMatchObject({
      payload: { name: "Floresta" },
    });
    expect(await controller.renameScene(gm, PREP, { name: "Porão" })).toMatchObject({
      payload: { scene: { name: "Porão" }, audience: "gm" },
    });
    expect(await controller.renameScene(gm, MISSING, { name: "x" })).toEqual({
      error: arenaErrors.sceneNotFound,
    });
  });

  it("switches the live scene only to existing scenes", async () => {
    const { controller, scenes } = build();
    expect(await controller.setActiveScene(gm, { sceneId: MISSING })).toEqual({
      error: arenaErrors.sceneNotFound,
    });
    expect(await controller.setActiveScene(gm, { sceneId: PREP })).toMatchObject({
      payload: { activeSceneId: PREP },
    });
    expect(await controller.setActiveScene(gm, { sceneId: null })).toMatchObject({
      payload: { activeSceneId: null },
    });
    expect(scenes.setActiveScene).toHaveBeenLastCalledWith(null);
  });

  it("deletes a scene with its media", async () => {
    const { controller, images } = build();
    expect(await controller.deleteScene(gm, LIVE)).toEqual({
      message: "Cena excluída",
      payload: { sceneId: LIVE, audience: "table" },
    });
    expect(images.removeScene).toHaveBeenCalledWith(LIVE);
    expect(images.removeToken).toHaveBeenCalledTimes(4);
  });

  it("stores a map, replaces the old one and refuses non images", async () => {
    const { controller, images } = build();
    expect(await controller.setSceneMap(gm, LIVE, { file: undefined })).toEqual({
      error: arenaErrors.imageMissing,
    });
    expect(await controller.setSceneMap(gm, LIVE, { file: Buffer.from("not-an-image") })).toEqual({
      error: arenaErrors.imageInvalid,
    });
    await controller.setSceneMap(gm, LIVE, { file: png });
    const second = await controller.setSceneMap(gm, LIVE, { file: png });
    expect(second).toMatchObject({ payload: { audience: "table" } });
    expect(images.remove).not.toHaveBeenCalledWith(`arena/maps/${LIVE}/map-new.png`);
  });

  it("refuses oversized maps before storing them", async () => {
    const { controller, images } = build();
    const huge = Buffer.alloc(25 * 1024 * 1024 + 1);
    expect(await controller.setSceneMap(gm, LIVE, { file: huge })).toEqual({
      error: arenaErrors.mapTooLarge,
    });
    expect(images.storeMap).not.toHaveBeenCalled();
  });

  it("creates character and NPC tokens", async () => {
    const { controller, tokens } = build();
    expect(await controller.createToken(gm, LIVE, {})).toEqual({
      error: arenaErrors.invalidToken,
    });
    expect(await controller.createToken(gm, LIVE, { characterId: MISSING })).toEqual({
      error: arenaErrors.characterNotFound,
    });
    await controller.createToken(gm, LIVE, { characterId: ANA, name: "Ignorado" });
    expect(tokens.create).toHaveBeenLastCalledWith(LIVE, expect.objectContaining({ name: null }));
    const npc = await controller.createToken(gm, PREP, { name: "Lobo", hidden: true });
    expect(npc).toMatchObject({ payload: { audience: "gm" } });
  });

  it("reports the previous audience when a token is hidden", async () => {
    const { controller } = build();
    expect(await controller.updateToken(gm, T_WOLF, { hidden: true })).toMatchObject({
      payload: { audience: "gm", previousAudience: "table", token: { hidden: true } },
    });
    expect(await controller.updateToken(gm, T_WOLF, {})).toEqual({
      error: arenaErrors.invalidToken,
    });
  });

  it("only renames NPC tokens", async () => {
    const { controller, tokens } = build();
    await controller.updateToken(gm, T_ANA, { name: "Outra", size: 200 });
    expect(tokens.update).toHaveBeenLastCalledWith(T_ANA, { size: 200 });
    expect(await controller.updateToken(gm, T_ANA, { name: "Outra" })).toEqual({
      error: arenaErrors.characterName,
    });
    await controller.updateToken(gm, T_WOLF, { name: "Lobo Alfa" });
    expect(tokens.update).toHaveBeenLastCalledWith(T_WOLF, { name: "Lobo Alfa" });
  });

  it("removes tokens and tells only who saw them", async () => {
    const { controller } = build();
    expect(await controller.deleteToken(gm, T_HIDDEN)).toMatchObject({
      payload: { event: { id: T_HIDDEN, sceneId: LIVE }, audience: "gm" },
    });
    expect(await controller.deleteToken(gm, T_WOLF)).toMatchObject({
      payload: { audience: "table" },
    });
    expect(await controller.deleteToken(gm, T_WOLF)).toEqual({ error: arenaErrors.tokenNotFound });
  });

  it("gives own images only to NPC tokens", async () => {
    const { controller, images } = build();
    expect(await controller.setTokenImage(gm, T_ANA, { file: png })).toEqual({
      error: arenaErrors.npcOnly,
    });
    expect(await controller.setTokenImage(gm, T_WOLF, { file: png })).toMatchObject({
      payload: { token: { imageUrl: `/media/arena/tokens/${T_WOLF}/token-new.png` } },
    });
    expect(images.remove).toHaveBeenCalledWith("old");
  });
});

describe("arena controller: batch edits", () => {
  it("keeps batch edits for the GM and validates them", async () => {
    const { controller } = build();
    expect(await controller.updateTokens(alice, { updates: [{ id: T_ANA, size: 200 }] })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.deleteTokens(alice, { ids: [T_WOLF] })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.updateTokens(gm, { updates: [{ id: T_ANA }] })).toEqual({
      error: arenaErrors.invalidToken,
    });
    expect(await controller.updateTokens(gm, { updates: [{ id: T_ANA, size: 10 }] })).toEqual({
      error: arenaErrors.invalidToken,
    });
    expect(await controller.updateTokens(gm, { updates: [{ id: T_ANA, name: "Outra" }] })).toEqual({
      error: arenaErrors.characterName,
    });
    expect(await controller.deleteTokens(gm, { ids: [] })).toEqual({
      error: arenaErrors.invalidToken,
    });
  });

  it("resizes and hides several tokens, reporting who stops seeing them", async () => {
    const { controller, tokens } = build();
    const result = await controller.updateTokens(gm, {
      updates: [
        { id: T_ANA, size: 200, name: "Ignorado" },
        { id: T_WOLF, hidden: true },
        { id: MISSING, size: 100 },
      ],
    });
    expect(tokens.updateMany).toHaveBeenCalledWith([
      { id: T_ANA, patch: { size: 200 } },
      { id: T_WOLF, patch: { hidden: true } },
    ]);
    expect(result).toMatchObject({
      payload: [
        { token: { id: T_ANA, size: 200 }, audience: "table", previousAudience: "table" },
        { token: { id: T_WOLF, hidden: true }, audience: "gm", previousAudience: "table" },
      ],
    });
  });

  it("removes several tokens with their media and tells only who saw each", async () => {
    const { controller, images } = build();
    const result = await controller.deleteTokens(gm, { ids: [T_WOLF, T_HIDDEN, MISSING] });
    expect(result).toMatchObject({
      payload: [
        { event: { id: T_WOLF, sceneId: LIVE }, audience: "table" },
        { event: { id: T_HIDDEN, sceneId: LIVE }, audience: "gm" },
      ],
    });
    expect(images.removeToken).toHaveBeenCalledTimes(2);
    expect(await controller.deleteTokens(gm, { ids: [MISSING] })).toEqual({
      error: arenaErrors.tokenNotFound,
    });
  });
});

describe("arena controller: scene library", () => {
  it("keeps the library for the GM", async () => {
    const { controller } = build();
    expect(await controller.listLibrary(alice)).toEqual({ error: arenaErrors.gmOnly });
    expect(await controller.createFolder(alice, { name: "x" })).toEqual({
      error: arenaErrors.gmOnly,
    });
    expect(await controller.moveLibraryItem(alice, {})).toEqual({ error: arenaErrors.gmOnly });
    const library = await controller.listLibrary(gm);
    expect(library).toMatchObject({ payload: { scenes: [{ id: LIVE }, { id: PREP }] } });
  });

  it("creates scenes and folders only inside existing folders", async () => {
    const { controller, scenes } = build();
    expect(await controller.createScene(gm, { name: "Cripta", folderId: MISSING })).toEqual({
      error: arenaErrors.folderNotFound,
    });
    await controller.createScene(gm, { name: "Cripta", folderId: F_CHILD });
    expect(scenes.create).toHaveBeenLastCalledWith("Cripta", F_CHILD);
    expect(await controller.createFolder(gm, { name: "Sub", parentId: MISSING })).toEqual({
      error: arenaErrors.folderNotFound,
    });
    expect(await controller.createFolder(gm, { name: "Sub", parentId: F_ROOT })).toMatchObject({
      payload: { name: "Sub", parentId: F_ROOT },
    });
  });

  it("renames and deletes folders", async () => {
    const { controller } = build();
    expect(await controller.renameFolder(gm, F_ROOT, { name: "Arco 1" })).toMatchObject({
      payload: { name: "Arco 1" },
    });
    expect(await controller.renameFolder(gm, MISSING, { name: "x" })).toEqual({
      error: arenaErrors.folderNotFound,
    });
    expect(await controller.deleteFolder(gm, F_CHILD)).toEqual({
      message: "Pasta excluída",
      payload: { id: F_CHILD },
    });
    expect(await controller.deleteFolder(gm, F_CHILD)).toEqual({
      error: arenaErrors.folderNotFound,
    });
  });

  it("moves scenes and folders, refusing a folder into itself", async () => {
    const { controller, folders } = build();
    expect(
      await controller.moveLibraryItem(gm, {
        kind: "scene",
        id: LIVE,
        parentId: F_CHILD,
        index: 0,
      }),
    ).toEqual({ message: "Item movido", payload: null });
    expect(folders.moveScene).toHaveBeenCalledWith(LIVE, F_CHILD, 0);
    expect(
      await controller.moveLibraryItem(gm, {
        kind: "folder",
        id: F_ROOT,
        parentId: F_CHILD,
        index: 0,
      }),
    ).toEqual({ error: arenaErrors.invalidFolderMove });
    expect(
      await controller.moveLibraryItem(gm, {
        kind: "scene",
        id: MISSING,
        parentId: null,
        index: 0,
      }),
    ).toEqual({ error: arenaErrors.sceneNotFound });
    expect(
      await controller.moveLibraryItem(gm, {
        kind: "folder",
        id: F_CHILD,
        parentId: null,
        index: 1,
      }),
    ).toEqual({ message: "Item movido", payload: null });
  });

  it("refuses a folder move that became a cycle meanwhile", async () => {
    const { controller, folders } = build();
    vi.mocked(folders.moveFolder).mockResolvedValueOnce(false);
    expect(
      await controller.moveLibraryItem(gm, {
        kind: "folder",
        id: F_ROOT,
        parentId: null,
        index: 0,
      }),
    ).toEqual({ error: arenaErrors.invalidFolderMove });
  });

  it("hides the GM folder of the live scene from players", async () => {
    const { controller, scenes } = build();
    vi.mocked(scenes.findById).mockResolvedValueOnce({
      id: LIVE,
      name: "Ruínas",
      folderId: F_ROOT,
      mapUrl: null,
      position: 0,
    });
    expect(await controller.getView(alice)).toMatchObject({
      payload: { scene: { folderId: null } },
    });
  });

  it("refuses token images too big for the table GPUs", async () => {
    const { controller } = build();
    expect(await controller.setTokenImage(gm, T_WOLF, { file: Buffer.from("huge") })).toEqual({
      error: arenaErrors.tokenImageTooBig,
    });
  });

  it("refuses maps too big for the table GPUs", async () => {
    const { controller, images } = build();
    expect(await controller.setSceneMap(gm, LIVE, { file: Buffer.from("huge") })).toEqual({
      error: arenaErrors.mapTooBig,
    });
    expect(images.storeMap).not.toHaveBeenCalled();
  });
});
