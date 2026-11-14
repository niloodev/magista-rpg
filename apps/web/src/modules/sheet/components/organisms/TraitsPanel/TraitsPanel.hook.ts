"use client";

import type { ISheetTrait } from "@magista/shared";

import { useEntryEditor } from "@/modules/sheet/hooks";
import type { SheetEditor } from "@/modules/sheet/sheet.types";
import { createTrait, validateTrait } from "@/modules/sheet/sheet.utils";
import { moveListItemById } from "@/shared/components/organisms";

/**
 * Modal create/edit/delete for traits, plus drag and drop reordering.
 */
export function useTraitsPanel(onEdit: SheetEditor) {
  const editor = useEntryEditor<ISheetTrait>({
    validate: validateTrait,
    onCreate: (entry) => onEdit((draft) => void draft.traits.push(entry)),
    onUpdate: (entry) =>
      onEdit(
        (draft) =>
          void (draft.traits = draft.traits.map((trait) =>
            trait.id === entry.id ? entry : trait,
          )),
      ),
    onDelete: (entry) =>
      onEdit(
        (draft) => void (draft.traits = draft.traits.filter((trait) => trait.id !== entry.id)),
      ),
  });
  return {
    editor,
    openCreate: () => editor.openCreate(createTrait()),
    moveTrait: (activeId: string, overId: string) =>
      onEdit((draft) => void (draft.traits = moveListItemById(draft.traits, activeId, overId))),
    traitName: (trait: ISheetTrait) => trait.name || "Sem nome",
  };
}
