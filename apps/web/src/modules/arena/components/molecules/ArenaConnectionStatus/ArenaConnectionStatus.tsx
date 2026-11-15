import { LatencyBadge } from "@/modules/table/components/molecules";
import { CONNECTION_LABELS } from "@/modules/table/table.constants";

import { CONNECTION_STATUSES } from "./ArenaConnectionStatus.constants";
import type { ArenaConnectionStatusProps } from "./ArenaConnectionStatus.types";

/**
 * Connection dot and label. Every label is laid out in the same cell (only the current one visible), so the bar
 * keeps the width of the longest one and never shifts when the state changes.
 */
export function ArenaConnectionStatus({ status }: ArenaConnectionStatusProps) {
  return (
    <span className="flex shrink-0 items-center gap-2 font-sans text-sm text-muted-strong">
      <span className={`h-2 w-2 rounded-full ${CONNECTION_LABELS[status].dot}`} />
      <span className="grid max-md:sr-only" aria-live="polite">
        {CONNECTION_STATUSES.map((entry) => (
          <span key={entry} className={`[grid-area:1/1] ${entry === status ? "" : "invisible"}`}>
            {CONNECTION_LABELS[entry].label}
          </span>
        ))}
      </span>
      <LatencyBadge connected={status === "connected"} className="max-md:hidden" />
    </span>
  );
}
