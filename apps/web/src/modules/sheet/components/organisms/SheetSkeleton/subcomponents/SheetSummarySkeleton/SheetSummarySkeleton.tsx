import { RESOURCE_TONES } from "@/modules/sheet/components/molecules";
import { Icon, Skeleton } from "@/shared/components/atoms";
import { AvatarSkeleton, StepperSkeleton } from "@/shared/components/molecules";

import { RESOURCE_SKELETONS, SUMMARY_STAT_LABELS } from "../../SheetSkeleton.constants";

/**
 * Placeholder of `SheetSummaryBar`: quick resources, stats and openings.
 */
export function SheetSummarySkeleton() {
  return (
    <div className="z-30 -mx-4 border-b border-primary/30 bg-void-900/90 px-4 py-3 backdrop-blur-md md:sticky md:top-0">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="hidden items-center gap-3 lg:flex">
          <AvatarSkeleton size="sm" />
          <span className="font-serif text-lg">
            <Skeleton shape="text" className="w-32" />
          </span>
        </div>
        {RESOURCE_SKELETONS.map(({ label, tone }) => {
          const styles = RESOURCE_TONES[tone];
          return (
            <div key={label} className="flex min-w-[220px] flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex items-center gap-1.5 font-sans text-xs font-bold tracking-wider uppercase ${styles.label}`}
                >
                  <Icon name={styles.icon} size={14} />
                  {label}
                  <span className="font-normal text-muted-strong normal-case">máx.</span>
                  <Skeleton shape="text" className="w-4" />
                </span>
                <StepperSkeleton tone={tone === "health" ? "ruby" : "teal"} />
              </div>
              <div className={`h-2 w-full border bg-black/60 ${styles.track}`} />
            </div>
          );
        })}
        <div className="flex items-center gap-2">
          {SUMMARY_STAT_LABELS.map((label) => (
            <div
              key={label}
              className="flex min-w-14 flex-col items-center border border-white/10 bg-black/40 px-3 py-1.5"
            >
              <span className="font-sans text-[11px] font-bold tracking-wider text-accent-text uppercase">
                {label}
              </span>
              <span className="font-serif text-xl leading-tight">
                <Skeleton shape="text" className="w-6" />
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-teal-700/50 bg-black/40 px-2 py-1">
          <span className="font-sans text-[11px] font-bold tracking-wider text-teal-300 uppercase">
            Aberturas
          </span>
          <StepperSkeleton tone="teal" />
        </div>
      </div>
    </div>
  );
}
