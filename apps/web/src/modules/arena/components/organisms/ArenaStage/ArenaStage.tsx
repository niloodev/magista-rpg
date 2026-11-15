"use client";

import { memo, useId } from "react";

import {
  ARENA_MAP_LOADING_LABEL,
  ARENA_STAGE_HINT,
  ARENA_UNSUPPORTED_TEXTS,
} from "@/modules/arena/arena.constants";
import { SkeletonRegion } from "@/shared/components/molecules";

import { ArenaMapPlaceholder, ArenaNotice } from "../../molecules";
import { useArenaStage } from "./ArenaStage.hook";
import type { ArenaStageProps } from "./ArenaStage.types";

export const ArenaStage = memo(function ArenaStage({
  label,
  onKeyDown,
  className,
  ...hookProps
}: ArenaStageProps) {
  const { hostRef, status } = useArenaStage(hookProps);
  const hintId = useId();
  return (
    <div className={className ?? "relative h-full"}>
      <div
        ref={hostRef}
        role="application"
        aria-roledescription="mapa"
        aria-label={label}
        aria-describedby={hintId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="absolute inset-0 overflow-hidden focus-visible:outline-offset-[-4px]"
      />
      <p id={hintId} className="sr-only">
        {ARENA_STAGE_HINT}
      </p>
      {status === "loading" && (
        <SkeletonRegion
          label={ARENA_MAP_LOADING_LABEL}
          className="pointer-events-none absolute inset-0 bg-void-900"
        >
          <ArenaMapPlaceholder
            className="h-full"
            insetLeft={hookProps.insetLeft}
            insetRight={hookProps.insetRight}
          />
        </SkeletonRegion>
      )}
      {status === "unsupported" && (
        <ArenaNotice
          icon="map"
          title={ARENA_UNSUPPORTED_TEXTS.title}
          body={ARENA_UNSUPPORTED_TEXTS.body}
          className="absolute inset-0 bg-void-900 pt-14"
        />
      )}
    </div>
  );
});
