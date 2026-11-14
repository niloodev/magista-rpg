"use client";

import { Icon } from "@/shared/components/atoms";

import { useTabs } from "./Tabs.hook";
import type { TabsProps } from "./Tabs.types";
import { tabIds } from "./Tabs.utils";

export function Tabs<K extends string>(props: TabsProps<K>) {
  const { items, active, onChange, label, idPrefix } = props;
  const { onKeyDown } = useTabs(props);
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-white/10"
    >
      {items.map((item) => {
        const selected = item.key === active;
        const ids = tabIds(idPrefix, item.key);
        return (
          <button
            key={item.key}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={onKeyDown}
            className={`flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-b-2 px-1 font-sans text-xs font-semibold transition-colors sm:min-h-12 sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:text-sm sm:tracking-wider sm:uppercase ${selected ? "border-primary text-foreground" : "border-transparent text-muted-strong hover:border-white/20 hover:text-foreground"} ${item.className ?? ""}`}
          >
            {item.icon && (
              <Icon name={item.icon} size={16} className={selected ? "text-accent-text" : ""} />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
