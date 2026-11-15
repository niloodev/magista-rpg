import type { DropPosition } from "@/modules/library/library.types";

import type { ITreeFolderView } from "../../FolderTree.types";
import type { DragHandleProps } from "../DragHandle";

export interface TreeFolderContentProps {
  folder: ITreeFolderView;
  handleProps: Omit<DragHandleProps, "label">;
  dropPosition: DropPosition | null;
  dimmed: boolean;
}
