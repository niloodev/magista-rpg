import { CHARACTER_IMAGE_MAX_BYTES, CHARACTER_IMAGE_TYPES } from "@magista/shared";

import { IMAGE_TOO_LARGE, IMAGE_WRONG_TYPE } from "./ImageField.constants";

/**
 * Client-side check of a chosen image (only a convenience: the server validates the real bytes).
 */
export function imageFileError(
  file: File,
  maxBytes = CHARACTER_IMAGE_MAX_BYTES,
  tooLargeMessage = IMAGE_TOO_LARGE,
): string | null {
  if (!(CHARACTER_IMAGE_TYPES as readonly string[]).includes(file.type)) return IMAGE_WRONG_TYPE;
  if (file.size > maxBytes) return tooLargeMessage;
  return null;
}
