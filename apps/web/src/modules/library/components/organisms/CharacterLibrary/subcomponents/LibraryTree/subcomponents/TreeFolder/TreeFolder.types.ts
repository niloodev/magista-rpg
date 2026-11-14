import type { IDropTarget, ITreeFolderView } from "../../LibraryTree.types";

export interface TreeFolderProps {
  folder: ITreeFolderView;
  target: IDropTarget | null;
  excluded: string[];
}
