import { Icon } from "@/shared/components/atoms";
import { Stepper } from "@/shared/components/molecules";

import { RESOURCE_TONES, resourcePercent } from "@/modules/sheet/components/molecules/ResourceBar";
import type { QuickResourceProps } from "./QuickResource.types";

export function QuickResource({ label, tone, resource, onCurrentChange }: QuickResourceProps) {
  const styles = RESOURCE_TONES[tone];
  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider uppercase ${styles.label}`}
        >
          <Icon name={styles.icon} size={14} />
          {label}
          <span className="font-normal text-muted-strong normal-case">
            máx. {resource.max ?? "-"}
          </span>
        </span>
        <Stepper
          value={resource.current}
          min={0}
          max={resource.max ?? undefined}
          onValueChange={onCurrentChange}
          tone={tone === "health" ? "ruby" : "teal"}
          label={`${label} atual`}
        />
      </div>
      <div
        aria-hidden="true"
        className={`h-2 w-full overflow-hidden border bg-black/60 ${styles.track}`}
      >
        <div
          className={`h-full transition-[width] duration-500 ${styles.fill}`}
          style={{ width: `${resourcePercent(resource)}%` }}
        />
      </div>
    </div>
  );
}
