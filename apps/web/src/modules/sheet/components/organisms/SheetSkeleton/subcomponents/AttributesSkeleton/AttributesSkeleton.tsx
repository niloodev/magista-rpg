import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@magista/shared";

import { Icon, Skeleton } from "@/shared/components/atoms";
import { Panel, SectionHeader, StepperSkeleton } from "@/shared/components/molecules";

import { CheckboxSkeleton } from "../CheckboxSkeleton";

/**
 * Placeholder of `AttributesPanel` with cards in the exact `AttributeCard` box.
 */
export function AttributesSkeleton() {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Atributos" icon="sparkles" as="p" />
      <p className="mb-4 font-sans text-sm text-muted-strong">
        Clique no modificador para rolar o teste.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        {ATTRIBUTE_KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-col items-center gap-3 border border-primary/30 bg-black/50 p-3 shadow-[var(--magista-glow-card)]"
          >
            <div className="flex w-full flex-col items-center gap-1 py-1">
              <span className="flex items-center gap-1.5 font-sans text-sm font-bold tracking-[0.15em] text-accent-text uppercase">
                <Icon name="dices" size={16} />
                {ATTRIBUTE_LABELS[key].short}
              </span>
              <span className="font-serif text-5xl leading-none font-light">
                <Skeleton shape="text" className="w-[1.3em]" />
              </span>
            </div>
            <StepperSkeleton />
            <div className="flex w-full items-center justify-between gap-2 border-t border-white/10 pt-2">
              <span className="font-sans text-sm text-muted-strong">
                CD{" "}
                <span className="font-serif text-lg">
                  <Skeleton shape="text" className="w-[1.2em]" />
                </span>
              </span>
              <CheckboxSkeleton label="Prof." />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
