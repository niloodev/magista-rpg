import {
  ARENA_MAP_MAX_BYTES,
  ARENA_TOKEN_IMAGE_MAX_BYTES,
  arenaIdSchema,
  canControlToken,
  createArenaSceneInputSchema,
  createArenaTokenInputSchema,
  type IArenaToken,
  moveArenaTokenInputSchema,
  renameArenaSceneInputSchema,
  setActiveSceneInputSchema,
  updateArenaTokenInputSchema,
} from "@magista/shared";

import { arenaSceneModels } from "@/core/models/arenaScene";
import { arenaTokenModels } from "@/core/models/arenaToken";
import { characterModels } from "@/core/models/character";
import { arenaImages } from "@/core/services/media";

import type { IViewer } from "../controllers.types";
import { arenaErrors, type ArenaError } from "./arena.errors";
import type { IArenaController, IArenaControllerDeps } from "./arena.types";
import { sceneAudience, tokenAudience } from "./arena.utils";

/**
 * Builds the Arena controller: scenes (maps), the live scene, tokens and their movement.
 * The GM manages everything; a player sees the live scene without hidden tokens and moves only the tokens of
 * characters granted to their account. Access is read again on every move, so a revoked grant stops at once.
 */
export function createArenaController({
  scenes,
  tokens,
  characters,
  images,
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

  const authorizeControl = async (
    viewer: IViewer,
    tokenId: string,
  ): Promise<{ token: IArenaToken; activeSceneId: string | null } | { error: ArenaError }> => {
    const token = await tokens.findById(tokenId);
    if (!token) return { error: arenaErrors.tokenNotFound };
    const activeSceneId = await scenes.findActiveSceneId();
    if (viewer.role === "GM") return { token, activeSceneId };
    if (token.sceneId !== activeSceneId || token.hidden)
      return { error: arenaErrors.tokenNotFound };
    const granted =
      token.characterId && (await characters.hasAccess(token.characterId, viewer.accountId))
        ? [token.characterId]
        : [];
    if (!canControlToken(viewer, token, granted)) return { error: arenaErrors.forbidden };
    return { token, activeSceneId };
  };

  const getView: IArenaController["getView"] = async (viewer, requestedSceneId) => {
    const wantsScene =
      viewer.role === "GM" && requestedSceneId !== undefined && requestedSceneId !== "";
    const requestedId = wantsScene && isId(requestedSceneId) ? requestedSceneId : null;
    if (wantsScene && !requestedId) return { error: arenaErrors.sceneNotFound };
    try {
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
      return {
        message: "Arena carregada",
        payload: { activeSceneId, scene, tokens: list, controllableCharacterIds },
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
    try {
      return { message: "Cena criada", payload: await scenes.create(parsed.data.name) };
    } catch (error) {
      return failed("createScene", error);
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
    try {
      if (!(await scenes.findById(id))) return { error: arenaErrors.sceneNotFound };
      const key = await images.storeMap(id, upload.file);
      if (!key) return { error: arenaErrors.imageInvalid };
      const change = await scenes.setMapKey(id, key).catch(async (error: unknown) => {
        await cleanup(images.remove(key));
        throw error;
      });
      if (!change) {
        await cleanup(images.remove(key));
        return { error: arenaErrors.sceneNotFound };
      }
      if (change.previousKey && change.previousKey !== key)
        await cleanup(images.remove(change.previousKey));
      const audience = sceneAudience(id, await scenes.findActiveSceneId());
      return { message: "Mapa salvo", payload: { scene: change.scene, audience } };
    } catch (error) {
      return failed("setSceneMap", error);
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
      if (!(await scenes.findById(sceneId))) return { error: arenaErrors.sceneNotFound };
      if (characterId && !(await characters.exists(characterId)))
        return { error: arenaErrors.characterNotFound };
      const token = await tokens.create(sceneId, {
        characterId,
        name: characterId ? null : (name ?? null),
        ...placement,
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

  const deleteToken: IArenaController["deleteToken"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: arenaErrors.gmOnly };
    if (!isId(id)) return { error: arenaErrors.tokenNotFound };
    try {
      const removed = await tokens.remove(id);
      if (!removed) return { error: arenaErrors.tokenNotFound };
      await cleanup(images.removeToken(id));
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
    try {
      const existing = await tokens.findById(id);
      if (!existing) return { error: arenaErrors.tokenNotFound };
      if (existing.characterId) return { error: arenaErrors.npcOnly };
      const key = await images.storeToken(id, upload.file);
      if (!key) return { error: arenaErrors.imageInvalid };
      const change = await tokens.setImageKey(id, key).catch(async (error: unknown) => {
        await cleanup(images.remove(key));
        throw error;
      });
      if (!change) {
        await cleanup(images.remove(key));
        return { error: arenaErrors.tokenNotFound };
      }
      if (change.previousKey && change.previousKey !== key)
        await cleanup(images.remove(change.previousKey));
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
    const parsed = moveArenaTokenInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidMove };
    const { tokenId, x, y } = parsed.data;
    try {
      const allowed = await authorizeControl(viewer, tokenId);
      if ("error" in allowed) return allowed;
      const guard =
        viewer.role === "GM" || !allowed.activeSceneId
          ? undefined
          : { sceneId: allowed.activeSceneId };
      const token = await tokens.move(tokenId, x, y, guard);
      if (!token) return { error: arenaErrors.tokenNotFound };
      const audience = tokenAudience(token, await scenes.findActiveSceneId());
      return { message: "Token movido", payload: { token, audience, previousAudience: audience } };
    } catch (error) {
      return failed("move", error);
    }
  };

  const drag: IArenaController["drag"] = async (viewer, input) => {
    const parsed = moveArenaTokenInputSchema.safeParse(input);
    if (!parsed.success) return { error: arenaErrors.invalidMove };
    const { tokenId, x, y } = parsed.data;
    try {
      const allowed = await authorizeControl(viewer, tokenId);
      if ("error" in allowed) return allowed;
      return {
        message: "Arrastando",
        payload: {
          event: { tokenId, x, y },
          audience: tokenAudience(allowed.token, allowed.activeSceneId),
        },
      };
    } catch (error) {
      return failed("drag", error);
    }
  };

  return {
    getView,
    listScenes,
    createScene,
    renameScene,
    deleteScene,
    setSceneMap,
    setActiveScene,
    createToken,
    updateToken,
    deleteToken,
    setTokenImage,
    move,
    drag,
  };
}

export const arenaController = createArenaController({
  scenes: arenaSceneModels,
  tokens: arenaTokenModels,
  characters: characterModels,
  images: arenaImages,
});
