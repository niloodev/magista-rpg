import type { HTMLAttributes } from "react";

export type PanelVariant = "glass" | "primary" | "inner";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  brackets?: boolean;
}
