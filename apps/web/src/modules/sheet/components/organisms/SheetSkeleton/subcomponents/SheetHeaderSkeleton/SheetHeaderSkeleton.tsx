import { Skeleton, Text } from "@/shared/components/atoms";
import { AvatarSkeleton, ButtonSkeleton, Panel } from "@/shared/components/molecules";

import { HEADER_FACT_LABELS } from "../../SheetSkeleton.constants";
import type { SheetHeaderSkeletonProps } from "./SheetHeaderSkeleton.types";

/**
 * Placeholder of `SheetHeader`: token, art button (when the last sheet had art), name, the real action
 * buttons for the role, and the identity facts.
 */
export function SheetHeaderSkeleton({ gm, art }: SheetHeaderSkeletonProps) {
  return (
    <Panel variant="primary" className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
      <div className="flex flex-col items-center gap-2 self-center">
        <AvatarSkeleton size="xl" />
        {art && <ButtonSkeleton label="Ver arte completa" size="sm" variant="ghost" icon="image" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Text variant="micro">Ficha do jogador</Text>
            <p className="font-serif text-4xl md:text-5xl">
              <Skeleton shape="text" className="w-80 max-w-full" />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonSkeleton label="Editar identidade" size="sm" icon="pen-line" />
            <ButtonSkeleton
              label="Subir de nível"
              size="sm"
              variant="mystic"
              icon={gm ? "chevrons-up" : "lock"}
              disabled={!gm}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {HEADER_FACT_LABELS.map((label) => (
            <div key={label} className="border border-white/10 bg-black/30 px-4 py-3">
              <p className="font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
                {label}
              </p>
              <p className="mt-1 font-sans text-base">
                <Skeleton shape="text" className="w-24 max-w-full" />
              </p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
