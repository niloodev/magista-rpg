"use client";

import { autoEffectStyle } from "@magista/shared";
import { useId, useMemo, useState } from "react";

import { ARENA_EFFECT_CATALOG, ARENA_EFFECT_TEXTS } from "@/modules/arena/arena.constants";
import type { ArenaEffectChoice, ArenaEffectFilter } from "@/modules/arena/arena.types";
import { filterEffects } from "@/modules/arena/arena.utils";
import { usePrefersReducedMotion } from "@/shared/hooks";

import type { ArenaEffectPickerDialogProps } from "./ArenaEffectPickerDialog.types";

/**
 * Draft of the effect picker: search and filter over the catalog (made to grow), the highlighted effect (its
 * example loops), whether the example shows the attacker, and confirming the choice.
 */
export function useArenaEffectPickerDialog({
  kind,
  resource,
  value,
  autoStyle,
  onChoose,
}: Pick<ArenaEffectPickerDialogProps, "kind" | "resource" | "value" | "autoStyle" | "onChoose">) {
  const groupId = useId();
  const [draft, setDraft] = useState<ArenaEffectChoice>(value);
  const [withAttacker, setWithAttacker] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ArenaEffectFilter>("all");
  const lite = usePrefersReducedMotion();
  const auto = autoStyle ?? autoEffectStyle(kind, resource);
  const style = draft === "auto" ? auto : draft;
  const shown = useMemo(
    () => filterEffects(ARENA_EFFECT_CATALOG, query, filter, kind, resource),
    [query, filter, kind, resource],
  );
  return {
    groupId,
    lite,
    draft,
    setDraft,
    withAttacker,
    setWithAttacker,
    query,
    setQuery,
    filter,
    setFilter,
    shown,
    countLabel: ARENA_EFFECT_TEXTS.count(shown.length),
    autoDetail: ARENA_EFFECT_TEXTS.autoDescription(ARENA_EFFECT_CATALOG[auto].name),
    play: { style, kind, resource, withAttacker },
    previewName:
      draft === "auto"
        ? ARENA_EFFECT_TEXTS.autoShort(ARENA_EFFECT_CATALOG[auto].name)
        : ARENA_EFFECT_CATALOG[style].name,
    previewDetail: ARENA_EFFECT_CATALOG[style].description,
    previewLabel: ARENA_EFFECT_TEXTS.previewLabel(ARENA_EFFECT_CATALOG[style].name),
    confirm: () => onChoose(draft),
  };
}
