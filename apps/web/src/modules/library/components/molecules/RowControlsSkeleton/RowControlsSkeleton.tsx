import { Icon } from "@/shared/components/atoms";

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
