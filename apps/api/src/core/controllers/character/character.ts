import {
  characterIdSchema,
  characterImageKindSchema,
  type CharacterImageKind,
  createCharacterInputSchema,
  createEmptySheet,
  exceedsResourceMax,
  renameCharacterInputSchema,
  setCharacterAccessInputSchema,
  setFeaturesInputSchema,
  updateSheetInputSchema,
  CHARACTER_IMAGE_MAX_SIDE,
} from "@magista/shared";

import { accountModels } from "@/core/models/account";
import { characterModels } from "@/core/models/character";
import { folderModels } from "@/core/models/folder";
import { imageAssets } from "@/core/controllers/mediaAsset";
import { characterImages, MEDIA_MAX_BYTES } from "@/core/services/media";

import { canAccessCharacter } from "../controllers.utils";
import { touchesGmOnlyFields } from "./character.utils";
import { characterErrors } from "./character.errors";
import type { ICharacterController, ICharacterControllerDeps } from "./character.types";

/**
 * Builds the character controller: listing, reading and saving sheets with access checks, plus the
 * GM library actions (create, rename, delete, grant access).
 * Saves carry the updatedAt the client started from; a mismatch (someone saved in between) is a conflict.
 */
export function createCharacterController({
  characters,
  folders,
  accounts,
  images,
  assets,
}: ICharacterControllerDeps): ICharacterController {
  const failed = (action: string, error: unknown) => {
    console.error(`${action} failed:`, error);
    return { error: characterErrors.unexpected };
  };

  const listCharacters: ICharacterController["listCharacters"] = async (viewer) => {
    try {
      const payload =
        viewer.role === "GM"
          ? await characters.listSummaries()
          : await characters.listSummariesForAccount(viewer.accountId);
      return { message: "Personagens carregados", payload };
    } catch (error) {
      return failed("listCharacters", error);
    }
  };

  const listAccessibleIds: ICharacterController["listAccessibleIds"] = async (viewer) => {
    try {
      return {
        message: "Acessos carregados",
        payload: await characters.listAccessibleIds(viewer.accountId),
      };
    } catch (error) {
      return failed("listAccessibleIds", error);
    }
  };

  const getCharacter: ICharacterController["getCharacter"] = async (viewer, id) => {
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    try {
      const character = await characters.findById(id);
      if (!character) return { error: characterErrors.notFound };
      if (!(await canAccessCharacter(viewer, id, characters)))
        return { error: characterErrors.forbidden };
      return { message: "Ficha carregada", payload: character };
    } catch (error) {
      return failed("getCharacter", error);
    }
  };

  const updateSheet: ICharacterController["updateSheet"] = async (viewer, id, input) => {
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const parsed = updateSheetInputSchema.safeParse(input);
    if (!parsed.success) return { error: characterErrors.invalidSheet };
    try {
      const character = await characters.findById(id);
      if (!character) return { error: characterErrors.notFound };
      if (!(await canAccessCharacter(viewer, id, characters)))
        return { error: characterErrors.forbidden };
      if (parsed.data.baseUpdatedAt !== character.updatedAt)
        return { error: characterErrors.conflict };
      if (viewer.role !== "GM" && touchesGmOnlyFields(character.sheet, parsed.data.sheet)) {
        return { error: characterErrors.gmOnlyFields };
      }
      if (viewer.role !== "GM" && exceedsResourceMax(parsed.data.sheet)) {
        return { error: characterErrors.aboveMaximum };
      }
      const saved = await characters.updateSheet(id, parsed.data.sheet, character.updatedAt);
      if (!saved) return { error: characterErrors.conflict };
      return { message: "Ficha salva", payload: saved };
    } catch (error) {
      return failed("updateSheet", error);
    }
  };

  const createCharacter: ICharacterController["createCharacter"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    const parsed = createCharacterInputSchema.safeParse(input);
    if (!parsed.success) return { error: characterErrors.invalidName };
    try {
      const { name, folderId } = parsed.data;
      if (folderId && !(await folders.findById(folderId)))
        return { error: characterErrors.folderNotFound };
      const created = await characters.create({ name, folderId, sheet: createEmptySheet() });
      return { message: "Ficha criada", payload: created };
    } catch (error) {
      return failed("createCharacter", error);
    }
  };

  const renameCharacter: ICharacterController["renameCharacter"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const parsed = renameCharacterInputSchema.safeParse(input);
    if (!parsed.success) return { error: characterErrors.invalidName };
    try {
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      return { message: "Ficha renomeada", payload: await characters.rename(id, parsed.data.name) };
    } catch (error) {
      return failed("renameCharacter", error);
    }
  };

  const deleteCharacter: ICharacterController["deleteCharacter"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    try {
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      const previousAccountIds = await characters.listAccountIds(id);
      const keys = await characters.findImageKeys(id);
      await characters.remove(id);
      const cleanup = [...new Set([keys?.avatarKey ?? null, keys?.artKey ?? null])].map((key) =>
        assets.release(key),
      );
      await Promise.all([images.removeAll(id), ...cleanup]).catch((error: unknown) => {
        console.error("deleteCharacter images cleanup failed:", error);
      });
      return { message: "Ficha excluída", payload: { id, previousAccountIds } };
    } catch (error) {
      return failed("deleteCharacter", error);
    }
  };

  const setAccess: ICharacterController["setAccess"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const parsed = setCharacterAccessInputSchema.safeParse(input);
    if (!parsed.success) return { error: characterErrors.invalidAccess };
    try {
      const accountIds = [...new Set(parsed.data.accountIds)];
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      if ((await accounts.countPlayersByIds(accountIds)) !== accountIds.length)
        return { error: characterErrors.accountNotFound };
      const payload = await characters.setAccess(id, accountIds);
      return { message: "Acesso atualizado", payload };
    } catch (error) {
      return failed("setAccess", error);
    }
  };

  const replaceImage = async (id: string, kind: CharacterImageKind, key: string | null) => {
    const { images: changed, previousKey } = await characters.setImageKey(id, kind, key);
    if (previousKey && previousKey !== key) {
      await assets.release(previousKey).catch((error: unknown) => {
        console.error("old image cleanup failed:", error);
      });
    }
    return { images: changed };
  };

  const setImage: ICharacterController["setImage"] = async (viewer, id, upload) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const kind = characterImageKindSchema.safeParse(upload.kind);
    if (!kind.success) return { error: characterErrors.invalidImageKind };
    if (!upload.file || upload.file.length === 0) return { error: characterErrors.imageMissing };
    if (upload.file.length > MEDIA_MAX_BYTES) return { error: characterErrors.imageTooLarge };
    const size = images.sizeOf(upload.file);
    if (!size) return { error: characterErrors.imageInvalid };
    if (size.width > CHARACTER_IMAGE_MAX_SIDE || size.height > CHARACTER_IMAGE_MAX_SIDE)
      return { error: characterErrors.imageTooBig };
    try {
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      const stored = await assets.ingest(upload.file);
      if (!stored) return { error: characterErrors.imageInvalid };
      try {
        return { message: "Imagem salva", payload: await replaceImage(id, kind.data, stored.key) };
      } catch (error) {
        await assets.release(stored.key).catch(() => undefined);
        throw error;
      }
    } catch (error) {
      return failed("setImage", error);
    }
  };

  const removeImage: ICharacterController["removeImage"] = async (viewer, id, rawKind) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const kind = characterImageKindSchema.safeParse(rawKind);
    if (!kind.success) return { error: characterErrors.invalidImageKind };
    try {
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      return { message: "Imagem removida", payload: await replaceImage(id, kind.data, null) };
    } catch (error) {
      return failed("removeImage", error);
    }
  };

  const setFeatures: ICharacterController["setFeatures"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: characterErrors.gmOnly };
    if (!characterIdSchema.safeParse(id).success) return { error: characterErrors.notFound };
    const parsed = setFeaturesInputSchema.safeParse(input);
    if (!parsed.success) return { error: characterErrors.invalidFeatures };
    try {
      if (!(await characters.exists(id))) return { error: characterErrors.notFound };
      const change = await characters.setFeatures(id, parsed.data.features);
      return {
        message: "Tags atualizadas",
        payload: {
          id,
          features: change.features,
          accountIds: change.accountIds,
          added: change.features.filter((key) => !change.previous.includes(key)),
          removed: change.previous.filter((key) => !change.features.includes(key)),
        },
      };
    } catch (error) {
      return failed("setFeatures", error);
    }
  };

  return {
    setFeatures,
    setImage,
    removeImage,
    listCharacters,
    listAccessibleIds,
    getCharacter,
    updateSheet,
    createCharacter,
    renameCharacter,
    deleteCharacter,
    setAccess,
  };
}

export const characterController = createCharacterController({
  characters: characterModels,
  folders: folderModels,
  accounts: accountModels,
  images: characterImages,
  assets: imageAssets,
});
