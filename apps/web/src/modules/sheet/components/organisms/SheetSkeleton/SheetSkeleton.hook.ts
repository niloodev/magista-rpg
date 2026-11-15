"use client";

import { SHEET_ART_HINT_KEY } from "@/modules/sheet/sheet.constants";
import { useSkeletonHint } from "@/modules/shell/providers";

/**
 * Whether the last sheet opened on this device had full art (shows the "Ver arte completa" button);
 * defaults to yes, the common case for imported characters.
 */
export function useSheetSkeleton(known?: boolean) {
  const hinted = useSkeletonHint(SHEET_ART_HINT_KEY) !== 0;
  return { art: known ?? hinted };
}
