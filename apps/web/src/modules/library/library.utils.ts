import {
  byPosition,
  childFolders,
  CLASS_KEYS,
  CLASSES,
  folderPath,
  insertAt,
  isSameOrDescendant,
  matchesSearch,
  type ICharacterSummary,
  type IFolder,
  type IMoveLibraryItemInput,
} from "@magista/shared";

import {
  DRAG_ID_SEPARATOR,
  FOLDER_EDGE_RATIO,
  LIBRARY_SHAPE_MAX_ACCESS,
  LIBRARY_SHAPE_MAX_COUNT,
  LIBRARY_SHAPE_MAX_LEVEL,
  LIBRARY_SHAPE_MAX_ROWS,
  LIBRARY_SHAPE_MAX_TEXT,
  ROOT_DROP_KIND,
  ROOT_FOLDER_LABEL,
} from "./library.constants";
import type {
  DropPosition,
  ILibraryData,
  ITreeData,
  ITreeIndex,
  ITreeItemRef,
  ITreeLeaf,
  ITreeMove,
  ILibraryItemRef,
  ILibraryShape,
  ILibraryShapeHint,
  ISearchResult,
  LibraryShapeHintNode,
  LibraryShapeNode,
} from "./library.types";

/**
 * Characters that live directly inside a folder (null is the root), in manual order.
 */
export function charactersIn(
  characters: ICharacterSummary[],
  folderId: string | null,
): ICharacterSummary[] {
  return leavesIn(characters, folderId);
}

/**
 * Leaves (characters, scenes) that live directly inside a folder (null is the root), in manual order.
 */
export function leavesIn<L extends ITreeLeaf>(leaves: L[], folderId: string | null): L[] {
  return leaves.filter((leaf) => leaf.folderId === folderId).sort(byPosition);
}

/**
 * The tree grouped in one pass: subfolders by parent and leaves by folder (both in manual order, null is the
 * root) and the number of leaves under each folder counting every subfolder. Building the tree from it costs
 * O(folders + leaves) instead of filtering the whole lists once per folder.
 */
export function buildTreeIndex<L extends ITreeLeaf>(tree: ITreeData<L>): ITreeIndex<L> {
  const foldersByParent = new Map<string | null, IFolder[]>();
  const leavesByFolder = new Map<string | null, L[]>();
  for (const folder of tree.folders) {
    const list = foldersByParent.get(folder.parentId) ?? [];
    list.push(folder);
    foldersByParent.set(folder.parentId, list);
  }
  for (const leaf of tree.leaves) {
    const list = leavesByFolder.get(leaf.folderId) ?? [];
    list.push(leaf);
    leavesByFolder.set(leaf.folderId, list);
  }
  for (const list of foldersByParent.values()) list.sort(byPosition);
  for (const list of leavesByFolder.values()) list.sort(byPosition);
  const deepCount = new Map<string, number>();
  const visiting = new Set<string>();
  const count = (folderId: string): number => {
    const known = deepCount.get(folderId);
    if (known !== undefined) return known;
    if (visiting.has(folderId)) return 0;
    visiting.add(folderId);
    const total = (foldersByParent.get(folderId) ?? []).reduce(
      (sum, child) => sum + count(child.id),
      leavesByFolder.get(folderId)?.length ?? 0,
    );
    deepCount.set(folderId, total);
    return total;
  };
  for (const folder of tree.folders) count(folder.id);
  return {
    folders: (parentId) => foldersByParent.get(parentId) ?? [],
    leaves: (folderId) => leavesByFolder.get(folderId) ?? [],
    deepCount: (folderId) => deepCount.get(folderId) ?? 0,
  };
}

/**
 * Number of leaves inside a folder, counting every subfolder.
 */
export function countLeavesDeep(tree: ITreeData, folderId: string): number {
  return buildTreeIndex(tree).deepCount(folderId);
}

/**
 * Number of characters inside a folder, counting every subfolder.
 */
export function countCharactersDeep(data: ILibraryData, folderId: string): number {
  return countLeavesDeep(toTreeData(data), folderId);
}

/**
 * The character library seen as a generic folder tree.
 */
export function toTreeData(data: ILibraryData): ITreeData<ICharacterSummary> {
  return { folders: data.folders, leaves: data.characters };
}

