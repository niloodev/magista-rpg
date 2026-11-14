import { SHEET_TABS } from "@/modules/sheet/sheet.constants";
import { Icon } from "@/shared/components/atoms";

/**
 * Inert copy of the sheet tab bar with the first tab selected.
 */
export function SheetTabsSkeleton() {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/10">
      {SHEET_TABS.map((item, index) => (
        <div
          key={item.key}
          className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-b-2 px-1 font-sans text-xs font-semibold sm:min-h-12 sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:text-sm sm:tracking-wider sm:uppercase ${index === 0 ? "border-primary text-foreground" : "border-transparent text-muted-strong"} ${item.className ?? ""}`}
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
