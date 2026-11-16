import type { ControllerResult, ICharacterImages, ISetTokenSettingsInput } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Token defaults of a character (GM only): round avatar or isometric figure, and whether its tokens show the
 * name on the map (applied to the tokens already on the board too).
 */
export function setCharacterTokenSettings(
  characterId: string,
  settings: ISetTokenSettingsInput,
): Promise<ControllerResult<{ images: ICharacterImages }>> {
  return apiRequest<{ images: ICharacterImages }>(`/characters/${characterId}/token`, {
    method: "PUT",
    body: settings,
  });
}
