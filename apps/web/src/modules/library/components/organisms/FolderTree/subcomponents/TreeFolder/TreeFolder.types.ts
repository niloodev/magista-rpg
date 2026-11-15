import type { IDropTarget, IFolderTreeLabels, ITreeFolderView } from "../../FolderTree.types";

export interface TreeFolderProps {
  folder: ITreeFolderView;
  target: IDropTarget | null;
  excluded: string[];
  labels: IFolderTreeLabels;
}
