import type { ControllerResult, FeatureKey } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Replaces the special feature tags of a character (GM only).
 */
export function setCharacterFeatures(
  id: string,
  features: FeatureKey[],
): Promise<ControllerResult<unknown>> {
  return apiRequest<unknown>(`/characters/${encodeURIComponent(id)}/features`, {
    method: "PUT",
    body: { features },
  });
}
