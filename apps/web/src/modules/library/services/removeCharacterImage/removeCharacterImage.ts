import type { CharacterImageKind, ControllerResult, ICharacterImages } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Removes the AVATAR or the ART of a character (GM only).
 */
export function removeCharacterImage(
  characterId: string,
  kind: CharacterImageKind,
): Promise<ControllerResult<{ images: ICharacterImages }>> {
  return apiRequest<{ images: ICharacterImages }>(`/characters/${characterId}/images/${kind}`, {
    method: "DELETE",
  });
}
