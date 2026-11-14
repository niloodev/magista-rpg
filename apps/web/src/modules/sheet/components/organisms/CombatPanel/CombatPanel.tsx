"use client";

import { OPENING_ACTIONS } from "@magista/shared";

import { BlockCard, OpeningAction } from "@/modules/sheet/components/molecules";
import { BLOCK_ICONS, OPENING_PIPS } from "@/modules/sheet/sheet.constants";
import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { Panel, SectionHeader, Stepper } from "@/shared/components/molecules";

import { useCombatPanel } from "./CombatPanel.hook";

export function CombatPanel(props: SheetSectionProps) {
  const { blocks, openings, spend, setOpenings } = useCombatPanel(props);
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Combate" icon="sword" />
      <h3 className="mb-3 font-sans text-sm font-bold tracking-wider text-muted-strong uppercase">
        Bloqueios
      </h3>
      <div className="grid gap-3">
        {blocks.map(({ key, ...block }) => (
          <BlockCard key={key} icon={BLOCK_ICONS[key]} {...block} />
        ))}
      </div>

      <h3 className="mt-6 mb-3 font-sans text-sm font-bold tracking-wider text-muted-strong uppercase">
        Aberturas
      </h3>
      <div className="border border-teal-700/50 bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-700/40 bg-teal-900/10 p-4">
          <div>
            <p className="font-sans text-[13px] text-muted-strong">
              Ganhas com sucessos extremos nos bloqueios.
            </p>
            <div aria-hidden="true" className="mt-2 flex gap-1.5">
              {Array.from({ length: OPENING_PIPS }, (_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 rotate-45 border transition-colors ${index < openings ? "border-teal-300 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]" : "border-teal-700 bg-transparent"}`}
                />
              ))}
              {openings > OPENING_PIPS && (
                <span className="ml-1 font-sans text-xs text-teal-300">
                  +{openings - OPENING_PIPS}
                </span>
              )}
            </div>
          </div>
          <Stepper
            size="lg"
            tone="teal"
            label="Aberturas"
            value={openings}
            min={0}
            max={999}
            onValueChange={setOpenings}
          />
        </div>
        <ul className="px-4">
          {OPENING_ACTIONS.map((action) => (
            <OpeningAction
              key={action.key}
              name={action.name}
              effect={action.effect}
              cost={action.cost}
              rolls={action.rolls}
              available={openings >= action.cost}
              onSpend={() => spend(action)}
            />
          ))}
        </ul>
      </div>
    </Panel>
  );
}
