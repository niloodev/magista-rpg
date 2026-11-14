import { libraryErrors, type LibraryError } from "@/core/controllers/library";

export const LIBRARY_ERROR_STATUS: Record<LibraryError, number> = {
  [libraryErrors.gmOnly]: 403,
  [libraryErrors.invalidName]: 400,
  [libraryErrors.invalidMove]: 400,
  [libraryErrors.folderNotFound]: 404,
  [libraryErrors.characterNotFound]: 404,
  [libraryErrors.cycle]: 400,
  [libraryErrors.unexpected]: 500,
};
