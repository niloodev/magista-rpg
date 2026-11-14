"use client";

import { LEVEL_MAX, deriveSheet } from "@magista/shared";
import { useMemo, useState } from "react";

import { formatSigned } from "@/modules/sheet/sheet.utils";

import type { LevelUpModalProps } from "./LevelUpModal.types";

/**
 * Before/after preview for the next level and the "also raise current values" choice.
 */
export function useLevelUpModal({
  sheet,
  onConfirm,
}: Pick<LevelUpModalProps, "sheet" | "onConfirm">) {
  const [addToCurrent, setAddToCurrent] = useState(true);
  const preview = useMemo(() => {
    const current = deriveSheet(sheet);
    const nextSheet = structuredClone(sheet);
    nextSheet.identity.level = Math.min(LEVEL_MAX, sheet.identity.level + 1);
    const next = deriveSheet(nextSheet);
    return {
      level: { from: sheet.identity.level, to: nextSheet.identity.level },
      rows: [
        {
          label: "Proficiência",
          from: formatSigned(current.proficiency),
          to: formatSigned(next.proficiency),
        },
        { label: "Dano Base", from: current.baseDamage, to: next.baseDamage },
      ],
      lifeDie: current.lifeDie,
      sanityDie: current.sanityDie,
      health: sheet.resources.health,
      sanity: sheet.resources.sanity,
      atMax: sheet.identity.level >= LEVEL_MAX,
    };
  }, [sheet]);
  return { addToCurrent, setAddToCurrent, preview, confirm: () => onConfirm(addToCurrent) };
}
