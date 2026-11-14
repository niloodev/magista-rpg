import { Icon } from "@/shared/components/atoms";

import { DropIndicator } from "../DropIndicator";
import type { FolderRowProps } from "./FolderRow.types";

export function FolderRow({
  name,
  summary,
  expanded,
  groupId,
  onToggle,
  actions,
  handle,
  dropPosition = null,
  dimmed = false,
}: FolderRowProps) {
  const inside = dropPosition === "inside";
  return (
    <div
      className={`group relative mt-3 flex min-h-14 items-center gap-2 border py-2 pr-2 pl-2 transition-[border-color,background-color,box-shadow,opacity] duration-200 before:absolute before:-top-[11px] before:-left-px before:h-[11px] before:w-24 before:border before:border-b-0 before:transition-colors before:[clip-path:polygon(0_0,82%_0,100%_100%,0_100%)] focus-within:z-20 ${
        inside
          ? "border-teal-300 bg-teal-900/60 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.6)] before:border-teal-300 before:bg-teal-900/80"
          : expanded
            ? "border-teal-500/50 bg-teal-900/35 before:border-teal-500/50 before:bg-teal-900/50"
            : "border-teal-500/25 bg-black/40 before:border-teal-500/25 before:bg-teal-900/40 hover:border-teal-500/50 hover:bg-teal-900/20"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      {dropPosition && dropPosition !== "inside" && <DropIndicator position={dropPosition} />}
      {handle}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={groupId}
        className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
      >
        <Icon
          name="chevron-right"
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-teal-400 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`}
        />
        <Icon
          name={expanded || inside ? "folder-open" : "folder"}
          size={22}
          aria-hidden="true"
          className="shrink-0 text-teal-400"
        />
        <span className="min-w-0">
          <span className="block truncate font-serif text-base tracking-wide text-foreground">
            {name}
          </span>
          <span className="block font-sans text-xs text-muted-strong">{summary}</span>
        </span>
      </button>
      {actions && <div className="relative z-10">{actions}</div>}
    </div>
  );
}
