import { AVATAR_SIZES, Skeleton } from "@/shared/components/atoms";

import { AVATAR_SKELETON_RING } from "./AvatarSkeleton.constants";
import type { AvatarSkeletonProps } from "./AvatarSkeleton.types";

/**
 * Placeholder of a round `Avatar` (token), same size and ruby ring.
 */
export function AvatarSkeleton({ size = "md", className }: AvatarSkeletonProps) {
  return (
    <Skeleton
      shape="circle"
      tone="ruby"
      className={`${AVATAR_SIZES[size].box} ${AVATAR_SKELETON_RING} ${className ?? ""}`}
    />
  );
}
