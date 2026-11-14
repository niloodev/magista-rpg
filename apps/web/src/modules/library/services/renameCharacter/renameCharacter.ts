import type { ControllerResult, ICharacterSummary } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Renames a character (GM only).
 */
export function renameCharacter(
  id: string,
  name: string,
): Promise<ControllerResult<ICharacterSummary>> {
  return apiRequest<ICharacterSummary>(`/characters/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
  });
}
