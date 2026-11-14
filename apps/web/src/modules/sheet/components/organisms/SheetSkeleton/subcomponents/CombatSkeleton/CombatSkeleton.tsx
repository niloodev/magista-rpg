import {
  ATTRIBUTE_LABELS,
  BLOCK_KEYS,
  BLOCKS,
  OPENING_ACTIONS,
  blockOutcomes,
} from "@magista/shared";

import { BLOCK_ICONS, OPENING_PIPS } from "@/modules/sheet/sheet.constants";
import { Icon, Skeleton } from "@/shared/components/atoms";
import {
  ButtonSkeleton,
  Panel,
  SectionHeader,
  StepperSkeleton,
} from "@/shared/components/molecules";

import { BLOCK_EXPRESSION_SAMPLE, SAMPLE_SHEET } from "../../SheetSkeleton.constants";

/**
 * Placeholder of `CombatPanel`. Names and rules are fixed text, so they render for real;
 * outcomes keep the real wording invisible to reproduce the exact line wrapping.
 */
export function CombatSkeleton() {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Combate" icon="sword" as="p" />
      <p className="mb-3 font-sans text-sm font-bold tracking-wider text-muted-strong uppercase">
        Bloqueios
      </p>
      <div className="grid gap-3">
        {BLOCK_KEYS.map((key) => (
          <div key={key} className="flex flex-col border border-primary/35 bg-black/40">
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/50 bg-primary/10 text-accent-text">
                <Icon name={BLOCK_ICONS[key]} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans text-sm font-bold tracking-wider text-foreground uppercase">
                  {BLOCKS[key].name}
                </span>
                <span className="block font-sans text-sm text-muted-strong">
                  {ATTRIBUTE_LABELS[BLOCKS[key].attribute].short} · {BLOCKS[key].summary}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="font-sans text-xl font-semibold whitespace-nowrap">
                  <Skeleton shape="glyphs">{BLOCK_EXPRESSION_SAMPLE}</Skeleton>
                </span>
                <span className="flex items-center gap-1 font-sans text-xs font-semibold text-accent-text uppercase">
                  <Icon name="dices" size={14} /> Rolar
                </span>
              </span>
            </div>
            <ul className="space-y-1.5 p-4">
              {blockOutcomes(key, SAMPLE_SHEET).map((outcome) => (
                <li key={outcome} className="font-sans text-[13px] leading-snug">
                  <Skeleton shape="glyphs">{outcome}</Skeleton>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 mb-3 font-sans text-sm font-bold tracking-wider text-muted-strong uppercase">
        Aberturas
      </p>
      <div className="border border-teal-700/50 bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-700/40 bg-teal-900/10 p-4">
          <div>
            <p className="font-sans text-[13px] text-muted-strong">
              Ganhas com sucessos extremos nos bloqueios.
            </p>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: OPENING_PIPS }, (_, index) => (
                <span key={index} className="h-3 w-3 rotate-45 border border-teal-700" />
              ))}
            </div>
          </div>
          <StepperSkeleton size="lg" tone="teal" />
        </div>
        <ul className="px-4">
          {OPENING_ACTIONS.map((action) => (
            <li
              key={action.key}
              className="flex flex-wrap items-center gap-3 border-b border-white/5 py-3 last:border-b-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-teal-500/50 bg-teal-900/30 font-serif text-lg text-teal-200">
                {action.cost}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[15px] font-semibold text-foreground">{action.name}</p>
                <p className="font-sans text-[13px] leading-snug text-muted-strong">
                  {action.effect}
                </p>
              </div>
              <ButtonSkeleton
                label={action.rolls ? "Gastar e rolar" : "Gastar"}
                size="sm"
                variant="mystic"
                icon={action.rolls ? "dices" : "zap"}
                disabled={action.cost > 0}
              />
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
