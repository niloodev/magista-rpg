import type { DropPosition } from "@/modules/library/library.types";
import type { ReactNode } from "react";

export interface FolderRowProps {
  name: string;
  summary: string;
  expanded: boolean;
  groupId: string;
  onToggle: () => void;
  actions?: ReactNode;
  handle?: ReactNode;
  dropPosition?: DropPosition | null;
  dimmed?: boolean;
}
