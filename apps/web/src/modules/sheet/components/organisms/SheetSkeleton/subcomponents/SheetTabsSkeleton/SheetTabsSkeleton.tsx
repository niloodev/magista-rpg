import { SHEET_TABS } from "@/modules/sheet/sheet.constants";
import { Icon } from "@/shared/components/atoms";
import { tabVariantClasses } from "@/shared/components/molecules";

import type { SheetTabsSkeletonProps } from "./SheetTabsSkeleton.types";

/**
 * Inert copy of the sheet tab bar with the first tab selected (measured by the container and without "Rolagens" in a panel).
 */
export function SheetTabsSkeleton({ panel = false }: SheetTabsSkeletonProps) {
  const items = panel ? SHEET_TABS.filter((item) => item.key !== "rolagens") : SHEET_TABS;
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/10">
      {items.map((item, index) => (
        <div
          key={item.key}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 border-b-2 px-1 font-sans text-xs font-semibold ${tabVariantClasses(false, panel)} ${index === 0 ? "border-primary text-foreground" : "border-transparent text-muted-strong"} ${item.className ?? ""}`}
        >
          {item.icon && (
            <Icon name={item.icon} size={16} className={index === 0 ? "text-accent-text" : ""} />
          )}
          {item.label}
        </div>
      ))}
    </div>
  );
}
