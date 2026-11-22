import { useMemo } from "react";

import { versionedUrl } from "@/core/services/version";
import { WORLD_MAP_THUMB_URL, WORLD_TEXTS } from "@/modules/arena/arena.constants";
import type { ActionMenuItem } from "@/shared/components/molecules";

import type { WorldMapRowHookProps } from "./WorldMapRow.types";

/**
 * The menu of the world map row (see it, and put it live or go back to the scene it replaced) and its thumbnail,
 * versioned like every asset of the app.
 */
export function useWorldMapRow({
  live,
  canReturn,
  onPreview,
  onGoLive,
  onReturn,
}: WorldMapRowHookProps) {
  const items = useMemo<ActionMenuItem[]>(
    () => [
      { label: WORLD_TEXTS.view, icon: "eye", onSelect: onPreview },
      ...(live
        ? canReturn
          ? [{ label: WORLD_TEXTS.backToScene, icon: "undo-2" as const, onSelect: onReturn }]
          : []
        : [{ label: WORLD_TEXTS.goLive, icon: "zap" as const, onSelect: onGoLive }]),
    ],
    [live, canReturn, onPreview, onGoLive, onReturn],
  );
  return { items, thumbUrl: versionedUrl(WORLD_MAP_THUMB_URL) };
}
