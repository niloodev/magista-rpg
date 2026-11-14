import type { SkeletonShape, SkeletonTone } from "./Skeleton.types";

export const SKELETON_SHAPES: Record<SkeletonShape, string> = {
  bar: "block h-3",
  circle: "block rounded-full",
  block: "block",
  text: "inline-block h-[0.8em] align-[-0.1em]",
  glyphs: "box-decoration-clone",
  inline: "inline-flex items-center justify-center",
};

export const SKELETON_TONES: Record<SkeletonTone, string> = {
  neutral: "bg-white/10",
  ruby: "bg-primary/20",
  teal: "bg-teal-500/20",
};

export const SKELETON_HIDDEN_CONTENT = "invisible contents select-none";

export const SKELETON_SAMPLE_FILLER = "Personagem da mesa Magista em exemplo ";

export const SKELETON_SAMPLE_MAX = 60;
