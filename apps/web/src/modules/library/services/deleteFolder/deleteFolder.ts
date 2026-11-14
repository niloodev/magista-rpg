import type { ControllerResult } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Deletes a folder; its subfolders and characters move up to the parent folder (GM only).
 */
export function deleteFolder(id: string): Promise<ControllerResult<{ id: string }>> {
  return apiRequest<{ id: string }>(`/folders/${encodeURIComponent(id)}`, { method: "DELETE" });
}
