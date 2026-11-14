import { Button, Icon } from "@/shared/components/atoms";
import { ExpandableText } from "@/shared/components/molecules";

import type { TraitEntryProps } from "./TraitEntry.types";

export function TraitEntry({ trait, onEdit, onDelete }: TraitEntryProps) {
  const title = trait.name || "Sem nome";
  return (
    <div className="min-w-0 flex-1 border border-white/10 bg-black/40 p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg text-foreground">{title}</h3>
        <div className="flex gap-1">
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
      {trait.description && <ExpandableText text={trait.description} className="mt-2" />}
    </div>
  );
}
