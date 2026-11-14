import type { ReactNode } from "react";

export interface SortableListProps<T extends { id: string }> {
  label: string;
  items: T[];
  itemName: (item: T) => string;
  onMove: (activeId: string, overId: string) => void;
  renderItem: (item: T) => ReactNode;
  className?: string;
}
