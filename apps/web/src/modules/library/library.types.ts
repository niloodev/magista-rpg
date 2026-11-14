import type { ICharacterSummary, IFolder, LibraryItemKind } from "@magista/shared";

export interface ILibraryData {
  characters: ICharacterSummary[];
  folders: IFolder[];
}

export type DropPosition = "before" | "after" | "inside";

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
  | { type: "deleteCharacter"; character: ICharacterSummary }
  | { type: "access"; character: ICharacterSummary }
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
