import type { SkeletonRegionProps } from "./SkeletonRegion.types";

/**
 * Busy wrapper for skeleton placeholders. Only the label sits in the `status` live region, so screen readers
 * announce "loading" once instead of reading the placeholder; the fixed labels and links stay reachable.
 * With `announce={false}` it is a plain wrapper, for skeletons nested in another region.
 */
export function SkeletonRegion({
  label,
  className,
  announce = true,
  children,
}: SkeletonRegionProps) {
  if (!announce) return <div className={className}>{children}</div>;
  return (
    <div data-skeleton-region={label} aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  );
}
