import { Skeleton, skeletonSample } from "@/shared/components/atoms";
import { AvatarSkeleton } from "@/shared/components/molecules";

import { NO_ACCESS_LABEL } from "../CharacterRow";
import { ActionsSkeleton, HandleSkeleton } from "../RowControlsSkeleton";
import type { CharacterRowSkeletonProps } from "./CharacterRowSkeleton.types";

/**
 * Placeholder with the same box, token, typography, access chips and controls as `CharacterRow`.
 * `name` and each `access` entry are text lengths drawn as invisible sample text, and `subtitle` is the class/level
 * line drawn invisible, so the placeholder truncates and wraps like the real row. Omit `access` to hide the access column.
 */
export function CharacterRowSkeleton({
  name,
  subtitle,
  access,
  withHandle = false,
  withActions = false,
}: CharacterRowSkeletonProps) {
  return (
    <div className="relative flex min-h-16 items-center gap-3 border border-white/10 bg-gradient-to-r from-void-700/70 to-black/50 py-2 pr-2 pl-2">
      {withHandle && <HandleSkeleton />}
      <AvatarSkeleton size="sm" />
      <div className="min-w-0 flex-1">
        <p className="overflow-hidden font-serif text-base tracking-wide text-clip whitespace-nowrap">
          <Skeleton shape="glyphs">{skeletonSample(name)}</Skeleton>
        </p>
        <p className="font-sans text-xs">
          <span className="font-semibold tracking-wider uppercase">
            <Skeleton shape="glyphs">{subtitle || skeletonSample(18)}</Skeleton>
          </span>
        </p>
      </div>
      {access && (
        <div className="hidden max-w-[45%] flex-wrap justify-end gap-1.5 sm:flex">
          {access.length === 0 ? (
            <span className="font-sans text-xs text-muted-strong italic">{NO_ACCESS_LABEL}</span>
          ) : (
            access.map((length, index) => (
              <Skeleton
                key={index}
                shape="inline"
                tone="teal"
                className="gap-1 border border-teal-500/40 px-2 py-0.5 font-sans text-xs"
              >
                <span className="h-3 w-3" />
                {skeletonSample(length)}
              </Skeleton>
            ))
          )}
        </div>
      )}
      {withActions && <ActionsSkeleton />}
    </div>
  );
}
