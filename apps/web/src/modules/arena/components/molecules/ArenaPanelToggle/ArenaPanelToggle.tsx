import { Icon } from "@/shared/components/atoms";

import { PANEL_TOGGLE_CLASSES, PANEL_TOGGLE_EDGE } from "./ArenaPanelToggle.constants";
import type { ArenaPanelToggleProps } from "./ArenaPanelToggle.types";
import { toggleIcon } from "./ArenaPanelToggle.utils";

/**
 * Tab on the inner edge of a side panel (or on the screen edge while it is collapsed) that hides or brings
 * the panel back. Both panels use the same tab, mirrored.
 */
export function ArenaPanelToggle({
  side,
  open,
  label,
  onToggle,
  controls,
  className,
  style,
}: ArenaPanelToggleProps) {
  const edge = PANEL_TOGGLE_EDGE[side];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-controls={open ? controls : undefined}
      title={label}
      style={style}
      className={`${PANEL_TOGGLE_CLASSES} ${edge} ${className ?? ""}`}
    >
      <Icon name={toggleIcon(side, open)} size={18} aria-hidden="true" />
    </button>
  );
}
