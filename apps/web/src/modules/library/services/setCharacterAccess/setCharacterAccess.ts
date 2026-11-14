import type { ControllerResult } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Replaces the list of player accounts that can open a character (GM only).
 */
export function setCharacterAccess(
  id: string,
  accountIds: string[],
): Promise<ControllerResult<unknown>> {
  return apiRequest<unknown>(`/characters/${encodeURIComponent(id)}/access`, {
    method: "PUT",
    body: { accountIds },
  });
}
