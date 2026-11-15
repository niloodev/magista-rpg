import type { DropPosition } from "@/modules/library/library.types";

import type { ITreeLeafView } from "../../FolderTree.types";
import type { DragHandleProps } from "../DragHandle";

export interface TreeLeafContentProps {
  leaf: ITreeLeafView;
  handleProps: Omit<DragHandleProps, "label">;
  dropPosition: DropPosition | null;
  dimmed: boolean;
}
