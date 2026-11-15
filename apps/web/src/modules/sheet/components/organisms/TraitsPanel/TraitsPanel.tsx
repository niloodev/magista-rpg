"use client";

import { TraitForm } from "@/modules/sheet/components/molecules";
import { Button, Icon, Text } from "@/shared/components/atoms";
import { ConfirmDialog, EditorModal, Panel, SectionHeader } from "@/shared/components/molecules";
import { SortableList } from "@/shared/components/organisms";

import { useTraitsPanel } from "./TraitsPanel.hook";
import type { TraitsPanelProps } from "./TraitsPanel.types";
import { TraitEntry } from "./subcomponents";

export function TraitsPanel({ sheet, onEdit, onPing, pingedId, addon }: TraitsPanelProps) {
  const { editor, openCreate, moveTrait, traitName } = useTraitsPanel(onEdit);
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader
        title={`Traços e Características (${sheet.traits.length})`}
        icon="type"
        aside={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="plus" size={14} />}
            onClick={openCreate}
          >
            Adicionar traço
          </Button>
        }
      />
      {addon}
      {sheet.traits.length === 0 ? (
        <Text variant="lore" className="py-4 text-center">
          Nenhum traço registrado.
        </Text>
      ) : (
        <SortableList
          label="Traços"
          items={sheet.traits}
          itemName={traitName}
          onMove={moveTrait}
          renderItem={(trait) => (
            <TraitEntry
              trait={trait}
              pinged={pingedId === trait.id}
              onPing={() => onPing({ kind: "trait", id: trait.id })}
              onEdit={() => editor.openEdit(trait)}
              onDelete={() => editor.requestDelete(trait)}
            />
          )}
        />
      )}
      <EditorModal
        open={editor.draft !== null}
        mode={editor.mode}
        entityLabel="traço"
        formId="trait-form"
        size="lg"
        onClose={editor.close}
        onDelete={editor.requestDeleteDraft}
      >
        {editor.draft && (
          <TraitForm
            formId="trait-form"
            value={editor.draft}
            errors={editor.errors}
            onChange={editor.change}
            onSubmit={editor.save}
          />
        )}
      </EditorModal>
      <ConfirmDialog
        open={editor.deleting !== null}
        title="Excluir traço?"
        message={`"${editor.deleting?.name || "Sem nome"}" será removido da ficha. Isso não pode ser desfeito.`}
        confirmLabel="Excluir"
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </Panel>
  );
}
