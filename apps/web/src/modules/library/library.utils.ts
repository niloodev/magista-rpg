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
  return characters.filter((character) => character.folderId === folderId).sort(byPosition);
}

/**
 * Number of characters inside a folder, counting every subfolder.
 */
export function countCharactersDeep(data: ILibraryData, folderId: string): number {
  const direct = data.characters.filter((character) => character.folderId === folderId).length;
  return childFolders(data.folders, folderId).reduce(
    (total, child) => total + countCharactersDeep(data, child.id),
    direct,
  );
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
  if (move.kind === "folder") {
    const moving = data.folders.find((folder) => folder.id === move.id);
    if (!moving) return data;
    const moved = data.folders.map((folder) =>
      folder.id === move.id ? { ...folder, parentId: move.parentId } : folder,
    );
    const order = insertAt(
      childFolders(moved, move.parentId).map((folder) => folder.id),
      move.id,
      move.index,
    );
    const previous = childFolders(moved, moving.parentId).map((folder) => folder.id);
    return {
      ...data,
      folders: moved.map((folder) => {
        const inTarget = order.indexOf(folder.id);
        if (inTarget >= 0 && folder.parentId === move.parentId)
          return { ...folder, position: inTarget };
        const inPrevious = previous.indexOf(folder.id);
        return inPrevious >= 0 ? { ...folder, position: inPrevious } : folder;
      }),
    };
  }
  const moving = data.characters.find((character) => character.id === move.id);
  if (!moving) return data;
  const moved = data.characters.map((character) =>
    character.id === move.id ? { ...character, folderId: move.parentId } : character,
  );
  const order = insertAt(
    charactersIn(moved, move.parentId).map((character) => character.id),
    move.id,
    move.index,
  );
  const previous = charactersIn(moved, moving.folderId).map((character) => character.id);
  return {
    ...data,
    characters: moved.map((character) => {
      const inTarget = order.indexOf(character.id);
      if (inTarget >= 0 && character.folderId === move.parentId)
        return { ...character, position: inTarget };
      const inPrevious = previous.indexOf(character.id);
      return inPrevious >= 0 ? { ...character, position: inPrevious } : character;
    }),
  };
}

/**
 * Builds the drag id of a library item ("folder:<id>").
 */
export function toDragId(item: ILibraryItemRef): string {
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
 * inside that row (0 = top edge, 1 = bottom edge). Characters only go inside folders or before/after
 * other characters; folders go before/after folders or inside them (middle of the row). The root
 * drop zone always means inside.
 */
export function dropPositionFor(
  activeKind: string,
  overKind: string,
  ratio: number,
): DropPosition | null {
  if (overKind === ROOT_DROP_KIND) return "inside";
  if (overKind === "folder") {
    if (activeKind === "character") return "inside";
    if (ratio < FOLDER_EDGE_RATIO) return "before";
    if (ratio > 1 - FOLDER_EDGE_RATIO) return "after";
    return "inside";
  }
  if (overKind === "character" && activeKind === "character")
    return ratio < 0.5 ? "before" : "after";
  return null;
}

function siblingIds(data: ILibraryData, kind: string, parentId: string | null): string[] {
  return kind === "folder"
    ? childFolders(data.folders, parentId).map((folder) => folder.id)
    : charactersIn(data.characters, parentId).map((character) => character.id);
}

function parentOf(data: ILibraryData, item: ILibraryItemRef): string | null | undefined {
  if (item.kind === "folder") return data.folders.find((folder) => folder.id === item.id)?.parentId;
  return data.characters.find((character) => character.id === item.id)?.folderId;
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
  const currentParent = parentOf(data, active);
  if (currentParent === undefined) return null;
  let parentId: string | null;
  let index: number;
  if (position === "inside") {
    parentId = target.kind === ROOT_DROP_KIND ? null : target.id;
    if (
      active.kind === "folder" &&
      parentId &&
      isSameOrDescendant(data.folders, parentId, active.id)
    )
      return null;
    if (parentId === currentParent) return null;
    index = siblingIds(data, active.kind, parentId).length;
  } else {
    if (target.kind !== active.kind || target.id === active.id) return null;
    const targetParent = parentOf(data, { kind: active.kind, id: target.id });
    if (targetParent === undefined) return null;
    parentId = targetParent;
    if (
      active.kind === "folder" &&
      parentId &&
      isSameOrDescendant(data.folders, parentId, active.id)
    )
      return null;
    const rest = siblingIds(data, active.kind, parentId).filter((id) => id !== active.id);
    index = rest.indexOf(target.id) + (position === "after" ? 1 : 0);
    const current = siblingIds(data, active.kind, parentId);
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
  const build = (parentId: string | null): LibraryShapeHintNode[] => {
    const nodes: LibraryShapeHintNode[] = [];
    for (const folder of childFolders(data.folders, parentId)) {
      if (budget <= 0) return nodes;
      budget -= 1;
      const open = expandedFolderIds.includes(folder.id);
      nodes.push([
        -clampLength(folder.name.length),
        countCharactersDeep(data, folder.id),
        childFolders(data.folders, folder.id).length,
        open ? build(folder.id) : 0,
      ]);
    }
    for (const character of charactersIn(data.characters, parentId)) {
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
