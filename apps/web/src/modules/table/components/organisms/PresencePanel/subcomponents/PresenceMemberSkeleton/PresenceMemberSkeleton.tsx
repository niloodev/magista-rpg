import { Skeleton } from "@/shared/components/atoms";

import { PRESENCE_ROLE_SAMPLE } from "./PresenceMemberSkeleton.constants";

/**
 * Placeholder of a `PresenceMember` row (same box and typography), while the live presence arrives.
 */
export function PresenceMemberSkeleton() {
  return (
    <li className="flex items-center justify-between border border-border/30 bg-black/40 px-4 py-2 font-sans text-sm">
      <span>
        <Skeleton shape="text" className="w-24" />
      </span>
      <span className="font-sans text-xs font-bold tracking-[0.15em] uppercase">
        <Skeleton shape="glyphs" tone="ruby">
          {PRESENCE_ROLE_SAMPLE}
        </Skeleton>
      </span>
    </li>
  );
}
