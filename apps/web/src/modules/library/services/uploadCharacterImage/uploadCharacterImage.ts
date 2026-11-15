import {
  CHARACTER_IMAGE_FIELD,
  type CharacterImageKind,
  type ControllerResult,
  type ICharacterImages,
} from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Uploads the AVATAR (face token) or the ART (full artwork) of a character (GM only).
 */
export function uploadCharacterImage(
  characterId: string,
  kind: CharacterImageKind,
  file: File,
): Promise<ControllerResult<{ images: ICharacterImages }>> {
  const formData = new FormData();
  formData.append(CHARACTER_IMAGE_FIELD, file);
  return apiRequest<{ images: ICharacterImages }>(`/characters/${characterId}/images/${kind}`, {
    method: "PUT",
    formData,
  });
}
