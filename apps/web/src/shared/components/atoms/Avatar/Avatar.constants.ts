import type { AvatarShape, AvatarSize } from "./Avatar.types";

export const AVATAR_SIZES: Record<AvatarSize, { box: string; pixels: number; text: string }> = {
  xs: { box: "h-7 w-7", pixels: 28, text: "text-xs" },
  sm: { box: "h-10 w-10", pixels: 40, text: "text-sm" },
  md: { box: "h-16 w-16", pixels: 64, text: "text-xl" },
  lg: { box: "h-24 w-24", pixels: 96, text: "text-3xl" },
  xl: { box: "h-36 w-36", pixels: 144, text: "text-5xl" },
};

export const AVATAR_SHAPES: Record<AvatarShape, string> = {
  square: "border border-primary/40 bg-void-800",
  circle: "rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-void-900 bg-void-700",
};
