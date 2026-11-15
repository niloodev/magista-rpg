"use client";

import { LATENCY_LABEL, LATENCY_PLACEHOLDER } from "@/modules/table/table.constants";
import { latencyText, latencyTone } from "@/modules/table/table.utils";

import { useLatencyBadge } from "./LatencyBadge.hook";
import type { LatencyBadgeProps } from "./LatencyBadge.types";

/**
 * Round trip to the server ("42 ms") next to the connection status, colored by speed. The width of the
 * placeholder is always reserved, so nothing shifts when the first measure arrives. Not announced (it changes
 * every few seconds); the value stays in the title and in the accessible text.
 */
export function LatencyBadge({ connected, className }: LatencyBadgeProps) {
  const latencyMs = useLatencyBadge(connected);
  const text = latencyText(latencyMs);
  return (
    <span
      title={text ? `${LATENCY_LABEL}: ${text}` : undefined}
      className={`grid font-sans text-xs tabular-nums ${className ?? ""}`}
    >
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {LATENCY_PLACEHOLDER}
      </span>
      {latencyMs !== null && (
        <span className={`[grid-area:1/1] text-left ${latencyTone(latencyMs)}`}>
          <span className="sr-only">{LATENCY_LABEL}: </span>
          {text}
        </span>
      )}
    </span>
  );
}
