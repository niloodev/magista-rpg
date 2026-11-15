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
  folderSummary: (folderId: string) => string;
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
}

export interface IDropTarget {
  dragId: string;
  position: DropPosition;
}

export interface ITreeLeafView {
  id: string;
  dragId: string;
  name: string;
  render: (slots: ITreeLeafSlots) => ReactNode;
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
  onToggle: () => void;
  folders: ITreeFolderView[];
  leaves: ITreeLeafView[];
}

export interface ITreeDragState {
  activeId: string | null;
  keyboard: boolean;
  excluded: string[];
  target: IDropTarget | null;
}

export interface ITreePreview {
  kind: "folder" | "leaf";
  name: string;
  portraitUrl: string | null;
}
