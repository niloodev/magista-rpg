import type { CheckboxSkeletonProps } from "./CheckboxSkeleton.types";

/**
 * Unchecked `Checkbox` box (and its real label), inert.
 */
export function CheckboxSkeleton({ label, className }: CheckboxSkeletonProps) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-2 ${className ?? ""}`}>
      <span className="h-5 w-5 shrink-0 border border-primary/60 bg-black/50" />
      {label && (
        <span className="font-sans text-xs font-semibold tracking-wider text-muted-strong uppercase">
          {label}
        </span>
      )}
    </span>
  );
}
