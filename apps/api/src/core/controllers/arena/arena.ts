import {
  ARENA_MAP_MAX_BYTES,
  ARENA_MAP_MAX_PIXELS,
  ARENA_MAP_MAX_SIDE,
  ARENA_TOKEN_IMAGE_MAX_BYTES,
  ARENA_TOKEN_IMAGE_MAX_SIDE,
  arenaBoardInputSchema,
  arenaIdSchema,
  canControlToken,
  clampToMap,
  createArenaFolderInputSchema,
  createArenaSceneInputSchema,
  isSameOrDescendant,
  moveArenaLibraryItemInputSchema,
  renameArenaFolderInputSchema,
  createArenaTokenInputSchema,
  deleteArenaTokensInputSchema,
  moveArenaTokensInputSchema,
  renameArenaSceneInputSchema,
  setActiveSceneInputSchema,
  updateArenaTokenInputSchema,
  updateArenaTokensInputSchema,
} from "@magista/shared";

import { arenaSceneModels } from "@/core/models/arenaScene";
import { arenaSceneFolderModels } from "@/core/models/arenaSceneFolder";
import { arenaTokenModels } from "@/core/models/arenaToken";
import { characterModels } from "@/core/models/character";
import { imageAssets } from "@/core/controllers/mediaAsset";
import { arenaImages } from "@/core/services/media";

import type { IViewer } from "../controllers.types";
import { arenaErrors } from "./arena.errors";
import type { IArenaController, IArenaControllerDeps } from "./arena.types";
import { sceneAudience, tokenAudience } from "./arena.utils";

/**
 * Builds the Arena controller: scenes (maps), the live scene, tokens and their movement.
 * The GM manages everything; a player sees the live scene without hidden tokens and moves only the tokens of
 * characters granted to their account. Access is read again on every move, so a revoked grant stops at once.
 */
