import type {
  ControllerResult,
  FeatureKey,
  ICharacter,
  ICharacterImages,
  ICharacterSummary,
} from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";
import type { ICharacterModels } from "@/core/models/character";
import type { IFolderModels } from "@/core/models/folder";
import type { IImageAssets } from "@/core/controllers/mediaAsset";
import type { ICharacterImageStore } from "@/core/services/media";

import type { IViewer } from "../controllers.types";
import type { CharacterError } from "./character.errors";

export interface ICharacterControllerDeps {
  characters: ICharacterModels;
  folders: Pick<IFolderModels, "findById">;
  accounts: Pick<IAccountModels, "countPlayersByIds">;
  images: ICharacterImageStore;
  assets: Pick<IImageAssets, "ingest" | "release">;
}

export interface IImageUpload {
  kind: string;
  file: Buffer | undefined;
}

export interface IImageChange {
  images: ICharacterImages;
}

export interface IAccessChange {
  character: ICharacterSummary;
  previousAccountIds: string[];
}

export interface IDeletedCharacter {
  id: string;
  previousAccountIds: string[];
}

export interface IFeaturesChange {
  id: string;
  features: FeatureKey[];
  accountIds: string[];
  added: FeatureKey[];
  removed: FeatureKey[];
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
  setImage: (viewer: IViewer, id: string, upload: IImageUpload) => Result<IImageChange>;
  removeImage: (viewer: IViewer, id: string, kind: string) => Result<IImageChange>;
  setFeatures: (viewer: IViewer, id: string, input: unknown) => Result<IFeaturesChange>;
}
