import {
  isErrorResult,
  type ControllerResult,
  type IAccount,
  type ICharacterSummary,
  type IFolder,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { ILibraryData } from "@/modules/library/library.types";

/**
 * Loads the character library: every character, folder and account for the GM; only the granted
 * characters for players (no folders, no accounts).
 */
export async function fetchLibrary(
  isGm: boolean,
): Promise<ControllerResult<ILibraryData & { accounts: IAccount[] }>> {
  const [characters, folders, accounts] = await Promise.all([
    apiRequest<ICharacterSummary[]>("/characters"),
    isGm ? apiRequest<IFolder[]>("/folders") : Promise.resolve(null),
    isGm ? apiRequest<IAccount[]>("/accounts") : Promise.resolve(null),
  ]);
  if (isErrorResult(characters)) return characters;
  if (folders && isErrorResult(folders)) return folders;
  if (accounts && isErrorResult(accounts)) return accounts;
  return {
    message: characters.message,
    payload: {
      characters: characters.payload,
      folders: folders?.payload ?? [],
      accounts: accounts?.payload ?? [],
    },
  };
}
