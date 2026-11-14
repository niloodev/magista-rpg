import type { ReactNode } from "react";

export interface SortableItemProps {
  id: string;
  name: string;
  animate: boolean;
  children: ReactNode;
}
