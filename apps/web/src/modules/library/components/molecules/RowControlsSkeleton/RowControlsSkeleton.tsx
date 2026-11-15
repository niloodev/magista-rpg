import { Icon } from "@/shared/components/atoms";

import type { RootRowSkeletonProps } from "./RowControlsSkeleton.types";

/**
 * Inert copy of the tree drag handle (`DragHandle`).
 */
export function HandleSkeleton() {
  return (
    <span className="flex h-9 w-8 shrink-0 items-center justify-center bg-black/40 text-muted-strong/60">
      <Icon name="grip-vertical" size={18} aria-hidden="true" />
    </span>
  );
}

/**
 * Inert copy of the row actions button (`ActionMenu` trigger).
 */
export function ActionsSkeleton() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-transparent bg-black/50 text-muted-strong/60">
      <Icon name="ellipsis-vertical" size={18} aria-hidden="true" />
    </span>
  );
}

/**
 * Inert copy of the "open in window" icon button (`PopoutButton`).
 */
export function PopoutSkeleton() {
  return (
    <span className="hidden h-9 w-9 shrink-0 items-center justify-center border border-transparent bg-black/50 text-muted-strong/60 @md:flex">
      <Icon name="picture-in-picture-2" size={17} aria-hidden="true" />
    </span>
  );
}

/**
 * Inert copy of the tree root line ("Todas as fichas", "Todas as cenas").
 */
export function RootRowSkeleton({ label }: RootRowSkeletonProps) {
  return (
    <div className="flex min-h-11 items-center gap-2 border border-transparent border-b-white/10 px-3 font-serif text-sm tracking-wide text-muted-strong">
      <Icon name="house" size={16} aria-hidden="true" />
      {label}
    </div>
  );
}
