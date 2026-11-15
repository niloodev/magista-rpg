import { arenaErrors, type ArenaError } from "@/core/controllers/arena";

export const ARENA_ERROR_STATUS: Record<ArenaError, number> = {
  [arenaErrors.gmOnly]: 403,
  [arenaErrors.sceneNotFound]: 404,
  [arenaErrors.tokenNotFound]: 404,
  [arenaErrors.characterNotFound]: 404,
  [arenaErrors.forbidden]: 403,
  [arenaErrors.invalidName]: 400,
  [arenaErrors.invalidToken]: 400,
  [arenaErrors.invalidMove]: 400,
  [arenaErrors.invalidScene]: 400,
  [arenaErrors.npcOnly]: 409,
  [arenaErrors.characterName]: 409,
  [arenaErrors.imageMissing]: 400,
  [arenaErrors.imageInvalid]: 415,
  [arenaErrors.mapTooLarge]: 413,
  [arenaErrors.imageTooLarge]: 413,
  [arenaErrors.unexpected]: 500,
};
