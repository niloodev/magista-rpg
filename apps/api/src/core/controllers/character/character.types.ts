import type { ControllerResult, ICharacter, ICharacterSummary } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";
import type { ICharacterModels } from "@/core/models/character";
import type { IFolderModels } from "@/core/models/folder";

import type { IViewer } from "../controllers.types";
import type { CharacterError } from "./character.errors";

export interface ICharacterControllerDeps {
  characters: ICharacterModels;
  folders: Pick<IFolderModels, "findById">;
  accounts: Pick<IAccountModels, "countPlayersByIds">;
}

export interface IAccessChange {
  character: ICharacterSummary;
  previousAccountIds: string[];
}

export interface IDeletedCharacter {
  id: string;
  previousAccountIds: string[];
}

type Result<T> = Promise<ControllerResult<T, CharacterError>>;

export interface ICharacterController {
  listCharacters: (viewer: IViewer) => Result<ICharacterSummary[]>;
  getCharacter: (viewer: IViewer, id: string) => Result<ICharacter>;
  updateSheet: (viewer: IViewer, id: string, input: unknown) => Result<ICharacter>;
  createCharacter: (viewer: IViewer, input: unknown) => Result<ICharacterSummary>;
  renameCharacter: (viewer: IViewer, id: string, input: unknown) => Result<ICharacterSummary>;
  deleteCharacter: (viewer: IViewer, id: string) => Result<IDeletedCharacter>;
  setAccess: (viewer: IViewer, id: string, input: unknown) => Result<IAccessChange>;
  listAccessibleIds: (viewer: IViewer) => Result<string[]>;
}
