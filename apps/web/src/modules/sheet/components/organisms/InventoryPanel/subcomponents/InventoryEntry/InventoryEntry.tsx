import { itemSummary } from "@magista/shared";

import { PingButton } from "@/modules/sheet/components/atoms";
import { Button, Icon } from "@/shared/components/atoms";
import { ExpandableText } from "@/shared/components/molecules";

import type { InventoryEntryProps } from "./InventoryEntry.types";

export function InventoryEntry({ item, pinged, onPing, onEdit, onDelete }: InventoryEntryProps) {
  const title = item.name || "Sem nome";
  return (
    <div className="min-w-0 flex-1 border border-white/10 bg-black/40 p-4 transition-colors hover:border-primary/40">
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 bg-primary/10 text-accent-text"
        >
          <Icon name={item.armorBonus ? "shield" : "package-search"} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-base font-semibold text-foreground">{title}</h3>
          <p className="font-sans text-sm text-muted-strong">{itemSummary(item)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <PingButton title={title} sent={pinged} onPing={onPing} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            icon={<Icon name="pen-line" size={14} />}
            aria-label={`Editar ${title}`}
          >
            <span className="max-sm:sr-only">Editar</span>
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
      {item.description && (
        <ExpandableText text={item.description} collapsedHeight={80} className="mt-3 pl-13" />
      )}
    </div>
  );
}
