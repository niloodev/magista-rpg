import type { ISheetInventoryItem } from "@magista/shared";

export interface InventoryEntryProps {
  item: ISheetInventoryItem;
  onEdit: () => void;
  onDelete: () => void;
}
