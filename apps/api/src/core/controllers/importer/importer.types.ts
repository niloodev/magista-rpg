import type { ControllerResult } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";
import type { ICharacterModels } from "@/core/models/character";
import type { MediaKind } from "@/core/services/media";

import type { ImporterError } from "./importer.errors";

export interface IImportCharacterInput {
  raw: unknown;
  avatarPath: string | null;
  tokenPath: string | null;
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
  characters: Pick<ICharacterModels, "upsertCharacter" | "updateMedia" | "findByAccountAndName">;
  hashPassword: (password: string) => Promise<string>;
  generatePassword: () => string;
  storeMedia: (kind: MediaKind, ownerId: string, sourcePath: string) => Promise<string>;
}

export interface IImporterController {
  importCharacter: (
    input: IImportCharacterInput,
  ) => Promise<ControllerResult<IImportCharacterPayload, ImporterError>>;
}
