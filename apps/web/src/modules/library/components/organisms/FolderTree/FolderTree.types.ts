import type { IFolder } from "@magista/shared";
import type { ReactNode } from "react";

import type { DropPosition, ITreeLeaf, ITreeMove } from "@/modules/library/library.types";
import type { IconName } from "@/shared/components/atoms";
import type { ActionMenuItem } from "@/shared/components/molecules";

/** What a leaf row receives from the tree to plug into its own markup. */
export interface ITreeLeafSlots {
  handle: ReactNode;
  dropPosition: DropPosition | null;
  dimmed: boolean;
}

export interface IFolderTreeLabels {
  list: string;
  rootIdle: string;
  rootDragging: string;
  emptyFolder: string;
  moveFolder: (name: string) => string;
  moveLeaf: (name: string) => string;
  folderActions: (name: string) => string;
}

export interface FolderTreeProps<L extends ITreeLeaf> {
  folders: IFolder[];
  leaves: L[];
  /** Kind of the leaves in drag ids and moves ("character", "scene"). */
  leafKind: string;
  expandedFolderIds: string[];
  onToggleFolder: (folderId: string) => void;
  onExpandFolders: (folderIds: string[]) => void;
  onMove: (move: ITreeMove) => void | Promise<void>;
  /** Text under a folder name from its counts (leaves counting every subfolder, direct subfolders). */
  folderSummary: (leaves: number, subfolders: number) => string;
  folderMenu: (folder: IFolder) => ActionMenuItem[];
  renderLeaf: (leaf: L, slots: ITreeLeafSlots) => ReactNode;
  leafPortrait: (leaf: L) => string | null;
  leafIcon?: IconName;
  labels: IFolderTreeLabels;
  empty: ReactNode;
  /** Lets the drag preview leave the list (to drop a leaf on something else, like the Arena map). */
  freeAxis?: boolean;
  /** A leaf dropped outside every row, with the viewport point where it was released. */
  onDropOutside?: (leaf: L, point: { x: number; y: number }) => void;
  /** While a leaf is dragged over a spot where dropping it outside works, the row preview turns into this. */
  outsidePreview?: ITreeOutsidePreview<L>;
}

export interface IDropTarget {
  dragId: string;
  position: DropPosition;
}

export interface ITreeLeafView {
  id: string;
  dragId: string;
  name: string;
  leaf: ITreeLeaf;
}

export interface ITreeFolderView {
  id: string;
  dragId: string;
  name: string;
  summary: string;
  expanded: boolean;
  groupId: string;
  empty: boolean;
  menu: ActionMenuItem[];
  /** Built only while the folder is open (a closed folder renders no rows). */
  folders: ITreeFolderView[];
  leaves: ITreeLeafView[];
}

export interface ITreeDragState {
  activeId: string | null;
  keyboard: boolean;
  excluded: ReadonlySet<string>;
  target: IDropTarget | null;
}

/**
 * Drag state each row reads on its own (where the dragged item would land, which rows cannot receive it), so a
 * pointer move only re-renders the rows whose answer changed.
 */
export interface ITreeRowStore {
  set: (target: IDropTarget | null, excluded: ReadonlySet<string>) => void;
  subscribe: (listener: () => void) => () => void;
  positionOf: (dragId: string) => DropPosition | null;
  isExcluded: (dragId: string) => boolean;
}

/** What every row of one tree shares, stable for the whole drag. */
export interface ITreeRowsContext {
  rows: ITreeRowStore;
  labels: IFolderTreeLabels;
  onToggleFolder: (folderId: string) => void;
  renderLeaf: (leaf: ITreeLeaf, slots: ITreeLeafSlots) => ReactNode;
}

export interface ITreePreview {
  kind: "folder" | "leaf";
  name: string;
  portraitUrl: string | null;
}

/** Preview shown instead of the row while a leaf is over a valid outside drop spot (like a token on a map). */
export interface ITreeOutsidePreview<L> {
  isOver: (point: { x: number; y: number }) => boolean;
  render: (leaf: L) => ReactNode;
}
