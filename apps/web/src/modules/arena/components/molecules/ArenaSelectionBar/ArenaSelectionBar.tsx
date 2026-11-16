import { memo } from "react";

import { ARENA_TOKEN_SIZE_MAX, ARENA_TOKEN_SIZE_MIN } from "@magista/shared";

import { ARENA_SELECTION_TEXTS, ARENA_SIZE_STEP } from "@/modules/arena/arena.constants";
import { Stepper } from "@/shared/components/molecules";

import { ArenaStatusReadout } from "../ArenaStatusReadout";
import type { ArenaSelectionBarProps } from "./ArenaSelectionBar.types";

/**
 * The selection at a glance: how many tokens, the status readout of a single token and, for the GM, the size
 * (applied to all of them, the keyboard way to resize). The token actions live in the right-click menu (or
 * Shift+F10), and "Aplicar mudança" also opens with the M key.
 */
export const ArenaSelectionBar = memo(function ArenaSelectionBar({
  label,
  isGm,
  size,
  status,
  onSizeChange,
  className,
}: ArenaSelectionBarProps) {
  return (
    <section
      aria-label={ARENA_SELECTION_TEXTS.region}
      className={`flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 whitespace-nowrap border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-sm lite:bg-void-900/95 lite:backdrop-blur-none ${className ?? ""}`}
    >
      <span className="font-sans text-[15px] text-muted-strong" aria-live="polite">
        {label}
      </span>
      {status && <ArenaStatusReadout status={status.status} label={status.label} />}
      {isGm && (
        <>
          <span aria-hidden="true" className="h-6 w-px bg-border" />
          <span className="font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
            {ARENA_SELECTION_TEXTS.size}
          </span>
          <Stepper
            label={ARENA_SELECTION_TEXTS.sizeLabel}
            value={size}
            onValueChange={onSizeChange}
            min={ARENA_TOKEN_SIZE_MIN}
            max={ARENA_TOKEN_SIZE_MAX}
            step={ARENA_SIZE_STEP}
          />
        </>
      )}
    </section>
  );
});