/**
 * Human readable folder path ("Campanha / NPCs"), or the root label.
 */
export function folderPathLabel(folders: IFolder[], folderId: string | null): string {
  const path = folderPath(folders, folderId);
  return path.length === 0 ? ROOT_FOLDER_LABEL : path.map((folder) => folder.name).join(" / ");
}

/**
 * Every character whose name matches the query, alphabetically, with its folder path.
 */
export function searchCharacters(data: ILibraryData, query: string): ISearchResult[] {
  return data.characters
    .filter((character) => matchesSearch(character.name, query))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((character) => ({ character, path: folderPathLabel(data.folders, character.folderId) }));
}

/**
 * Class name and level shown under a character's name.
 */
export function characterSubtitle(character: ICharacterSummary): string {
  return `${CLASSES[character.classKey].name} · Nível ${character.level}`;
}

/**
 * Applies a move locally with the same rules as the API, so drag and drop feels instant.
 */
export function applyMove(data: ILibraryData, move: IMoveLibraryItemInput): ILibraryData {
  const tree = applyTreeMove(toTreeData(data), move);
  return { ...data, folders: tree.folders, characters: tree.leaves };
}

/**
 * Applies a folder or leaf move to any folder tree, renumbering the old and the new siblings.
 */
export function applyTreeMove<L extends ITreeLeaf>(
  tree: ITreeData<L>,
  move: ITreeMove,
): ITreeData<L> {
  if (move.kind === "folder") {
    const moving = tree.folders.find((folder) => folder.id === move.id);
    if (!moving) return tree;
    const moved = tree.folders.map((folder) =>
      folder.id === move.id ? { ...folder, parentId: move.parentId } : folder,
    );
    const order = insertAt(
      childFolders(moved, move.parentId).map((folder) => folder.id),
      move.id,
      move.index,
    );
    const previous = childFolders(moved, moving.parentId).map((folder) => folder.id);
    return {
      ...tree,
      folders: moved.map((folder) => {
        const inTarget = order.indexOf(folder.id);
        if (inTarget >= 0 && folder.parentId === move.parentId)
          return { ...folder, position: inTarget };
        const inPrevious = previous.indexOf(folder.id);
        return inPrevious >= 0 ? { ...folder, position: inPrevious } : folder;
      }),
    };
  }
  const moving = tree.leaves.find((leaf) => leaf.id === move.id);
  if (!moving) return tree;
  const moved = tree.leaves.map((leaf) =>
    leaf.id === move.id ? { ...leaf, folderId: move.parentId } : leaf,
  );
  const order = insertAt(
    leavesIn(moved, move.parentId).map((leaf) => leaf.id),
    move.id,
    move.index,
  );
  const previous = leavesIn(moved, moving.folderId).map((leaf) => leaf.id);
  return {
    ...tree,
    leaves: moved.map((leaf) => {
      const inTarget = order.indexOf(leaf.id);
      if (inTarget >= 0 && leaf.folderId === move.parentId) return { ...leaf, position: inTarget };
      const inPrevious = previous.indexOf(leaf.id);
      return inPrevious >= 0 ? { ...leaf, position: inPrevious } : leaf;
    }),
  };
}

/**
 * Builds the drag id of a library item ("folder:<id>").
 */
export function toDragId(item: ITreeItemRef): string {
  return `${item.kind}${DRAG_ID_SEPARATOR}${item.id}`;
}

/**
 * Parses a drag id back into its kind and id ("crumb" for breadcrumb drop targets).
 */
export function fromDragId(dragId: string | number): { kind: string; id: string } {
  const text = String(dragId);
  const separator = text.indexOf(DRAG_ID_SEPARATOR);
  return { kind: text.slice(0, separator), id: text.slice(separator + 1) };
}

/**
 * Where a dragged item lands relative to the row under it, from the vertical position of the pointer
 * inside that row (0 = top edge, 1 = bottom edge). Leaves (characters, scenes) only go inside folders or
 * before/after leaves of the same kind; folders go before/after folders or inside them (middle of the row).
 * The root drop zone always means inside.
 */
