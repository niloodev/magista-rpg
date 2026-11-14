"use client";

import { useMemo } from "react";

import { useSkeletonHint } from "@/modules/shell/providers";
import { PRESENCE_HINT_KEY } from "@/modules/table/table.constants";
import { presenceRows } from "@/modules/table/table.utils";

/**
 * Presence rows to draw: how many people were online the last time this device saw the table.
 */
export function useTableSkeleton() {
  const raw = useSkeletonHint(PRESENCE_HINT_KEY);
  return { presenceRows: useMemo(() => presenceRows(raw), [raw]) };
}
