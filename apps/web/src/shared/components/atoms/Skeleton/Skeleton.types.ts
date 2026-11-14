import type { ReactNode } from "react";

export type SkeletonShape = "bar" | "circle" | "block" | "text" | "glyphs" | "inline";

export type SkeletonTone = "neutral" | "ruby" | "teal";

export interface SkeletonProps {
  shape?: SkeletonShape;
  tone?: SkeletonTone;
  className?: string;
  children?: ReactNode;
}
