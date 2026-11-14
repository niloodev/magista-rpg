import type { ControllerResult, IFolder } from "@magista/shared";

import type { ICharacterModels } from "@/core/models/character";
import type { IFolderModels } from "@/core/models/folder";

import type { IViewer } from "../controllers.types";
import type { LibraryError } from "./library.errors";

export interface ILibraryControllerDeps {
  folders: IFolderModels;
  characters: Pick<ICharacterModels, "exists">;
}

type Result<T> = Promise<ControllerResult<T, LibraryError>>;

export interface ILibraryController {
  listFolders: (viewer: IViewer) => Result<IFolder[]>;
  createFolder: (viewer: IViewer, input: unknown) => Result<IFolder>;
  renameFolder: (viewer: IViewer, id: string, input: unknown) => Result<IFolder>;
  deleteFolder: (viewer: IViewer, id: string) => Result<{ id: string }>;
  moveItem: (viewer: IViewer, input: unknown) => Result<null>;
}
