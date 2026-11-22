import { arenaErrors, type ArenaError } from "@/core/controllers/arena";
import { arenaWorldErrors, type ArenaWorldError } from "@/core/controllers/arenaWorld";

export const ARENA_ERROR_STATUS: Record<ArenaError, number> = {
  [arenaErrors.gmOnly]: 403,
  [arenaErrors.ownSheetsOnly]: 403,
  [arenaErrors.sceneNotFound]: 404,
  [arenaErrors.tokenNotFound]: 404,
  [arenaErrors.characterNotFound]: 404,
  [arenaErrors.forbidden]: 403,
  [arenaErrors.invalidName]: 400,
  [arenaErrors.invalidToken]: 400,
  [arenaErrors.invalidMove]: 400,
  [arenaErrors.invalidScene]: 400,
  [arenaErrors.invalidBoard]: 400,
  [arenaErrors.npcOnly]: 409,
  [arenaErrors.folderNotFound]: 404,
  [arenaErrors.invalidFolderMove]: 409,
  [arenaErrors.mapTooBig]: 413,
  [arenaErrors.tokenImageTooBig]: 413,
  [arenaErrors.characterName]: 409,
  [arenaErrors.characterStatus]: 409,
  [arenaErrors.invalidViewers]: 400,
  [arenaErrors.invalidChange]: 400,
  [arenaErrors.noHealth]: 409,
  [arenaErrors.noSanity]: 409,
  [arenaErrors.invalidAttacker]: 403,
  [arenaErrors.imageMissing]: 400,
  [arenaErrors.imageInvalid]: 415,
  [arenaErrors.mapTooLarge]: 413,
  [arenaErrors.imageTooLarge]: 413,
  [arenaErrors.unexpected]: 500,
};

export const ARENA_WORLD_ERROR_STATUS: Record<ArenaWorldError, number> = {
  [arenaWorldErrors.gmOnly]: 403,
  [arenaWorldErrors.invalidMove]: 400,
  [arenaWorldErrors.invalidPaint]: 400,
  [arenaWorldErrors.invalidLive]: 400,
  [arenaWorldErrors.notLive]: 409,
  [arenaWorldErrors.unexpected]: 500,
};
