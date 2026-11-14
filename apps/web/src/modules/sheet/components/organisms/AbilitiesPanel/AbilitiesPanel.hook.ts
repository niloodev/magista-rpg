"use client";

import type { ISheetAbility } from "@magista/shared";

import { useEntryEditor } from "@/modules/sheet/hooks";
import { createAbility, validateAbility } from "@/modules/sheet/sheet.utils";
import { moveListItemById } from "@/shared/components/organisms";

import type { AbilitiesPanelProps } from "./AbilitiesPanel.types";

/**
 * Modal create/edit/delete for abilities or inner realm manifestations, plus drag and drop reordering.
 */
export function useAbilitiesPanel({ list, onEdit }: Pick<AbilitiesPanelProps, "list" | "onEdit">) {
  const editor = useEntryEditor<ISheetAbility>({
    validate: validateAbility,
    onCreate: (entry) => onEdit((draft) => void draft[list].push(entry)),
    onUpdate: (entry) =>
      onEdit(
        (draft) =>
          void (draft[list] = draft[list].map((current) =>
            current.id === entry.id ? entry : current,
          )),
      ),
    onDelete: (entry) =>
      onEdit(
        (draft) => void (draft[list] = draft[list].filter((current) => current.id !== entry.id)),
      ),
  });
  return {
    editor,
    openCreate: () => editor.openCreate(createAbility()),
    moveAbility: (activeId: string, overId: string) =>
      onEdit((draft) => void (draft[list] = moveListItemById(draft[list], activeId, overId))),
    abilityName: (ability: ISheetAbility) => ability.name || "Sem nome",
  };
}
