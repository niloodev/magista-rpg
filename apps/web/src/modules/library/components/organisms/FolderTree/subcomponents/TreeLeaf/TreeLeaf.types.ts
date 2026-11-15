import type { IDropTarget, IFolderTreeLabels, ITreeLeafView } from "../../FolderTree.types";

export interface TreeLeafProps {
  leaf: ITreeLeafView;
  target: IDropTarget | null;
  excluded: string[];
  labels: IFolderTreeLabels;
}
