import { ARENA_DOCK_TEXTS } from "@/modules/arena/arena.constants";
import { Icon } from "@/shared/components/atoms";

import type { ArenaDockHintProps } from "./ArenaDockHint.types";

/**
 * Highlight over a side panel while a sheet window is dragged on it: releasing there docks the sheet as a tab.
 */
export function ArenaDockHint({ side, width }: ArenaDockHintProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width, [side]: 0 }}
      className="pointer-events-none fixed top-14 bottom-0 z-[50] flex items-center justify-center border-2 border-dashed border-ruby-400/80 bg-primary/15 p-4 animate-pop-in lite:animate-none"
    >
      <span className="flex items-center gap-2 border border-primary/60 bg-void-900/95 px-4 py-2 font-serif text-sm tracking-wide text-foreground">
        <Icon
          name={side === "left" ? "panel-left-open" : "panel-right-open"}
          size={16}
          className="text-accent-text"
        />
        {ARENA_DOCK_TEXTS.hint}
      </span>
    </div>
  );
}
