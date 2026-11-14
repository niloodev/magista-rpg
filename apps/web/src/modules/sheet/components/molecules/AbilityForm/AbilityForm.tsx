import { SHEET_LIMITS } from "@magista/shared";

import { ATTRIBUTE_OPTIONS, NO_VALUE } from "@/modules/sheet/sheet.constants";
import { Checkbox, Input, Select, Textarea } from "@/shared/components/atoms";
import { FormField, NumberField } from "@/shared/components/molecules";

import type { AbilityFormProps } from "./AbilityForm.types";
import { toAttribute } from "./AbilityForm.utils";

export function AbilityForm({ formId, value, errors, onChange, onSubmit }: AbilityFormProps) {
  const field = (name: string) => `${formId}-${name}`;
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-5 sm:grid-cols-2"
    >
      <FormField id={field("name")} label="Nome" error={errors.name} className="sm:col-span-2">
        <Input
          id={field("name")}

          value={value.name}
          maxLength={SHEET_LIMITS.shortText}
          invalid={Boolean(errors.name)}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </FormField>
      <fieldset className="grid gap-4 border border-white/10 p-4 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 font-sans text-xs font-semibold tracking-[0.12em] text-accent-text uppercase">
          Ataque
        </legend>
        <FormField id={field("attack")} label="Atributo de ataque">
          <Select
            id={field("attack")}
            value={value.attackAttribute ?? NO_VALUE}
            options={ATTRIBUTE_OPTIONS}
            onValueChange={(next) => onChange({ attackAttribute: toAttribute(next) })}
          />
        </FormField>
        <div className="flex items-end pb-1">
          <Checkbox
            checked={value.addProficiency}
            onCheckedChange={(checked) => onChange({ addProficiency: checked })}
            label="Somar proficiência"
          />
        </div>
      </fieldset>
      <fieldset className="grid gap-4 border border-white/10 p-4 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 font-sans text-xs font-semibold tracking-[0.12em] text-teal-300 uppercase">
          Dano
        </legend>
        <FormField
          id={field("dice")}
          label="Dado de dano"
          error={errors.damageDice}
          hint="Ex.: 1d12, 2d6 + 1d4. Deixe vazio se não causa dano."
        >
          <Input
            id={field("dice")}
            value={value.damageDice}
            maxLength={SHEET_LIMITS.shortText}
            invalid={Boolean(errors.damageDice)}
            onChange={(event) => onChange({ damageDice: event.target.value })}
          />
        </FormField>
        <FormField id={field("flat")} label="Dano fixo">
          <NumberField
            id={field("flat")}
            min={-SHEET_LIMITS.damageFlat}
            max={SHEET_LIMITS.damageFlat}
            value={value.damageFlat}
            allowEmpty={false}
            onValueChange={(next) => onChange({ damageFlat: next ?? 0 })}
          />
        </FormField>
        <FormField id={field("damage")} label="Atributo de dano">
          <Select
            id={field("damage")}
            value={value.damageAttribute ?? NO_VALUE}
            options={ATTRIBUTE_OPTIONS}
            onValueChange={(next) => onChange({ damageAttribute: toAttribute(next) })}
          />
        </FormField>
        <div className="flex items-end pb-1">
          <Checkbox
            checked={value.addBaseDamage}
            onCheckedChange={(checked) => onChange({ addBaseDamage: checked })}
            label="Somar Dano Base"
          />
        </div>
      </fieldset>
      <FormField
        id={field("desc")}
        label="Descrição"
        hint="Use **texto** para negrito e uma linha em branco entre parágrafos."
        className="sm:col-span-2"
      >
        <Textarea
          id={field("desc")}
          rows={7}
          value={value.description}
          maxLength={SHEET_LIMITS.longText}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </FormField>
    </form>
  );
}
