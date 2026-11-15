import type { ControllerResult } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";
import type { IImageAssets } from "@/core/controllers/mediaAsset";
import type { ICharacterModels } from "@/core/models/character";

import type { ImporterError } from "./importer.errors";

export interface IImportCharacterInput {
  raw: unknown;
  /** Face token (Roll20 "token"), shown in small portraits. */
  avatar: Buffer | null;
  /** Full-body artwork (Roll20 "avatar"). */
  art: Buffer | null;
  force: boolean;
}

export interface IImportCharacterPayload {
  characterId: string | null;
  name: string;
  status: "created" | "updated" | "skipped";
  password: string | null;
  mediaWarning: string | null;
}

export interface IImporterControllerDeps {
  accounts: Pick<IAccountModels, "findCredentialsByLogin" | "upsertAccount">;
  characters: Pick<ICharacterModels, "upsertCharacter" | "findByAccountAndName" | "setImageKey">;
  hashPassword: (password: string) => Promise<string>;
  generatePassword: () => string;
  assets: Pick<IImageAssets, "ingest" | "release">;
}

export interface IImporterController {
  importCharacter: (
    input: IImportCharacterInput,
  ) => Promise<ControllerResult<IImportCharacterPayload, ImporterError>>;
}
