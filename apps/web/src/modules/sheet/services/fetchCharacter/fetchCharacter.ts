import type { ControllerResult, ICharacter } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Loads one character with its full sheet.
 */
export function fetchCharacter(id: string): Promise<ControllerResult<ICharacter>> {
  return apiRequest<ICharacter>(`/characters/${encodeURIComponent(id)}`);
}