export function dropPositionFor(
  activeKind: string,
  overKind: string,
  ratio: number,
): DropPosition | null {
  if (overKind === ROOT_DROP_KIND) return "inside";
  if (overKind === "folder") {
    if (activeKind !== "folder") return "inside";
    if (ratio < FOLDER_EDGE_RATIO) return "before";
    if (ratio > 1 - FOLDER_EDGE_RATIO) return "after";
    return "inside";
  }
  if (activeKind !== "folder" && overKind === activeKind) return ratio < 0.5 ? "before" : "after";
  return null;
}

function siblingIds(tree: ITreeData, kind: string, parentId: string | null): string[] {
  return kind === "folder"
    ? childFolders(tree.folders, parentId).map((folder) => folder.id)
    : leavesIn(tree.leaves, parentId).map((leaf) => leaf.id);
}

function parentOf(tree: ITreeData, item: ITreeItemRef): string | null | undefined {
  if (item.kind === "folder") return tree.folders.find((folder) => folder.id === item.id)?.parentId;
  return tree.leaves.find((leaf) => leaf.id === item.id)?.folderId;
}

/**
 * Turns a drop (dragged item, row under it, position) into the move sent to the API, or null when the
 * drop is invalid (a folder into itself or a descendant) or changes nothing.
 */
export function moveForDrop(
  data: ILibraryData,
  active: ILibraryItemRef,
  target: { kind: string; id: string },
  position: DropPosition,
): IMoveLibraryItemInput | null {
  const move = moveForTreeDrop(toTreeData(data), active, target, position);
  return move ? { ...move, kind: active.kind } : null;
}

/**
 * `moveForDrop` for any folder tree.
 */
export function moveForTreeDrop(
  tree: ITreeData,
  active: ITreeItemRef,
  target: ITreeItemRef,
  position: DropPosition,
): ITreeMove | null {
  const currentParent = parentOf(tree, active);
  if (currentParent === undefined) return null;
  let parentId: string | null;
  let index: number;
  if (position === "inside") {
    parentId = target.kind === ROOT_DROP_KIND ? null : target.id;
    if (
      active.kind === "folder" &&
      parentId &&
      isSameOrDescendant(tree.folders, parentId, active.id)
    )
      return null;
    if (parentId === currentParent) return null;
    index = siblingIds(tree, active.kind, parentId).length;
  } else {
    if (target.kind !== active.kind || target.id === active.id) return null;
    const targetParent = parentOf(tree, { kind: active.kind, id: target.id });
    if (targetParent === undefined) return null;
    parentId = targetParent;
    if (
      active.kind === "folder" &&
      parentId &&
      isSameOrDescendant(tree.folders, parentId, active.id)
    )
      return null;
    const rest = siblingIds(tree, active.kind, parentId).filter((id) => id !== active.id);
    index = rest.indexOf(target.id) + (position === "after" ? 1 : 0);
    const current = siblingIds(tree, active.kind, parentId);
    if (parentId === currentParent && current.indexOf(active.id) === index) return null;
  }
  return { kind: active.kind, id: active.id, parentId, index };
}

/**
 * "1 ficha", "3 fichas": the count with the right singular or plural word.
 */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const clampLength = (value: number) =>
  Math.min(Math.max(Math.trunc(value), 1), LIBRARY_SHAPE_MAX_TEXT);

/**
 * Summary under a folder name ("3 fichas · 1 pasta"), shared by the tree and its skeleton.
 */
export function folderSummary(characters: number, subfolders: number): string {
  const parts = [countLabel(characters, "ficha", "fichas")];
  if (subfolders > 0) parts.push(countLabel(subfolders, "pasta", "pastas"));
  return parts.join(" · ");
}

/**
 * Hint of the loaded library for the skeleton cookie, without any personal text: the GM tree (`t`) or the
 * player list (`p`), with only the *length* of names and access logins, plus class index, level and folder
 * counts (game data), capped at `LIBRARY_SHAPE_MAX_ROWS` rows. A folder is marked by a negative name length.
 */
