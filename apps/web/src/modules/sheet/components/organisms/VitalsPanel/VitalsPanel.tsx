import { ResourceBar, RollBar } from "@/modules/sheet/components/molecules";
import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { Checkbox } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

export function VitalsPanel({ sheet, derived, onEdit, onRoll, isGm }: SheetSectionProps) {
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader title="Principal" icon="shield" />
      <div className="space-y-5">
        <ResourceBar
          label="Vida"
          tone="health"
          maxLocked={!isGm}
          resource={sheet.resources.health}
          onChange={(resource) => onEdit((draft) => void (draft.resources.health = resource))}
        />
        <ResourceBar
          label="Sanidade"
          tone="sanity"
          maxLocked={!isGm}
          resource={sheet.resources.sanity}
          onChange={(resource) => onEdit((draft) => void (draft.resources.sanity = resource))}
        />
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <RollBar
          label="Iniciativa"
          expression={derived.initiative}
          onRoll={() => onRoll({ kind: "initiative" })}
        />
        <RollBar
          label="Dano Base"
          tone="teal"
          expression={derived.baseDamage}
          onRoll={() => onRoll({ kind: "baseDamage" })}
        />
        <RollBar
          label="Dado de Vida"
          expression={derived.lifeDie}
          onRoll={() => onRoll({ kind: "lifeDie" })}
        />
        <RollBar
          label="Dado de Sanidade"
          tone="teal"
          expression={derived.sanityDie}
          onRoll={() => onRoll({ kind: "sanityDie" })}
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 font-sans text-sm text-muted-strong">
        <span>
          Deslocamento: <span className="text-foreground">{derived.movementMeters}m</span> · CA{" "}
          {derived.armorClass} (itens +{derived.armorBonus})
        </span>
        <Checkbox
          checked={sheet.combat.movementBonus}
          onCheckedChange={(checked) =>
            onEdit((draft) => void (draft.combat.movementBonus = checked))
          }
          label="Deslocamento bônus"
        />
      </div>
    </Panel>
  );
}
