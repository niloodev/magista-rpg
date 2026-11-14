import { SHEET_LIMITS, type AlignmentKey, type ClassKey } from "@magista/shared";

import { ALIGNMENT_GROUPS, CLASS_OPTIONS, NO_VALUE } from "@/modules/sheet/sheet.constants";
import { Input, Select } from "@/shared/components/atoms";
import { FormField, NumberField } from "@/shared/components/molecules";

import type { IdentityFormProps } from "./IdentityForm.types";

export function IdentityForm({
  formId,
  value,
  gmFieldsLocked,
  onChange,
  onSubmit,
}: IdentityFormProps) {
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-5 sm:grid-cols-[2fr_1fr]"
    >
      <FormField
        id={`${formId}-class`}
        label="Classe"
        hint={
          gmFieldsLocked
            ? "Somente o Mestre altera a classe."
            : "Define CA base, deslocamento, Dano Base e Dado de Vida."
        }
      >
        <Select
          id={`${formId}-class`}
          disabled={gmFieldsLocked}
          value={value.class}
          options={CLASS_OPTIONS}
          onValueChange={(next) => onChange({ class: next as ClassKey })}
        />
      </FormField>
      <FormField
        id={`${formId}-level`}
        label="Nível"
        hint={gmFieldsLocked ? "Somente o Mestre altera o nível." : "1 a 99"}
      >
        <NumberField
          id={`${formId}-level`}
          disabled={gmFieldsLocked}
          value={value.level}
          min={1}
          max={99}
          allowEmpty={false}
          onValueChange={(next) => onChange({ level: next ?? 1 })}
        />
      </FormField>
      <FormField id={`${formId}-alignment`} label="Alinhamento / Caminho" className="sm:col-span-2">
        <Select
          id={`${formId}-alignment`}
          value={value.alignment ?? NO_VALUE}
          options={[{ value: NO_VALUE, label: "Sem alinhamento" }]}
          groups={ALIGNMENT_GROUPS}
          onValueChange={(next) =>
            onChange({ alignment: next === NO_VALUE ? null : (next as AlignmentKey) })
          }
        />
      </FormField>
      <FormField
        id={`${formId}-variant`}
        label="Variação"
        hint="Ex.: Arcana do Aço"
        className="sm:col-span-2"
      >
        <Input
          id={`${formId}-variant`}
          value={value.alignmentNote}
          maxLength={SHEET_LIMITS.shortText}
          onChange={(event) => onChange({ alignmentNote: event.target.value })}
        />
      </FormField>
    </form>
  );
}
