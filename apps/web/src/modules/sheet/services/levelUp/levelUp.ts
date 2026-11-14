import type { ControllerResult } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

import type { ILevelUpResponse } from "./levelUp.types";

/**
 * GM only: rolls the life and sanity dice on the server, raises the level and the maximums.
 */
export function levelUp(
  id: string,
  addToCurrent: boolean,
): Promise<ControllerResult<ILevelUpResponse>> {
  return apiRequest<ILevelUpResponse>(`/characters/${encodeURIComponent(id)}/level-up`, {
    method: "POST",
    body: { addToCurrent },
  });
}
