import type { IMoveLibraryItemInput } from "@magista/shared";

import type { DropPosition, ILibraryData, LibraryDialog } from "@/modules/library/library.types";
import type { ActionMenuItem } from "@/shared/components/molecules";

export interface LibraryTreeProps {
  data: ILibraryData;
  expandedFolderIds: string[];
  accountLogins: Map<string, string>;
  onToggleFolder: (folderId: string) => void;
  onExpandFolders: (folderIds: string[]) => void;
  onMove: (move: IMoveLibraryItemInput) => Promise<void>;
  onDialog: (dialog: LibraryDialog) => void;
}

export interface IDropTarget {
  dragId: string;
  position: DropPosition;
}

export interface ITreeCharacterView {
  id: string;
  dragId: string;
  name: string;
  subtitle: string;
  href: string;
  portraitUrl: string | null;
  accountLabels: string[];
  menu: ActionMenuItem[];
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
  characters: ITreeCharacterView[];
}

export interface ITreeDragState {
  activeId: string | null;
  keyboard: boolean;
  excluded: string[];
  target: IDropTarget | null;
}
