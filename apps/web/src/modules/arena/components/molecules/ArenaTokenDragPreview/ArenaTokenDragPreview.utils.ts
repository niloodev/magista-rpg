import { ARENA_TOKEN_PREVIEW_LIMITS } from "@/modules/arena/arena.constants";

/**
 * Diameter of the drag preview: the token's size on screen, kept readable when zoomed far out or in.
 */
export function tokenPreviewDiameter(size: number): number {
  return Math.round(
    Math.min(Math.max(size, ARENA_TOKEN_PREVIEW_LIMITS.min), ARENA_TOKEN_PREVIEW_LIMITS.max),
  );
}
