import type { ICharacterSummary, IFolder, LibraryItemKind } from "@magista/shared";

export interface ILibraryData {
  characters: ICharacterSummary[];
  folders: IFolder[];
}

export type DropPosition = "before" | "after" | "inside";

/** Anything the folder tree can hold besides folders (a character, a scene). */
export interface ITreeLeaf {
  id: string;
  name: string;
  folderId: string | null;
  position: number;
}

export interface ITreeData<L extends ITreeLeaf = ITreeLeaf> {
  folders: IFolder[];
  leaves: L[];
}

/** A tree grouped for fast lookups (see `buildTreeIndex`). */
export interface ITreeIndex<L extends ITreeLeaf = ITreeLeaf> {
  /** Subfolders of a folder (null is the root), in manual order. */
  folders: (parentId: string | null) => IFolder[];
  /** Leaves directly inside a folder (null is the root), in manual order. */
  leaves: (folderId: string | null) => L[];
  /** Leaves under a folder, counting every subfolder. */
  deepCount: (folderId: string) => number;
}

/** A tree item: "folder" or the tree's leaf kind ("character", "scene"). */
export interface ITreeItemRef {
  kind: string;
  id: string;
}

export interface ITreeMove extends ITreeItemRef {
  parentId: string | null;
  index: number;
}

export interface ILibraryItemRef {
  kind: LibraryItemKind;
  id: string;
}

export interface ISearchResult {
  character: ICharacterSummary;
  path: string;
}

export type LibraryDialog =
  | { type: "createFolder"; parentId: string | null }
  | { type: "renameFolder"; folder: IFolder }
  | { type: "deleteFolder"; folder: IFolder }
  | { type: "createCharacter"; folderId: string | null }
  | { type: "renameCharacter"; character: ICharacterSummary }
  | { type: "images"; character: ICharacterSummary; error?: string }
  | { type: "deleteCharacter"; character: ICharacterSummary }
  | { type: "access"; character: ICharacterSummary }
  | { type: "features"; character: ICharacterSummary }
  | { type: "move"; item: ILibraryItemRef; name: string; parentId: string | null }
  | { type: "accounts" };

export type LibraryShapeNode =
  | { kind: "folder"; name: number; summary: string; children: LibraryShapeNode[] | null }
  | { kind: "character"; name: number; subtitle: string; access: number[] };

export interface ILibraryShapeText {
  name: number;
  subtitle: string;
}

export interface ILibraryShape {
  tree: LibraryShapeNode[];
  list: ILibraryShapeText[];
}

export type LibraryShapeHintNode = [number, number, number, number[] | LibraryShapeHintNode[] | 0];

export interface ILibraryShapeHint {
  t?: LibraryShapeHintNode[];
  p?: [number, number, number][];
}
