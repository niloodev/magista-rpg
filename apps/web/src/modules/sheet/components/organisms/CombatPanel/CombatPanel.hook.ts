"use client";

import {
  BLOCK_KEYS,
  BLOCKS,
  ATTRIBUTE_LABELS,
  blockOutcomes,
  type IOpeningAction,
} from "@magista/shared";

import type { SheetSectionProps } from "@/modules/sheet/sheet.types";

/**
 * Block cards data and the opening spend handler (counter-attack also rolls).
 */
export function useCombatPanel({ sheet, derived, onEdit, onRoll }: SheetSectionProps) {
  const blocks = BLOCK_KEYS.map((key) => {
    const block = BLOCKS[key];
    const modifier = derived.attributes[block.attribute].modifier;
    return {
      key,
      name: block.name,
      summary: block.summary,
      attribute: ATTRIBUTE_LABELS[block.attribute].short,
      expression:
        modifier === 0 ? "1d20" : `1d20 ${modifier > 0 ? "+" : "-"} ${Math.abs(modifier)}`,
      outcomes: blockOutcomes(key, sheet),
      onRoll: () => onRoll({ kind: "block", key }),
    };
  });

  const spend = (action: IOpeningAction) => {
    onEdit(
      (draft) => void (draft.combat.openings = Math.max(0, draft.combat.openings - action.cost)),
    );
    if (action.key === "counterAttack") onRoll({ kind: "counterAttack" });
  };

  const setOpenings = (value: number | null) =>
    onEdit((draft) => void (draft.combat.openings = Math.max(0, value ?? 0)));

  return { blocks, openings: sheet.combat.openings, spend, setOpenings };
}
