"use client";

import type { ISheetInventoryItem } from "@magista/shared";

import { useEntryEditor } from "@/modules/sheet/hooks";
import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { createItem, validateItem } from "@/modules/sheet/sheet.utils";
import { moveListItemById } from "@/shared/components/organisms";

/**
 * Modal create/edit/delete and drag and drop reordering for inventory items, plus the carry load meter values.
 */
export function useInventoryPanel({ sheet, derived, onEdit }: SheetSectionProps) {
  const editor = useEntryEditor<ISheetInventoryItem>({
    validate: validateItem,
    onCreate: (entry) => onEdit((draft) => void draft.inventory.items.push(entry)),
    onUpdate: (entry) =>
      onEdit(
        (draft) =>
          void (draft.inventory.items = draft.inventory.items.map((item) =>
            item.id === entry.id ? entry : item,
          )),
      ),
    onDelete: (entry) =>
      onEdit(
        (draft) =>
          void (draft.inventory.items = draft.inventory.items.filter(
            (item) => item.id !== entry.id,
          )),
      ),
  });
  const { maxWeightGrams } = sheet.inventory;
  const current = derived.currentWeightGrams;
  return {
    editor,
    openCreate: () => editor.openCreate(createItem()),
    current,
    percent: maxWeightGrams ? Math.min(100, (current / maxWeightGrams) * 100) : 0,
    overweight: maxWeightGrams !== null && current > maxWeightGrams,
    moveItem: (activeId: string, overId: string) =>
      onEdit(
        (draft) =>
          void (draft.inventory.items = moveListItemById(draft.inventory.items, activeId, overId)),
      ),
    itemName: (item: ISheetInventoryItem) => item.name || "Sem nome",
    setMaxWeight: (value: number | null) =>
      onEdit((draft) => void (draft.inventory.maxWeightGrams = value)),
  };
}
