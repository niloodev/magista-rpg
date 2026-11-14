import {
  createFolderInputSchema,
  folderIdSchema,
  isSameOrDescendant,
  moveLibraryItemInputSchema,
  renameFolderInputSchema,
} from "@magista/shared";

import { characterModels } from "@/core/models/character";
import { folderModels } from "@/core/models/folder";

import { libraryErrors } from "./library.errors";
import type { ILibraryController, ILibraryControllerDeps } from "./library.types";

/**
 * Builds the library controller: GM-only folders (nested) and manual ordering of folders and characters.
 */
export function createLibraryController({
  folders,
  characters,
}: ILibraryControllerDeps): ILibraryController {
  const failed = (action: string, error: unknown) => {
    console.error(`${action} failed:`, error);
    return { error: libraryErrors.unexpected };
  };

  const listFolders: ILibraryController["listFolders"] = async (viewer) => {
    if (viewer.role !== "GM") return { error: libraryErrors.gmOnly };
    try {
      return { message: "Pastas carregadas", payload: await folders.list() };
    } catch (error) {
      return failed("listFolders", error);
    }
  };

  const createFolder: ILibraryController["createFolder"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: libraryErrors.gmOnly };
    const parsed = createFolderInputSchema.safeParse(input);
    if (!parsed.success) return { error: libraryErrors.invalidName };
    try {
      const { name, parentId } = parsed.data;
      if (parentId && !(await folders.findById(parentId)))
        return { error: libraryErrors.folderNotFound };
      return { message: "Pasta criada", payload: await folders.create({ name, parentId }) };
    } catch (error) {
      return failed("createFolder", error);
    }
  };

  const renameFolder: ILibraryController["renameFolder"] = async (viewer, id, input) => {
    if (viewer.role !== "GM") return { error: libraryErrors.gmOnly };
    if (!folderIdSchema.safeParse(id).success) return { error: libraryErrors.folderNotFound };
    const parsed = renameFolderInputSchema.safeParse(input);
    if (!parsed.success) return { error: libraryErrors.invalidName };
    try {
      if (!(await folders.findById(id))) return { error: libraryErrors.folderNotFound };
      return { message: "Pasta renomeada", payload: await folders.rename(id, parsed.data.name) };
    } catch (error) {
      return failed("renameFolder", error);
    }
  };

  const deleteFolder: ILibraryController["deleteFolder"] = async (viewer, id) => {
    if (viewer.role !== "GM") return { error: libraryErrors.gmOnly };
    if (!folderIdSchema.safeParse(id).success) return { error: libraryErrors.folderNotFound };
    try {
      if (!(await folders.findById(id))) return { error: libraryErrors.folderNotFound };
      await folders.remove(id);
      return { message: "Pasta excluída", payload: { id } };
    } catch (error) {
      return failed("deleteFolder", error);
    }
  };

  const moveItem: ILibraryController["moveItem"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: libraryErrors.gmOnly };
    const parsed = moveLibraryItemInputSchema.safeParse(input);
    if (!parsed.success) return { error: libraryErrors.invalidMove };
    const { kind, id, parentId, index } = parsed.data;
    try {
      const all = await folders.list();
      if (parentId && !all.some((folder) => folder.id === parentId))
        return { error: libraryErrors.folderNotFound };
      if (kind === "folder") {
        if (!all.some((folder) => folder.id === id)) return { error: libraryErrors.folderNotFound };
        if (isSameOrDescendant(all, parentId, id)) return { error: libraryErrors.cycle };
        await folders.moveFolder(id, parentId, index);
      } else {
        if (!(await characters.exists(id))) return { error: libraryErrors.characterNotFound };
        await folders.moveCharacter(id, parentId, index);
      }
      return { message: "Item movido", payload: null };
    } catch (error) {
      return failed("moveItem", error);
    }
  };

  return { listFolders, createFolder, renameFolder, deleteFolder, moveItem };
}

export const libraryController = createLibraryController({
  folders: folderModels,
  characters: characterModels,
});