export function createArenaController({
  scenes,
  folders,
  tokens,
  characters,
  images,
  assets,
}: IArenaControllerDeps): IArenaController {
  const failed = (action: string, error: unknown) => {
    console.error(`${action} failed:`, error);
    return { error: arenaErrors.unexpected };
  };

  const isId = (value: unknown): value is string => arenaIdSchema.safeParse(value).success;

  const cleanup = (task: Promise<void>) =>
    task.catch((error: unknown) => {
      console.error("arena media cleanup failed:", error);
    });

  const measuredMaps = new Set<string>();
  let measuring: Promise<void> | null = null;
  let allMeasured = false;

  /**
   * Measures, once per server process, the maps of scenes stored before their natural size was recorded, so
   * their board resolves to the size they always had. Concurrent requests share one run, and a map that cannot
   * be measured is not tried again until the server restarts.
   */
  const measureOldMaps = () => {
    if (allMeasured) return Promise.resolve();
    measuring ??= (async () => {
      const pending = (await scenes.findUnmeasuredMaps()).filter(
        ({ mapKey }) => !measuredMaps.has(mapKey),
      );
      if (pending.length === 0) allMeasured = true;
      for (const { id, mapKey } of pending) {
        measuredMaps.add(mapKey);
        const size = await images.readMapSize(mapKey).catch((error: unknown) => {
          console.error("arena map measure failed:", error);
          return null;
        });
        if (size) await scenes.setMapSize(id, size);
      }
    })().finally(() => {
      measuring = null;
    });
    return measuring;
  };

  const authorizeMany = async (viewer: IViewer, ids: string[]) => {
    const found = await tokens.findManyByIds(ids);
    const activeSceneId = await scenes.findActiveSceneId();
    if (viewer.role === "GM") return { allowed: found, forbidden: false, activeSceneId };
    const accessible = await characters.listAccessibleIds(viewer.accountId);
    const visible = found.filter((token) => token.sceneId === activeSceneId && !token.hidden);
    const allowed = visible.filter((token) => canControlToken(viewer, token, accessible));
    return { allowed, forbidden: visible.length > allowed.length, activeSceneId };
  };

  const getView: IArenaController["getView"] = async (viewer, requestedSceneId) => {
    const wantsScene =
      viewer.role === "GM" && requestedSceneId !== undefined && requestedSceneId !== "";
    const requestedId = wantsScene && isId(requestedSceneId) ? requestedSceneId : null;
    if (wantsScene && !requestedId) return { error: arenaErrors.sceneNotFound };
    try {
      await measureOldMaps();
      const activeSceneId = await scenes.findActiveSceneId();
      const targetId = requestedId ?? activeSceneId;
      const scene = targetId ? await scenes.findById(targetId) : null;
      if (requestedId && !scene) return { error: arenaErrors.sceneNotFound };
      const list = scene
        ? await tokens.listByScene(scene.id, { includeHidden: viewer.role === "GM" })
        : [];
      const accessible =
        viewer.role === "GM" ? [] : await characters.listAccessibleIds(viewer.accountId);
      const controllableCharacterIds = [
        ...new Set(
          list
            .map((token) => token.characterId)
            .filter((id): id is string => id !== null && accessible.includes(id)),
        ),
      ];
      const shownScene = scene && viewer.role !== "GM" ? { ...scene, folderId: null } : scene;
      return {
        message: "Arena carregada",
        payload: { activeSceneId, scene: shownScene, tokens: list, controllableCharacterIds },
      };
    } catch (error) {
      return failed("getView", error);
    }
  };

  const listScenes: IArenaController["listScenes"] = async (viewer) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    try {
      return { message: "Cenas carregadas", payload: await scenes.list() };
    } catch (error) {
      return failed("listScenes", error);
    }
  };

  const createScene: IArenaController["createScene"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = createArenaSceneInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidName };
    const { name, folderId } = parsed.data;
    try {
      if (folderId && !(await folders.findById(folderId)))
        return { error: arenaErrors.folderNotFound };
      return { message: "Cena criada", payload: await scenes.create(name, folderId) };
    } catch (error) {
      return failed("createScene", error);
    }
  };

  const listLibrary: IArenaController["listLibrary"] = async (viewer) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    try {
      await measureOldMaps();
      const [sceneList, folderList] = await Promise.all([scenes.list(), folders.list()]);
      return { message: "Cenas carregadas", payload: { scenes: sceneList, folders: folderList } };
    } catch (error) {
      return failed("listLibrary", error);
    }
  };

  const createFolder: IArenaController["createFolder"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = createArenaFolderInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidName };
    const { name, parentId } = parsed.data;
    try {
      if (parentId && !(await folders.findById(parentId)))
        return { error: arenaErrors.folderNotFound };
      return { message: "Pasta criada", payload: await folders.create(name, parentId) };
    } catch (error) {
      return failed("createFolder", error);
    }
  };

  const renameFolder: IArenaController["renameFolder"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.folderNotFound };
    const parsed = renameArenaFolderInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidName };
    try {
      const folder = await folders.rename(id, parsed.data.name);
      return folder
        ? { message: "Pasta renomeada", payload: folder }
        : { error: arenaErrors.folderNotFound };
    } catch (error) {
      return failed("renameFolder", error);
    }
  };

  const deleteFolder: IArenaController["deleteFolder"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.folderNotFound };
    try {
      return (await folders.remove(id))
        ? { message: "Pasta excluída", payload: { id } }
        : { error: arenaErrors.folderNotFound };
    } catch (error) {
      return failed("deleteFolder", error);
    }
  };

  const moveLibraryItem: IArenaController["moveLibraryItem"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = moveArenaLibraryItemInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidMove };
    const { kind, id, parentId, index } = parsed.data;
    try {
      const folderList = await folders.list();
      if (parentId && !folderList.some((folder) => folder.id === parentId))
        return { error: arenaErrors.folderNotFound };
      if (kind === "folder") {
        if (!folderList.some((folder) => folder.id === id))
          return { error: arenaErrors.folderNotFound };
        if (parentId && isSameOrDescendant(folderList, parentId, id))
          return { error: arenaErrors.invalidFolderMove };
        if (!(await folders.moveFolder(id, parentId, index)))
          return { error: arenaErrors.invalidFolderMove };
      } else {
        if (!(await scenes.findById(id))) return { error: arenaErrors.sceneNotFound };
        await folders.moveScene(id, parentId, index);
      }
      return { message: "Item movido", payload: null };
    } catch (error) {
      return failed("moveLibraryItem", error);
    }
  };

  const renameScene: IArenaController["renameScene"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.sceneNotFound };
    const parsed = renameArenaSceneInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidName };
    try {
      const scene = await scenes.rename(id, parsed.data.name);
      if (!scene) return { error: arenaErrors.sceneNotFound };
      const audience = sceneAudience(id, await scenes.findActiveSceneId());
      return { message: "Cena renomeada", payload: { scene, audience } };
    } catch (error) {
      return failed("renameScene", error);
    }
  };

  const deleteScene: IArenaController["deleteScene"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.sceneNotFound };
    try {
      const audience = sceneAudience(id, await scenes.findActiveSceneId());
      const removed = await scenes.remove(id);
      if (!removed) return { error: arenaErrors.sceneNotFound };
      await cleanup(images.removeScene(id));
      for (const tokenId of removed.tokenIds) await cleanup(images.removeToken(tokenId));
      for (const key of new Set(removed.imageKeys)) await cleanup(assets.release(key));
      return { message: "Cena excluída", payload: { sceneId: id, audience } };
    } catch (error) {
      return failed("deleteScene", error);
    }
  };

  const setSceneMap: IArenaController["setSceneMap"] = async (viewer, id, upload) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.sceneNotFound };
    if (!upload.file || upload.file.length === 0) return { error: arenaErrors.imageMissing };
    if (upload.file.length > ARENA_MAP_MAX_BYTES) return { error: arenaErrors.mapTooLarge };
    const size = images.sizeOf(upload.file);
    if (!size) return { error: arenaErrors.imageInvalid };
    if (
      size.width > ARENA_MAP_MAX_SIDE ||
      size.height > ARENA_MAP_MAX_SIDE ||
      size.width * size.height > ARENA_MAP_MAX_PIXELS
    )
      return { error: arenaErrors.mapTooBig };
    try {
      if (!(await scenes.findById(id))) return { error: arenaErrors.sceneNotFound };
      await measureOldMaps();
      const stored = await assets.ingest(upload.file);
      if (!stored) return { error: arenaErrors.imageInvalid };
      const { key } = stored;
      const change = await scenes.setMapKey(id, key, size).catch(async (error: unknown) => {
        await cleanup(assets.release(key));
        throw error;
      });
      if (!change) {
        await cleanup(assets.release(key));
        return { error: arenaErrors.sceneNotFound };
      }
      if (change.previousKey && change.previousKey !== key)
        await cleanup(assets.release(change.previousKey));
      const audience = sceneAudience(id, await scenes.findActiveSceneId());
      return { message: "Mapa salvo", payload: { scene: change.scene, audience } };
    } catch (error) {
      return failed("setSceneMap", error);
    }
  };

  const setSceneBoard: IArenaController["setSceneBoard"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.sceneNotFound };
    const parsed = arenaBoardInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidBoard };
    try {
      await measureOldMaps();
      const scene = await scenes.setBoard(id, parsed.data);
      if (!scene) return { error: arenaErrors.sceneNotFound };
      const audience = sceneAudience(id, await scenes.findActiveSceneId());
      return { message: "Tamanho do tabuleiro salvo", payload: { scene, audience } };
    } catch (error) {
      return failed("setSceneBoard", error);
    }
  };

  const setActiveScene: IArenaController["setActiveScene"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = setActiveSceneInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidScene };
    const { sceneId } = parsed.data;
    try {
      if (sceneId && !(await scenes.findById(sceneId))) return { error: arenaErrors.sceneNotFound };
      await scenes.setActiveScene(sceneId);
      return { message: "Cena ativa atualizada", payload: { activeSceneId: sceneId } };
    } catch (error) {
      return failed("setActiveScene", error);
    }
  };

  const createToken: IArenaController["createToken"] = async (viewer, sceneId, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(sceneId)) return { error: arenaErrors.sceneNotFound };
    const parsed = createArenaTokenInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidToken };
    const { characterId, name, ...placement } = parsed.data;
    try {
      const scene = await scenes.findById(sceneId);
      if (!scene) return { error: arenaErrors.sceneNotFound };
      if (characterId && !(await characters.exists(characterId)))
        return { error: arenaErrors.characterNotFound };
      const token = await tokens.create(sceneId, {
        characterId,
        name: characterId ? null : (name ?? null),
        ...placement,
        ...clampToMap(placement, scene),
      });
      const audience = tokenAudience(token, await scenes.findActiveSceneId());
      return { message: "Token criado", payload: { token, audience, previousAudience: audience } };
    } catch (error) {
      return failed("createToken", error);
    }
  };

  const updateToken: IArenaController["updateToken"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.tokenNotFound };
    const parsed = updateArenaTokenInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidToken };
    try {
      const existing = await tokens.findById(id);
      if (!existing) return { error: arenaErrors.tokenNotFound };
      const { name, ...rest } = parsed.data;
      const patch = existing.characterId || name === undefined ? rest : { ...rest, name };
      if (Object.keys(patch).length === 0) return { error: arenaErrors.characterName };
      const token = await tokens.update(id, patch);
      if (!token) return { error: arenaErrors.tokenNotFound };
      const activeSceneId = await scenes.findActiveSceneId();
      return {
        message: "Token atualizado",
        payload: {
          token,
          audience: tokenAudience(token, activeSceneId),
          previousAudience: tokenAudience(existing, activeSceneId),
        },
      };
    } catch (error) {
      return failed("updateToken", error);
    }
  };

  const updateTokens: IArenaController["updateTokens"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = updateArenaTokensInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidToken };
    try {
      const existing = await tokens.findManyByIds(parsed.data.updates.map((update) => update.id));
      const byId = new Map(existing.map((token) => [token.id, token]));
      const patches = parsed.data.updates.flatMap(({ id, name, size, hidden }) => {
        const token = byId.get(id);
        if (!token) return [];
        const patch = {
          ...(size === undefined ? {} : { size }),
          ...(hidden === undefined ? {} : { hidden }),
          ...(name === undefined || token.characterId ? {} : { name }),
        };
        return Object.keys(patch).length > 0 ? [{ id, patch }] : [];
      });
      if (patches.length === 0)
        return {
          error: existing.length > 0 ? arenaErrors.characterName : arenaErrors.tokenNotFound,
        };
      const updated = await tokens.updateMany(patches);
      const activeSceneId = await scenes.findActiveSceneId();
      const changes = updated.map((token) => {
        const before = byId.get(token.id) ?? token;
        return {
          token,
          audience: tokenAudience(token, activeSceneId),
          previousAudience: tokenAudience(before, activeSceneId),
        };
      });
      return { message: "Tokens atualizados", payload: changes };
    } catch (error) {
      return failed("updateTokens", error);
    }
  };

  const deleteTokens: IArenaController["deleteTokens"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    const parsed = deleteArenaTokensInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidToken };
    try {
      const removed = await tokens.removeMany(parsed.data.ids);
      if (removed.length === 0) return { error: arenaErrors.tokenNotFound };
      for (const { id } of removed) await cleanup(images.removeToken(id));
      const imageKeys = new Set(removed.flatMap((token) => token.imageKey ?? []));
      for (const key of imageKeys) await cleanup(assets.release(key));
      const activeSceneId = await scenes.findActiveSceneId();
      const removals = removed.map((token) => ({
        event: { id: token.id, sceneId: token.sceneId },
        audience: tokenAudience(token, activeSceneId),
      }));
      return { message: "Tokens removidos", payload: removals };
    } catch (error) {
      return failed("deleteTokens", error);
    }
  };

  const deleteToken: IArenaController["deleteToken"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.tokenNotFound };
    try {
      const removed = await tokens.remove(id);
      if (!removed) return { error: arenaErrors.tokenNotFound };
      await cleanup(images.removeToken(id));
      await cleanup(assets.release(removed.imageKey));
      const audience = tokenAudience(removed, await scenes.findActiveSceneId());
      return {
        message: "Token removido",
        payload: { event: { id, sceneId: removed.sceneId }, audience },
      };
    } catch (error) {
      return failed("deleteToken", error);
    }
  };

  const setTokenImage: IArenaController["setTokenImage"] = async (viewer, id, upload) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.tokenNotFound };
    if (!upload.file || upload.file.length === 0) return { error: arenaErrors.imageMissing };
    if (upload.file.length > ARENA_TOKEN_IMAGE_MAX_BYTES)
      return { error: arenaErrors.imageTooLarge };
    const size = images.sizeOf(upload.file);
    if (!size) return { error: arenaErrors.imageInvalid };
    if (size.width > ARENA_TOKEN_IMAGE_MAX_SIDE || size.height > ARENA_TOKEN_IMAGE_MAX_SIDE)
      return { error: arenaErrors.tokenImageTooBig };
    try {
      const existing = await tokens.findById(id);
      if (!existing) return { error: arenaErrors.tokenNotFound };
      if (existing.characterId) return { error: arenaErrors.npcOnly };
      const stored = await assets.ingest(upload.file);
      if (!stored) return { error: arenaErrors.imageInvalid };
      const { key } = stored;
      const change = await tokens.setImageKey(id, key).catch(async (error: unknown) => {
        await cleanup(assets.release(key));
        throw error;
      });
      if (!change) {
        await cleanup(assets.release(key));
        return { error: arenaErrors.tokenNotFound };
      }
      if (change.previousKey && change.previousKey !== key)
        await cleanup(assets.release(change.previousKey));
      const audience = tokenAudience(change.token, await scenes.findActiveSceneId());
      return {
        message: "Imagem salva",
        payload: { token: change.token, audience, previousAudience: audience },
      };
    } catch (error) {
      return failed("setTokenImage", error);
    }
  };

  const move: IArenaController["move"] = async (viewer, input) => {
    const parsed = moveArenaTokensInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidMove };
    const { moves } = parsed.data;
    try {
      const auth = await authorizeMany(
        viewer,
        moves.map((entry) => entry.tokenId),
      );
      if (auth.allowed.length === 0)
        return { error: auth.forbidden ? arenaErrors.forbidden : arenaErrors.tokenNotFound };
      const allowedIds = new Set(auth.allowed.map((token) => token.id));
      const guard =
        viewer.role === "GM" || !auth.activeSceneId ? undefined : { sceneId: auth.activeSceneId };
      const sceneOf = new Map(auth.allowed.map((token) => [token.id, token.sceneId]));
      const boards = await scenes.findBoards([...new Set(sceneOf.values())]);
      const placed = moves.flatMap((entry) => {
        const board = boards.get(sceneOf.get(entry.tokenId) ?? "");
        if (!allowedIds.has(entry.tokenId) || !board) return [];
        return [{ ...entry, ...clampToMap(entry, board) }];
      });
      const moved = await tokens.moveMany(placed, guard);
      if (moved.length === 0) return { error: arenaErrors.tokenNotFound };
      const activeSceneId = await scenes.findActiveSceneId();
      const movedIds = new Set(moved.map((token) => token.id));
      const changes = moved.map((token) => {
        const audience = tokenAudience(token, activeSceneId);
        return { token, audience, previousAudience: audience };
      });
      const refused = moves.map((entry) => entry.tokenId).filter((id) => !movedIds.has(id));
      return { message: "Tokens movidos", payload: { changes, refused } };
    } catch (error) {
      return failed("move", error);
    }
  };

  return {
    getView,
    listScenes,
    listLibrary,
    createFolder,
    renameFolder,
    deleteFolder,
    moveLibraryItem,
    createScene,
    renameScene,
    deleteScene,
    setSceneMap,
    setSceneBoard,
    setActiveScene,
    createToken,
    updateToken,
    deleteToken,
    setTokenImage,
    move,
    updateTokens,
    deleteTokens,
  };
}

export const arenaController = createArenaController({
  scenes: arenaSceneModels,
  folders: arenaSceneFolderModels,
  tokens: arenaTokenModels,
  characters: characterModels,
  images: arenaImages,
  assets: imageAssets,
});
