import type { IFolder } from "@magista/shared";

/**
 * Open folders that still exist after a reload, keeping the same array when none disappeared (so a reload does
 * not look like a change to whoever saves or reads it).
 */
export function keptFolderIds(expanded: string[], folders: IFolder[]): string[] {
  const ids = new Set(folders.map((folder) => folder.id));
  return expanded.every((id) => ids.has(id)) ? expanded : expanded.filter((id) => ids.has(id));
}
