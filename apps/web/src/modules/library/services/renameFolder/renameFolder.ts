import type { ControllerResult, IFolder } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Renames a folder (GM only).
 */
export function renameFolder(id: string, name: string): Promise<ControllerResult<IFolder>> {
  return apiRequest<IFolder>(`/folders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { name },
  });
}
