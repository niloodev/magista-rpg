"use client";

import { AbilityForm } from "@/modules/sheet/components/molecules";
import { Button, Icon, Text } from "@/shared/components/atoms";
import { ConfirmDialog, EditorModal, Panel, SectionHeader } from "@/shared/components/molecules";
import { SortableList } from "@/shared/components/organisms";

import { useAbilitiesPanel } from "./AbilitiesPanel.hook";
import type { AbilitiesPanelProps } from "./AbilitiesPanel.types";
import { AbilityEntry } from "./subcomponents";

export function AbilitiesPanel(props: AbilitiesPanelProps) {
  const { sheet, derived, onRoll, list, title, entityLabel, icon, emptyLabel } = props;
  const { editor, openCreate, moveAbility, abilityName } = useAbilitiesPanel(props);
  const entries = sheet[list];
  const formId = `${list}-form`;
  return (
    <Panel variant="inner" className="p-5">
      <SectionHeader
        title={`${title} (${entries.length})`}
        icon={icon}
        aside={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="plus" size={14} />}
            onClick={openCreate}
          >
            Adicionar
          </Button>
        }
      />
      {entries.length === 0 ? (
        <Text variant="lore" className="py-4 text-center">
          {emptyLabel}
        </Text>
      ) : (
        <SortableList
          label={title}
          items={entries}
          itemName={abilityName}
          onMove={moveAbility}
          renderItem={(ability) => (
            <AbilityEntry
              ability={ability}
              derived={derived[list][ability.id]}
              onRoll={() => onRoll({ kind: "ability", list, id: ability.id })}
              onEdit={() => editor.openEdit(ability)}
              onDelete={() => editor.requestDelete(ability)}
            />
          )}
        />
      )}
      <EditorModal
        open={editor.draft !== null}
        mode={editor.mode}
        entityLabel={entityLabel}
        formId={formId}
        size="lg"
        onClose={editor.close}
        onDelete={editor.requestDeleteDraft}
      >
        {editor.draft && (
          <AbilityForm
            formId={formId}
            value={editor.draft}
            errors={editor.errors}
            onChange={editor.change}
            onSubmit={editor.save}
          />
        )}
      </EditorModal>
      <ConfirmDialog
        open={editor.deleting !== null}
        title={`Excluir ${entityLabel}?`}
        message={`"${editor.deleting?.name || "Sem nome"}" será removida da ficha. Isso não pode ser desfeito.`}
        confirmLabel="Excluir"
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </Panel>
  );
}
