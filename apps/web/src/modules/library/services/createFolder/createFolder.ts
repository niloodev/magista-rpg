import type { ControllerResult, ICreateFolderInput, IFolder } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Creates a folder, at the root or inside another folder (GM only).
 */
export function createFolder(input: ICreateFolderInput): Promise<ControllerResult<IFolder>> {
  return apiRequest<IFolder>("/folders", { method: "POST", body: input });
}
