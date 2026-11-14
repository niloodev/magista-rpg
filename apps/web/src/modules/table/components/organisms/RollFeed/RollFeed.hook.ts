"use client";

import { useEffect, useMemo } from "react";

import { useSkeletonHint, useSkeletonHintActions } from "@/modules/shell/providers";
import { FEED_HINT_KEY } from "@/modules/table/table.constants";
import { feedHint, parseFeedHint } from "@/modules/table/table.utils";

import { DEFAULT_FEED_SHAPE } from "./RollFeed.constants";
import type { RollFeedProps } from "./RollFeed.types";

/**
 * While the history has not arrived, gives the shape of the last feed seen on this device for the skeleton;
 * once loaded, remembers the current shape (rows and note lengths only) for the next load. Inside a page
 * skeleton (`nested`) the title is not a real heading.
 */
export function useRollFeed({ rolls, loading = false, nested = false }: RollFeedProps) {
  const raw = useSkeletonHint(FEED_HINT_KEY);
  const { setHint } = useSkeletonHintActions();
  const shape = useMemo(() => parseFeedHint(raw) ?? DEFAULT_FEED_SHAPE, [raw]);

  useEffect(() => {
    if (!loading) setHint(FEED_HINT_KEY, feedHint(rolls));
  }, [loading, rolls, setHint]);

  const showSkeleton = loading && shape.count > 0;
  return {
    shape,
    showSkeleton,
    showEmpty: !showSkeleton && rolls.length === 0,
    countLabel: rolls.length > 0 ? `${rolls.length} recentes` : null,
    countSample: `${shape.count} recentes`,
    TitleTag: nested ? ("p" as const) : ("h2" as const),
  };
}
