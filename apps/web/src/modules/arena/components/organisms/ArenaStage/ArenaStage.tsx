"use client";

import { memo, useId } from "react";

import {
  ARENA_MAP_LOADING_LABEL,
  ARENA_PLACEMENT_TEXTS,
  ARENA_STAGE_HINT,
  ARENA_UNSUPPORTED_TEXTS,
} from "@/modules/arena/arena.constants";
import { useArenaFileDrop } from "@/modules/arena/hooks";
import { Icon } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules";

import { ArenaMapPlaceholder, ArenaNotice } from "../../molecules";
import { useArenaStage } from "./ArenaStage.hook";
import type { ArenaStageProps } from "./ArenaStage.types";

export const ArenaStage = memo(function ArenaStage({
  label,
  onKeyDown,
  onDropFiles,
  className,
  ...hookProps
}: ArenaStageProps) {
  const { hostRef, status } = useArenaStage(hookProps);
  const { dragging, dropHandlers } = useArenaFileDrop(onDropFiles);
  const hintId = useId();
  return (
    <div className={className ?? "relative h-full"} {...dropHandlers}>
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
      {dragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 top-18 flex items-center justify-center border-2 border-dashed border-primary/70 bg-ruby-900/20"
          style={{ left: hookProps.insetLeft + 16, right: hookProps.insetRight + 16 }}
        >
          <span className="flex items-center gap-2 border border-primary/40 bg-void-900/90 px-4 py-2 font-serif text-sm tracking-wide text-foreground">
            <Icon name="upload" size={16} className="text-accent-text" />
            {ARENA_PLACEMENT_TEXTS.dropOverlay}
          </span>
        </div>
      )}
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
