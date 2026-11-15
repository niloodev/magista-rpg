import type { CSSProperties } from "react";

export interface ArenaPanelToggleProps {
  /** Screen side the panel lives on. */
  side: "left" | "right";
  open: boolean;
  label: string;
  onToggle: () => void;
  /** Id of the panel it shows or hides (only referenced while the panel is open). */
  controls?: string;
  className?: string;
  style?: CSSProperties;
}
