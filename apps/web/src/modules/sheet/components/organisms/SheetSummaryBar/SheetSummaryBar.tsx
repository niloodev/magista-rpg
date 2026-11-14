import { toMediaUrl } from "@/core/services/http";
import { QuickResource, SummaryStat } from "@/modules/sheet/components/molecules";
import { formatSigned, portraitOf } from "@/modules/sheet/sheet.utils";
import { Avatar } from "@/shared/components/atoms";
import { Stepper } from "@/shared/components/molecules";

import type { SheetSummaryBarProps } from "./SheetSummaryBar.types";

export function SheetSummaryBar({ character, derived, onEdit }: SheetSummaryBarProps) {
  const { sheet } = character;
  return (
    <section
      aria-label="Resumo do personagem"
      className="z-30 -mx-4 border-b border-primary/30 bg-void-900/90 px-4 py-3 backdrop-blur-md md:sticky md:top-0"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="hidden items-center gap-3 lg:flex">
          <Avatar
            src={toMediaUrl(portraitOf(character))}
            name={character.name}
            size="sm"
            decorative
          />
          <span className="font-serif text-lg text-foreground">{character.name}</span>
        </div>
        <QuickResource
          label="Vida"
          tone="health"
          resource={sheet.resources.health}
          onCurrentChange={(current) =>
            onEdit((draft) => void (draft.resources.health.current = current))
          }
        />
        <QuickResource
          label="Sanidade"
          tone="sanity"
          resource={sheet.resources.sanity}
          onCurrentChange={(current) =>
            onEdit((draft) => void (draft.resources.sanity.current = current))
          }
        />
        <div className="flex items-center gap-2">
          <SummaryStat
            label="CA"
            value={derived.armorClass}
            title={`Classe de Armadura: ${derived.armorClass}`}
          />
          <SummaryStat
            label="BP"
            value={formatSigned(derived.proficiency)}
            title={`Bônus de Proficiência: ${formatSigned(derived.proficiency)}`}
          />
          <SummaryStat
            label="Desl."
            value={`${derived.movementMeters}m`}
            title={`Deslocamento: ${derived.movementMeters} metros`}
          />
        </div>
        <div className="flex items-center gap-2 border border-teal-700/50 bg-black/40 px-2 py-1">
          <span className="font-sans text-[11px] font-bold tracking-wider text-teal-300 uppercase">
            Aberturas
          </span>
          <Stepper
            tone="teal"
            label="Aberturas"
            value={sheet.combat.openings}
            min={0}
            max={999}
            onValueChange={(value) =>
              onEdit((draft) => void (draft.combat.openings = Math.max(0, value ?? 0)))
            }
          />
        </div>
      </div>
    </section>
  );
}
