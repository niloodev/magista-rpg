import { SCENE_TREE_LABELS } from "@/modules/arena/arena.constants";
import {
  ActionsSkeleton,
  HandleSkeleton,
  RootRowSkeleton,
} from "@/modules/library/components/molecules";
import { Skeleton } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules";

import {
  SCENE_SKELETON_LABEL,
  SCENE_SKELETON_ROWS,
  SCENE_SKELETON_SAMPLE,
} from "./SceneLibrarySkeleton.constants";
import type { SceneLibrarySkeletonProps } from "./SceneLibrarySkeleton.types";

/**
 * Loading state of the scene tree: the real root line and rows in the `SceneRow` frame (handle, map
 * thumbnail, name and the menu button), all inert.
 */
export function SceneLibrarySkeleton({ announce = true }: SceneLibrarySkeletonProps) {
  return (
    <SkeletonRegion
      label={SCENE_SKELETON_LABEL}
      announce={announce}
      className="flex flex-col gap-3"
    >
      <RootRowSkeleton label={SCENE_TREE_LABELS.rootIdle} />
      <ul className="space-y-2">
        {SCENE_SKELETON_ROWS.map((row) => (
          <li
            key={row}
            className="flex min-h-14 items-center gap-2.5 border border-white/10 bg-gradient-to-r from-void-700/70 to-black/50 p-1.5"
          >
            <HandleSkeleton />
            <span className="flex h-10 w-16 shrink-0 border border-white/10 bg-void-800">
              <Skeleton shape="block" className="h-full w-full" />
            </span>
            <span className="min-w-0 flex-1 font-serif text-[15px] tracking-wide">
              <Skeleton shape="glyphs">{SCENE_SKELETON_SAMPLE}</Skeleton>
            </span>
            <ActionsSkeleton />
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}
