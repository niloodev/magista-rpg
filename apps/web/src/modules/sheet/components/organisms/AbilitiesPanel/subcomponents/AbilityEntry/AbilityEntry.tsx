import { Button, Icon } from "@/shared/components/atoms";
import { ExpandableText } from "@/shared/components/molecules";

import type { AbilityEntryProps } from "./AbilityEntry.types";

export function AbilityEntry({ ability, derived, onRoll, onEdit, onDelete }: AbilityEntryProps) {
  const title = ability.name || "Sem nome";
  return (
    <div className="min-w-0 flex-1 border border-white/10 bg-black/40 p-4 transition-colors hover:border-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg text-foreground">{title}</h3>
          {derived && (
            <div className="mt-2 flex flex-wrap gap-2 font-sans text-sm">
              <span className="border border-primary/30 bg-primary/10 px-2 py-1 text-foreground">
                <span className="font-semibold text-accent-text">Ataque</span> {derived.attack}
              </span>
              <span className="border border-teal-600/40 bg-teal-900/20 px-2 py-1 text-foreground">
                <span className="font-semibold text-teal-300">Dano</span> {derived.damage}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="primary"
            size="sm"
            onClick={onRoll}
            icon={<Icon name="dices" size={14} />}
            aria-label={`Rolar ${title}`}
          >
            Rolar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            icon={<Icon name="pen-line" size={14} />}
            aria-label={`Editar ${title}`}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            icon={<Icon name="trash-2" size={14} />}
            aria-label={`Excluir ${title}`}
            className="hover:text-error"
          />
        </div>
      </div>
      {ability.description && <ExpandableText text={ability.description} className="mt-3" />}
    </div>
  );
}
