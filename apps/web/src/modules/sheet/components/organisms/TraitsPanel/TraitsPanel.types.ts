import type { ReactNode } from "react";

import type { SheetSectionProps } from "@/modules/sheet/sheet.types";

export interface TraitsPanelProps extends SheetSectionProps {
  /** Traits granted from outside the sheet (special features), shown above the own ones. */
  addon?: ReactNode;
}
