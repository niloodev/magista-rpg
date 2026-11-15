import type { IconName } from "@/shared/components/atoms";

/**
 * The arrow points where the panel goes: outward to collapse it, inward to bring it back.
 */
export function toggleIcon(side: "left" | "right", open: boolean): IconName {
  return (side === "left") === open ? "chevron-left" : "chevron-right";
}
