import type { IFolder } from "@magista/shared";

import type { CharacterFolder } from "@/generated/prisma/client";

/**
 * Maps a database folder row to the folder DTO.
 */
export function toFolder(row: CharacterFolder): IFolder {
  return { id: row.id, name: row.name, parentId: row.parentId, position: row.position };
}
