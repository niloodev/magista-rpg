import { Skeleton } from "@/shared/components/atoms";

import type { ArenaMapPlaceholderProps } from "./ArenaMapPlaceholder.types";
import { placeholderInsets } from "./ArenaMapPlaceholder.utils";

/**
 * Stand-in for the map while the board, the scene or its image loads. It reproduces the fitted camera (top bar
 * and the bottom controls left out, 12px margin on phones and 48px from `sm`), so the real map appears in
 * the same place.
 */
export function ArenaMapPlaceholder({
  className,
  insetLeft = 0,
  insetRight = 0,
}: ArenaMapPlaceholderProps) {
  return (
    <div
      style={placeholderInsets(insetLeft, insetRight)}
      className={`px-3 pt-[4.25rem] pb-[5.25rem] sm:px-12 sm:pt-[6.5rem] sm:pb-[7.5rem] ${className ?? ""}`}
    >
      <div className="flex h-full w-full items-center justify-center [container-type:size]">
        <Skeleton
          shape="block"
          className="aspect-[16/10] w-[min(100cqw,calc(100cqh*1.6))] border border-primary/15"
        />
      </div>
    </div>
  );
}
