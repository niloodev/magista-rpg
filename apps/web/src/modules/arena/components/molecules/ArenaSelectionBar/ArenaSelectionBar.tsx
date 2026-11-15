import { ARENA_TOKEN_SIZE_MAX, ARENA_TOKEN_SIZE_MIN } from "@magista/shared";

import { ARENA_SELECTION_TEXTS, ARENA_SIZE_STEP } from "@/modules/arena/arena.constants";
import { Button, Icon } from "@/shared/components/atoms";
import { Stepper } from "@/shared/components/molecules";

import type { ArenaSelectionBarProps } from "./ArenaSelectionBar.types";

/**
 * Actions for the selected tokens: size (applied to all of them, the keyboard way to resize), hide or show,
 * open the sheet of a single character token and remove. Players only get "Abrir ficha".
 */
export function ArenaSelectionBar({
  label,
  isGm,
  size,
  allHidden,
  canOpenSheet,
  onSizeChange,
  onToggleHidden,
  onOpenSheet,
  onRemove,
  className,
}: ArenaSelectionBarProps) {
  return (
    <section
      aria-label={ARENA_SELECTION_TEXTS.region}
      className={`flex items-center gap-3 whitespace-nowrap border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-sm lite:bg-void-900/95 lite:backdrop-blur-none ${className ?? ""}`}
    >
      <span className="font-sans text-[15px] text-muted-strong" aria-live="polite">
        {label}
      </span>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHidden}
            icon={<Icon name={allHidden ? "eye" : "eye-off"} size={14} />}
          >
            {allHidden ? ARENA_SELECTION_TEXTS.show : ARENA_SELECTION_TEXTS.hide}
          </Button>
        </>
      )}
      {canOpenSheet && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSheet}
          icon={<Icon name="scroll-text" size={14} />}
        >
          {ARENA_SELECTION_TEXTS.openSheet}
        </Button>
      )}
      {isGm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          icon={<Icon name="trash-2" size={14} />}
        >
          {ARENA_SELECTION_TEXTS.remove}
        </Button>
      )}
    </section>
  );
}
