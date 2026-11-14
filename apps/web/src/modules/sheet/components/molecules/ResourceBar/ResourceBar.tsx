import { Icon } from "@/shared/components/atoms";
import { NumberField } from "@/shared/components/molecules";

import { RESOURCE_TONES } from "./ResourceBar.constants";
import type { ResourceBarProps } from "./ResourceBar.types";
import { resourcePercent } from "./ResourceBar.utils";

export function ResourceBar({
  label,
  tone,
  resource,
  onChange,
  maxLocked = false,
}: ResourceBarProps) {
  const styles = RESOURCE_TONES[tone];
  return (
    <div className="group space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`flex items-center gap-2 ${styles.label}`}>
          <Icon name={styles.icon} size={18} />
          <span className="font-sans text-sm font-bold tracking-wider uppercase">{label}</span>
        </span>
        <span className="flex items-center gap-2">
          <NumberField
            compact
            aria-label={`${label} atual`}
            min={0}
            max={resource.max ?? undefined}
            value={resource.current}
            onValueChange={(current) => onChange({ ...resource, current })}
            className={`h-10 w-16 bg-black/50 px-1 text-base ${styles.input}`}
          />
          <span className="text-muted-strong" aria-hidden="true">
            /
          </span>
          <NumberField
            compact
            aria-label={`${label} máxima`}
            disabled={maxLocked}
            title={maxLocked ? "Somente o Mestre altera o máximo (Subir de nível)" : undefined}
            value={resource.max}
            onValueChange={(max) => onChange({ ...resource, max })}
            className={`h-10 w-16 bg-black/50 px-1 text-base ${styles.input}`}
          />
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={resource.max ?? 0}
        aria-valuenow={resource.current ?? 0}
        className={`h-3 w-full overflow-hidden border bg-black/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${styles.track}`}
      >
        <div
          className={`relative h-full transition-[width] duration-500 ${styles.fill}`}
          style={{ width: `${resourcePercent(resource)}%` }}
        >
          <span className="absolute top-0 right-0 h-full w-4 bg-white/30 blur-[2px]" />
        </div>
      </div>
    </div>
  );
}
