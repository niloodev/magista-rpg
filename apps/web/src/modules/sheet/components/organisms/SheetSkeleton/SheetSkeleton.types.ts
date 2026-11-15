import type { SheetVariant } from "@/modules/sheet/sheet.types";

export interface SheetSkeletonProps {
  gm?: boolean;
  variant?: SheetVariant;
  /** Whether the sheet has full art, when known (overrides the device hint, which follows the sheet page). */
  art?: boolean;
}
