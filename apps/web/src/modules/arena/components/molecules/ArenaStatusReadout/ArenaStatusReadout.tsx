import { ARENA_RESOURCE_KEYS } from "@magista/shared";

import { resourcePercent } from "@/modules/sheet/components/molecules";
import { Icon } from "@/shared/components/atoms";

import { READOUT_TONES } from "./ArenaStatusReadout.constants";
import type { ArenaStatusReadoutProps } from "./ArenaStatusReadout.types";

/**
 * Health and sanity of the selected token in the selection bar: icon, a small bar and the values, in the tones
 * of the sheet; screen readers get the text version.
 */
export function ArenaStatusReadout({ status, label }: ArenaStatusReadoutProps) {
  return (
    <span role="img" aria-label={label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {ARENA_RESOURCE_KEYS.map((key) => {
        const resource = status[key];
        if (resource.max === null && resource.current === null) return null;
        const tone = READOUT_TONES[key];
        return (
          <span key={key} className={`flex items-center gap-1.5 ${tone.text}`}>
            <Icon name={tone.icon} size={14} />
            <span className={`h-2 w-14 overflow-hidden border bg-black/60 ${tone.track}`}>
              <span
                className={`block h-full transition-[width] duration-500 lite:transition-none ${tone.fill}`}
                style={{ width: `${resourcePercent(resource)}%` }}
              />
            </span>
            <span className="font-serif text-sm tabular-nums">
              {resource.current ?? resource.max ?? 0}
              <span className="text-muted-strong">/{resource.max ?? "?"}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
