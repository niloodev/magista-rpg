import { SHEET_LIMITS } from "@magista/shared";

import { Input, Textarea } from "@/shared/components/atoms";
import { FormField } from "@/shared/components/molecules";

import type { TraitFormProps } from "./TraitForm.types";

export function TraitForm({ formId, value, errors, onChange, onSubmit }: TraitFormProps) {
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-5"
    >
      <FormField id={`${formId}-name`} label="Nome" error={errors.name}>
        <Input
          id={`${formId}-name`}

          value={value.name}
          maxLength={SHEET_LIMITS.shortText}
          invalid={Boolean(errors.name)}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </FormField>
      <FormField
        id={`${formId}-desc`}
        label="Descrição"
        hint="Use **texto** para negrito e uma linha em branco entre parágrafos."
      >
        <Textarea
          id={`${formId}-desc`}
          rows={10}
          value={value.description}
          maxLength={SHEET_LIMITS.longText}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </FormField>
    </form>
  );
}
