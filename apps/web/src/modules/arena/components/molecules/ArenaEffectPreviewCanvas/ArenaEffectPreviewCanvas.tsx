"use client";

import { ARENA_EFFECT_TEXTS } from "@/modules/arena/arena.constants";
import { Icon, Skeleton } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules";

import { useArenaEffectPreviewCanvas } from "./ArenaEffectPreviewCanvas.hook";
import type { ArenaEffectPreviewCanvasProps } from "./ArenaEffectPreviewCanvas.types";

/**
 * A small looping example of an animation on two sample tokens (attacker A, target B).
 */
export function ArenaEffectPreviewCanvas({
  play,
  label,
  className,
}: ArenaEffectPreviewCanvasProps) {
  const { hostRef, loading, looping, toggle, toggleLabel } = useArenaEffectPreviewCanvas({ play });
  return (
    <div
      className={`relative overflow-hidden border border-primary/30 bg-void-900 ${className ?? ""}`}
    >
      <div ref={hostRef} role="img" aria-label={label} className="absolute inset-0" />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-2 bottom-2 z-10 flex min-h-8 items-center gap-1.5 border border-white/15 bg-black/70 px-2.5 font-sans text-xs font-semibold text-label transition-colors hover:border-gold-400/60"
      >
        <Icon name={looping ? "pause" : "play"} size={14} />
        {toggleLabel}
      </button>
      {loading && (
        <SkeletonRegion
          label={ARENA_EFFECT_TEXTS.previewLoading}
          announce={false}
          className="absolute inset-0"
        >
          <Skeleton shape="block" className="h-full w-full" />
        </SkeletonRegion>
      )}
    </div>
  );
}