export function libraryShape(
  data: ILibraryData,
  expandedFolderIds: string[],
  logins: Map<string, string>,
  isGm: boolean,
): ILibraryShapeHint {
  const classIndex = (character: ICharacterSummary) =>
    Math.max(CLASS_KEYS.indexOf(character.classKey), 0);
  if (!isGm)
    return {
      p: [...data.characters]
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .slice(0, LIBRARY_SHAPE_MAX_ROWS)
        .map((character) => [
          clampLength(character.name.length),
          classIndex(character),
          character.level,
        ]),
    };
  let budget = LIBRARY_SHAPE_MAX_ROWS;
  const index = buildTreeIndex(toTreeData(data));
  const expanded = new Set(expandedFolderIds);
  const build = (parentId: string | null): LibraryShapeHintNode[] => {
    const nodes: LibraryShapeHintNode[] = [];
    for (const folder of index.folders(parentId)) {
      if (budget <= 0) return nodes;
      budget -= 1;
      nodes.push([
        -clampLength(folder.name.length),
        index.deepCount(folder.id),
        index.folders(folder.id).length,
        expanded.has(folder.id) ? build(folder.id) : 0,
      ]);
    }
    for (const character of index.leaves(parentId)) {
      if (budget <= 0) return nodes;
      budget -= 1;
      nodes.push([
        clampLength(character.name.length),
        classIndex(character),
        character.level,
        character.accountIds
          .map((id) => logins.get(id))
          .filter((login): login is string => Boolean(login))
          .slice(0, LIBRARY_SHAPE_MAX_ACCESS)
          .map((login) => clampLength(login.length)),
      ]);
    }
    return nodes;
  };
  return { t: build(null) };
}

const readInt = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.trunc(value), min), max)
    : min;

const subtitleOf = (classIndex: unknown, level: unknown) => {
  const key = CLASS_KEYS[readInt(classIndex, 0, CLASS_KEYS.length - 1)] ?? CLASS_KEYS[0];
  return `${CLASSES[key].name} · Nível ${readInt(level, 1, LIBRARY_SHAPE_MAX_LEVEL)}`;
};

function parseShapeNodes(value: unknown, budget: { rows: number }): LibraryShapeNode[] {
  if (!Array.isArray(value)) return [];
  const nodes: LibraryShapeNode[] = [];
  for (const item of value) {
    if (budget.rows <= 0) break;
    if (!Array.isArray(item) || typeof item[0] !== "number") continue;
    const [name, second, third, rest] = item as unknown[];
    budget.rows -= 1;
    if ((name as number) < 0) {
      nodes.push({
        kind: "folder",
        name: clampLength(-(name as number)),
        summary: folderSummary(
          readInt(second, 0, LIBRARY_SHAPE_MAX_COUNT),
          readInt(third, 0, LIBRARY_SHAPE_MAX_COUNT),
        ),
        children: Array.isArray(rest) ? parseShapeNodes(rest, budget) : null,
      });
    } else {
      const access = Array.isArray(rest) ? rest.slice(0, LIBRARY_SHAPE_MAX_ACCESS) : [];
      nodes.push({
        kind: "character",
        name: clampLength(name as number),
        subtitle: subtitleOf(second, third),
        access: access.map((length) => readInt(length, 1, LIBRARY_SHAPE_MAX_TEXT)),
      });
    }
  }
  return nodes;
}

/**
 * Reads the library hint from the cookie into the rows the skeleton draws, ignoring anything malformed.
 */
export function parseLibraryShape(value: unknown): ILibraryShape | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const hint = value as Record<string, unknown>;
  const list = Array.isArray(hint.p) ? hint.p.slice(0, LIBRARY_SHAPE_MAX_ROWS) : [];
  return {
    tree: parseShapeNodes(hint.t, { rows: LIBRARY_SHAPE_MAX_ROWS }),
    list: list
      .filter((row): row is unknown[] => Array.isArray(row))
      .map(([name, classIndex, level]) => ({
        name: readInt(name, 1, LIBRARY_SHAPE_MAX_TEXT),
        subtitle: subtitleOf(classIndex, level),
      })),
  };
}

/**
 * A reloaded list that keeps the previous object of every item that did not change (and the previous array when
 * nothing changed), so a refetch after the GM's own move does not redraw every memoized row.
 */
export function reuseUnchanged<T extends { id: string }>(previous: T[], next: T[]): T[] {
  const before = new Map(previous.map((item) => [item.id, item]));
  let changed = previous.length !== next.length;
  const merged = next.map((item, index) => {
    const old = before.get(item.id);
    if (old && JSON.stringify(old) === JSON.stringify(item)) {
      if (previous[index] !== old) changed = true;
      return old;
    }
    changed = true;
    return item;
  });
  return changed ? merged : previous;
}
