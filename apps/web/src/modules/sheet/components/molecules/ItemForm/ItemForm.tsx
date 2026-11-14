import { SHEET_LIMITS } from "@magista/shared";

import { Input, Textarea } from "@/shared/components/atoms";
import { FormField, NumberField } from "@/shared/components/molecules";

import type { ItemFormProps } from "./ItemForm.types";

export function ItemForm({ formId, value, errors, onChange, onSubmit }: ItemFormProps) {
  const field = (name: string) => `${formId}-${name}`;
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-5 sm:grid-cols-3"
    >
      <FormField id={field("name")} label="Nome" error={errors.name} className="sm:col-span-3">
        <Input
          id={field("name")}

          value={value.name}
          maxLength={SHEET_LIMITS.shortText}
          invalid={Boolean(errors.name)}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </FormField>
      <FormField id={field("qty")} label="Quantidade">
        <NumberField
          id={field("qty")}
          value={value.quantity}
          min={0}
          max={SHEET_LIMITS.quantity}
          onValueChange={(next) => onChange({ quantity: next })}
        />
      </FormField>
      <FormField id={field("weight")} label="Peso (g)" hint="1000 g = 1 kg">
        <NumberField
          id={field("weight")}
          value={value.weightGrams}
          min={0}
          max={SHEET_LIMITS.weightGrams}
          allowEmpty={false}
          onValueChange={(next) => onChange({ weightGrams: next ?? 0 })}
        />
      </FormField>
      <FormField id={field("ca")} label="Bônus de CA" hint="Soma na CA do personagem">
        <NumberField
          id={field("ca")}
          min={-SHEET_LIMITS.armorBonus}
          max={SHEET_LIMITS.armorBonus}
          value={value.armorBonus}
          allowEmpty={false}
          onValueChange={(next) => onChange({ armorBonus: next ?? 0 })}
        />
      </FormField>
      <FormField id={field("desc")} label="Descrição" className="sm:col-span-3">
        <Textarea
          id={field("desc")}
          rows={6}
          value={value.description}
          maxLength={SHEET_LIMITS.longText}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </FormField>
    </form>
  );
}
