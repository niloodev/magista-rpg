import type { IArenaFolder } from "@magista/shared";

interface ArenaSceneFolderRow {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
}

/**
 * Maps a stored scene folder to the DTO.
 */
export function toArenaFolder(row: ArenaSceneFolderRow): IArenaFolder {
  return { id: row.id, name: row.name, parentId: row.parentId, position: row.position };
}

/**
 * Minimal folder shape for the cycle check (only the tree links matter).
 */
export function toFolderLink(row: { id: string; parentId: string | null }) {
  return { id: row.id, parentId: row.parentId, name: "", position: 0 };
}
