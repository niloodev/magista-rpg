"use client";

import { ItemForm } from "@/modules/sheet/components/molecules";
import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import { formatWeight } from "@/modules/sheet/sheet.utils";
import { Button, Icon, Text } from "@/shared/components/atoms";
import {
  ConfirmDialog,
  EditorModal,
  FormField,
  NumberField,
  Panel,
  SectionHeader,
} from "@/shared/components/molecules";
import { SortableList } from "@/shared/components/organisms";

import { useInventoryPanel } from "./InventoryPanel.hook";
import { InventoryEntry } from "./subcomponents";

export function InventoryPanel(props: SheetSectionProps) {
  const { sheet, derived } = props;
  const { items, maxWeightGrams } = sheet.inventory;
  const { editor, openCreate, current, percent, overweight, moveItem, itemName, setMaxWeight } =
    useInventoryPanel(props);
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader
        title={`Inventário (${items.length})`}
        icon="package-search"
        aside={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="plus" size={14} />}
            onClick={openCreate}
          >
            Adicionar item
          </Button>
        }
      />
      <div className="mb-5 grid gap-4 border border-white/10 bg-black/30 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="mb-2 flex flex-wrap justify-between gap-2 font-sans text-sm">
            <span className="text-muted-strong">
              Carga:{" "}
              <span className={`font-semibold ${overweight ? "text-error" : "text-foreground"}`}>
                {formatWeight(current)}
              </span>
              {maxWeightGrams !== null && <span> de {formatWeight(maxWeightGrams)}</span>}
            </span>
            <span className="text-muted-strong">
              Bônus de CA dos itens: <span className="text-foreground">+{derived.armorBonus}</span>
            </span>
          </div>
          <div
            role="meter"
            aria-label="Carga do inventário"
            aria-valuemin={0}
            aria-valuemax={maxWeightGrams ?? 0}
            aria-valuenow={current}
            className="h-3 overflow-hidden border border-primary/30 bg-black/60"
          >
            <div
              className={`h-full transition-[width] duration-500 ${overweight ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          {overweight && (
            <p className="mt-2 font-sans text-sm text-error">Acima da carga máxima.</p>
          )}
        </div>
        <FormField id="inventory-max" label="Carga máxima (g)">
          <NumberField
            id="inventory-max"
            value={maxWeightGrams}
            min={0}
            onValueChange={setMaxWeight}
            className="w-36"
          />
        </FormField>
      </div>
      {items.length === 0 ? (
        <Text variant="lore" className="py-4 text-center">
          Mochila vazia.
        </Text>
      ) : (
        <SortableList
          label="Itens do inventário"
          items={items}
          itemName={itemName}
          onMove={moveItem}
          renderItem={(item) => (
            <InventoryEntry
              item={item}
              onEdit={() => editor.openEdit(item)}
              onDelete={() => editor.requestDelete(item)}
            />
          )}
        />
      )}
      <EditorModal
        open={editor.draft !== null}
        mode={editor.mode}
        entityLabel="item"
        formId="inventory-form"
        onClose={editor.close}
        onDelete={editor.requestDeleteDraft}
      >
        {editor.draft && (
          <ItemForm
            formId="inventory-form"
            value={editor.draft}
            errors={editor.errors}
            onChange={editor.change}
            onSubmit={editor.save}
          />
        )}
      </EditorModal>
      <ConfirmDialog
        open={editor.deleting !== null}
        title="Excluir item?"
        message={`"${editor.deleting?.name || "Sem nome"}" será removido do inventário. Isso não pode ser desfeito.`}
        confirmLabel="Excluir"
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </Panel>
  );
}
