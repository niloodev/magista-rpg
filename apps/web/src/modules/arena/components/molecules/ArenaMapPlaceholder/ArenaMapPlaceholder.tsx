import { Skeleton } from "@/shared/components/atoms";

import type { ArenaMapPlaceholderProps } from "./ArenaMapPlaceholder.types";

/**
 * Stand-in for the map while the board, the scene or its image loads. It reproduces the fitted camera (top bar
 * left out, 12px margin on phones and 48px from `sm`), so the real map appears in the same place.
 */
export function ArenaMapPlaceholder({ className }: ArenaMapPlaceholderProps) {
  return (
    <div className={`px-3 pt-[4.25rem] pb-3 sm:px-12 sm:pt-[6.5rem] sm:pb-12 ${className ?? ""}`}>
      <div className="flex h-full w-full items-center justify-center [container-type:size]">
        <Skeleton
          shape="block"
          className="aspect-[16/10] w-[min(100cqw,calc(100cqh*1.6))] border border-primary/15"
        />
      </div>
    </div>
  );
}
