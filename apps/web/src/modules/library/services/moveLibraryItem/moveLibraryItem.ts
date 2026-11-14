import type { ControllerResult, IMoveLibraryItemInput } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Moves a folder or character to a position inside a folder (GM only).
 */
export function moveLibraryItem(input: IMoveLibraryItemInput): Promise<ControllerResult<null>> {
  return apiRequest<null>("/library/move", { method: "POST", body: input });
}
