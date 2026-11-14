import { ROOT_FOLDER_LABEL } from "@/modules/library/library.constants";
import { Icon } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules";

import { CharacterRowSkeleton } from "../CharacterRowSkeleton";
import { LIBRARY_SKELETON_LABEL } from "./LibraryRowsSkeleton.constants";
import type { LibraryRowsSkeletonProps } from "./LibraryRowsSkeleton.types";
import { TreeShapeSkeleton } from "./subcomponents";

/**
 * Loading state of the library with the rows of the last loaded list on this device (`shape`):
 * the GM tree (root line, folders open or closed, sheets with their access chips) or the flat player list.
 */
export function LibraryRowsSkeleton({
  shape,
  tree = false,
  announce = true,
}: LibraryRowsSkeletonProps) {
  if (!tree)
    return (
      <SkeletonRegion label={LIBRARY_SKELETON_LABEL} announce={announce} className="space-y-2">
        {shape.list.map((row, index) => (
          <CharacterRowSkeleton key={index} name={row.name} subtitle={row.subtitle} />
        ))}
      </SkeletonRegion>
    );
  return (
    <SkeletonRegion
      label={LIBRARY_SKELETON_LABEL}
      announce={announce}
      className="flex flex-col gap-3"
    >
      <div className="flex min-h-11 items-center gap-2 border border-transparent border-b-white/10 px-3 font-serif text-sm tracking-wide text-muted-strong">
        <Icon name="house" size={16} aria-hidden="true" />
        {ROOT_FOLDER_LABEL}
      </div>
      <div className="space-y-2">
        <TreeShapeSkeleton nodes={shape.tree} />
      </div>
    </SkeletonRegion>
  );
}
