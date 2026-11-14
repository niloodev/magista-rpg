import { Icon, Skeleton, skeletonSample } from "@/shared/components/atoms";

import { ActionsSkeleton, HandleSkeleton } from "../RowControlsSkeleton";
import { FOLDER_SKELETON_STYLES } from "./FolderRowSkeleton.constants";
import type { FolderRowSkeletonProps } from "./FolderRowSkeleton.types";

/**
 * Placeholder of a `FolderRow` (closed or open), tab, handle, icons and menu included.
 */
export function FolderRowSkeleton({ name, summary, expanded = false }: FolderRowSkeletonProps) {
  return (
    <div
      className={`relative mt-3 flex min-h-14 items-center gap-2 border py-2 pr-2 pl-2 before:absolute before:-top-[11px] before:-left-px before:h-[11px] before:w-24 before:border before:border-b-0 before:[clip-path:polygon(0_0,82%_0,100%_100%,0_100%)] ${expanded ? FOLDER_SKELETON_STYLES.expanded : FOLDER_SKELETON_STYLES.closed}`}
    >
      <HandleSkeleton />
      <span className="flex min-h-10 min-w-0 flex-1 items-center gap-2">
        <Icon
          name="chevron-right"
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-teal-400 ${expanded ? "rotate-90" : ""}`}
        />
        <Icon
          name={expanded ? "folder-open" : "folder"}
          size={22}
          aria-hidden="true"
          className="shrink-0 text-teal-400"
        />
        <span className="min-w-0">
          <span className="block overflow-hidden font-serif text-base tracking-wide text-clip whitespace-nowrap">
            <Skeleton shape="glyphs" tone="teal">
              {skeletonSample(name)}
            </Skeleton>
          </span>
          <span className="block font-sans text-xs">
            <Skeleton shape="glyphs">{summary}</Skeleton>
          </span>
        </span>
      </span>
      <ActionsSkeleton />
    </div>
  );
}
