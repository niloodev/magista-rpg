import { ARENA_ZOOM_GROUP_LABEL, ARENA_ZOOM_LABELS } from "@/modules/arena/arena.constants";
import { Icon } from "@/shared/components/atoms";

import { ARENA_TOOL_BUTTON_CLASSES, ARENA_TOOL_GROUP_CLASSES } from "./ArenaZoomControls.constants";
import type { ArenaZoomControlsProps } from "./ArenaZoomControls.types";

export function ArenaZoomControls({
  onZoomIn,
  onZoomOut,
  onFit,
  className,
}: ArenaZoomControlsProps) {
  return (
    <div
      role="group"
      aria-label={ARENA_ZOOM_GROUP_LABEL}
      className={`${ARENA_TOOL_GROUP_CLASSES} ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={onZoomIn}
        aria-label={ARENA_ZOOM_LABELS.in}
        title={ARENA_ZOOM_LABELS.in}
        className={ARENA_TOOL_BUTTON_CLASSES}
      >
        <Icon name="zoom-in" size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label={ARENA_ZOOM_LABELS.out}
        title={ARENA_ZOOM_LABELS.out}
        className={ARENA_TOOL_BUTTON_CLASSES}
      >
        <Icon name="zoom-out" size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onFit}
        aria-label={ARENA_ZOOM_LABELS.fit}
        title={ARENA_ZOOM_LABELS.fit}
        className={ARENA_TOOL_BUTTON_CLASSES}
      >
        <Icon name="maximize" size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
