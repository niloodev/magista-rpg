import type { IFolder, IFolderNode } from "./library.types";

/**
 * Sorts library items by their manual position, then by name.
 */
export function byPosition<T extends { position: number; name: string }>(a: T, b: T): number {
  return a.position - b.position || a.name.localeCompare(b.name, "pt-BR");
}

/**
 * Lists the direct child folders of a parent (null is the root), in order.
 */
export function childFolders(folders: IFolder[], parentId: string | null): IFolder[] {
  return folders.filter((folder) => folder.parentId === parentId).sort(byPosition);
}

/**
 * Builds the nested folder tree, ordered, with each node's depth.
 */
export function buildFolderTree(
  folders: IFolder[],
  parentId: string | null = null,
  depth = 0,
): IFolderNode[] {
  return childFolders(folders, parentId).map((folder) => ({
    ...folder,
    depth,
    children: buildFolderTree(folders, folder.id, depth + 1),
  }));
}

/**
 * Flattens the tree in display order (depth first), useful for indented selects.
 */
export function flattenFolderTree(nodes: IFolderNode[]): IFolderNode[] {
  return nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)]);
}

/**
 * Returns the chain of folders from the root down to the given folder (empty for the root).
 */
export function folderPath(folders: IFolder[], folderId: string | null): IFolder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: IFolder[] = [];
  const seen = new Set<string>();
  let current = folderId ? byId.get(folderId) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

/**
 * True when `candidateId` is `ancestorId` itself or lives somewhere inside it.
 */
export function isSameOrDescendant(
  folders: IFolder[],
  candidateId: string | null,
  ancestorId: string,
): boolean {
  return folderPath(folders, candidateId).some((folder) => folder.id === ancestorId);
}

/**
 * Lowercases and strips accents so searches ignore both.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/**
 * True when every word of the query appears in the text (case and accent insensitive).
 */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = normalizeSearch(text);
  return normalizeSearch(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Moves an item to `index` inside a list of ids, clamping the index.
 */
export function insertAt(ids: string[], id: string, index: number): string[] {
  const rest = ids.filter((existing) => existing !== id);
  const target = Math.max(0, Math.min(index, rest.length));
  return [...rest.slice(0, target), id, ...rest.slice(target)];
}
