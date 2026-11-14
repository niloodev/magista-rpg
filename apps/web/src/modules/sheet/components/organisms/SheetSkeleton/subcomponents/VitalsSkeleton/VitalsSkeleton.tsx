import { RESOURCE_TONES, ROLL_BAR_TONES } from "@/modules/sheet/components/molecules";
import { Icon, Skeleton } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { RESOURCE_SKELETONS, ROLL_BAR_SKELETONS } from "../../SheetSkeleton.constants";
import { CheckboxSkeleton } from "../CheckboxSkeleton";

/**
 * Placeholder of `VitalsPanel`: resource bars, the four roll bars and the movement line.
 */
export function VitalsSkeleton() {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Principal" icon="shield" as="p" />
      <div className="space-y-5">
        {RESOURCE_SKELETONS.map(({ label, tone }) => {
          const styles = RESOURCE_TONES[tone];
          const field = `flex h-10 w-16 items-center justify-center border bg-black/50 text-base ${styles.input}`;
          return (
            <div key={label} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`flex items-center gap-2 ${styles.label}`}>
                  <Icon name={styles.icon} size={18} />
                  <span className="font-sans text-sm font-bold tracking-wider uppercase">
                    {label}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={field}>
                    <Skeleton shape="text" className="w-[1.4em]" />
                  </span>
                  <span className="text-muted-strong">/</span>
                  <span className={field}>
                    <Skeleton shape="text" className="w-[1.4em]" />
                  </span>
                </span>
              </div>
              <div className={`h-3 w-full border bg-black/60 ${styles.track}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {ROLL_BAR_SKELETONS.map(({ label, tone }) => {
          const styles = ROLL_BAR_TONES[tone];
          return (
            <div
              key={label}
              className={`relative flex min-h-14 w-full items-center justify-between gap-3 overflow-hidden border bg-black/40 py-2 pr-3 pl-5 ${styles.box}`}
            >
              <span className={`absolute top-0 left-0 h-full w-1 ${styles.bar}`} />
              <span className="flex min-w-0 flex-col">
                <span
                  className={`font-sans text-xs font-bold tracking-wider uppercase ${styles.label}`}
                >
                  {label}
                </span>
                <span className="font-sans text-lg">
                  <Skeleton shape="text" className="w-16" />
                </span>
              </span>
              <Icon name="dices" size={20} className={`shrink-0 ${styles.label}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 font-sans text-sm text-muted-strong">
        <span>
          Deslocamento: <Skeleton shape="text" className="w-6" /> · CA{" "}
          <Skeleton shape="text" className="w-4" /> (itens <Skeleton shape="text" className="w-4" />
          )
        </span>
        <CheckboxSkeleton label="Deslocamento bônus" />
      </div>
    </Panel>
  );
}
