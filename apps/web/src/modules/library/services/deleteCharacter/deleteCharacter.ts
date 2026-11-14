import type { ControllerResult } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Deletes a character sheet for good (GM only).
 */
export function deleteCharacter(id: string): Promise<ControllerResult<{ id: string }>> {
  return apiRequest<{ id: string }>(`/characters/${encodeURIComponent(id)}`, { method: "DELETE" });
}
