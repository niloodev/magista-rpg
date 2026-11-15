"use client";

import { useApp } from "@/modules/shell/store";

/**
 * The last round trip measured to the server, read here so only the badge re-renders on each ping.
 */
export function useLatencyBadge(connected: boolean): number | null {
  const latencyMs = useApp((state) => state.table.latencyMs);
  return connected ? latencyMs : null;
}
