import { HEXAGON } from "@/modules/table/table.constants";
import { flatModifier, naturalOutcome, toDieChips } from "@/modules/table/table.utils";

import { NATURAL_STYLES, TOTAL_STYLES } from "./RollRow.constants";
import type { RollRowProps } from "./RollRow.types";

export function RollRow({ row, primary }: RollRowProps) {
  const natural = naturalOutcome(row.outcome);
  const modifier = flatModifier(row.outcome);
  const totalStyle =
    natural === "critical"
      ? TOTAL_STYLES.critical
      : primary
        ? TOTAL_STYLES.primary
        : TOTAL_STYLES.secondary;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm text-foreground">
          {row.label} <span className="text-muted-strong">{row.outcome.expression}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {toDieChips(row.outcome).map((die, index) => (
            <span
              key={index}
              title={`d${die.sides}`}
              className={`flex h-7 min-w-7 items-center justify-center border px-1 font-sans text-sm ${die.natural ? NATURAL_STYLES[die.natural].chip : "border-white/15 bg-white/5 text-foreground"}`}
            >
              {die.value}
            </span>
          ))}
          {modifier !== 0 && (
            <span className="font-sans text-sm text-muted-strong">
              {modifier > 0 ? "+" : "-"} {Math.abs(modifier)}
            </span>
          )}
          {natural && (
            <span
              className={`ml-1 font-sans text-xs font-bold tracking-wider uppercase ${NATURAL_STYLES[natural].text}`}
            >
              {NATURAL_STYLES[natural].label}
            </span>
          )}
        </div>
      </div>
      <span
        className={`flex shrink-0 items-center justify-center font-serif ${totalStyle} ${natural === "critical" ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.75)]" : ""}`}
        style={{ clipPath: HEXAGON }}
      >
        {row.outcome.total}
      </span>
    </div>
  );
}
