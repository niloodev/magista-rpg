import { CHARACTER_IMAGE_FIELD } from "@magista/shared";

import { characterErrors, type CharacterError } from "@/core/controllers/character";
import { rollErrors, type RollError } from "@/core/controllers/roll";

export const IMAGE_FIELD = CHARACTER_IMAGE_FIELD;

export const CHARACTER_ERROR_STATUS: Record<CharacterError, number> = {
  [characterErrors.notFound]: 404,
  [characterErrors.forbidden]: 403,
  [characterErrors.gmOnly]: 403,
  [characterErrors.invalidSheet]: 400,
  [characterErrors.invalidName]: 400,
  [characterErrors.invalidAccess]: 400,
  [characterErrors.invalidFeatures]: 400,
  [characterErrors.folderNotFound]: 404,
  [characterErrors.accountNotFound]: 400,
  [characterErrors.gmOnlyFields]: 403,
  [characterErrors.aboveMaximum]: 400,
  [characterErrors.conflict]: 409,
  [characterErrors.invalidImageKind]: 404,
  [characterErrors.imageMissing]: 400,
  [characterErrors.imageInvalid]: 415,
  [characterErrors.imageTooLarge]: 413,
  [characterErrors.imageTooBig]: 400,
  [characterErrors.unexpected]: 500,
};

export const ROLL_ERROR_STATUS: Record<RollError, number> = {
  [rollErrors.invalidRequest]: 400,
  [rollErrors.notFound]: 404,
  [rollErrors.forbidden]: 403,
  [rollErrors.invalidExpression]: 400,
  [rollErrors.gmOnly]: 403,
  [rollErrors.maxLevel]: 409,
  [rollErrors.conflict]: 409,
  [rollErrors.unexpected]: 500,
  [rollErrors.invalidPing]: 400,
  [rollErrors.entryNotFound]: 404,
  [rollErrors.pingForbidden]: 403,
  [rollErrors.unexpectedPing]: 500,
};
