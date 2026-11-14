import type { ISheetInventoryItem } from "@magista/shared";

export interface InventoryEntryProps {
  item: ISheetInventoryItem;
  pinged: boolean;
  onPing: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
