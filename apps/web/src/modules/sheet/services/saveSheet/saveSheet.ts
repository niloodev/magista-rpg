import type { ControllerResult, ICharacter, ICharacterSheet } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Persists a full sheet, sending the version it was based on so concurrent saves are detected (409).
 * The API validates it and notifies the owner's other tabs and the GM.
 */
export function saveSheet(
  id: string,
  sheet: ICharacterSheet,
  baseUpdatedAt: string,
): Promise<ControllerResult<ICharacter>> {
  return apiRequest<ICharacter>(`/characters/${encodeURIComponent(id)}/sheet`, {
    method: "PUT",
    body: { sheet, baseUpdatedAt },
  });
}
