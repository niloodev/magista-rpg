import type { z } from "zod";

import {
  abilitySchema,
  characterPortrait,
  formatModifier,
  inventoryItemSchema,
  parseDiceExpression,
  traitSchema,
  type ICharacterImageUrls,
  type IFeatureBonusTerm,
  type ISheetAbility,
  type ISheetInventoryItem,
  type ISheetTrait,
} from "@magista/shared";

const OUT_OF_RANGE = "Valor fora do limite permitido.";

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Creates a blank ability or inner realm manifestation.
 */
export function createAbility(): ISheetAbility {
  return {
    id: newId(),
    name: "",
    attackAttribute: null,
    damageDice: "",
    damageFlat: 0,
    damageAttribute: null,
    addBaseDamage: false,
    addProficiency: false,
    description: "",
  };
}

/**
 * Creates a blank inventory item.
 */
export function createItem(): ISheetInventoryItem {
  return { id: newId(), name: "", quantity: 1, armorBonus: 0, weightGrams: 0, description: "" };
}

/**
 * Creates a blank trait.
 */
export function createTrait(): ISheetTrait {
  return { id: newId(), name: "", description: "" };
}

/**
 * Formats a modifier with an explicit plus sign when positive.
 */
export function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Best image for small portraits: the AVATAR (round face token), falling back to the full ART.
 */
export function portraitOf(character: ICharacterImageUrls): string | null {
  return characterPortrait(character);
}

type FieldErrors<T> = Partial<Record<keyof T, string>>;

function schemaErrors<T>(schema: z.ZodType<T>, value: T): FieldErrors<T> {
  const result = schema.safeParse(value);
  if (result.success) return {};
  const errors: FieldErrors<T> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof T | undefined;
    if (field !== undefined && !errors[field]) errors[field] = OUT_OF_RANGE;
  }
  return errors;
}

/**
 * Validates an ability or inner realm manifestation with the shared schema, plus required name and dice syntax.
 */
export function validateAbility(ability: ISheetAbility): FieldErrors<ISheetAbility> {
  const errors = schemaErrors(abilitySchema, ability);
  if (!ability.name.trim()) errors.name = "Dê um nome para a habilidade.";
  if (ability.damageDice.trim() && !parseDiceExpression(ability.damageDice)) {
    errors.damageDice = "Dado inválido. Use algo como 1d12 ou 2d6 + 1d4.";
  }
  return errors;
}

/**
 * Validates an inventory item with the shared schema, plus required name.
 */
export function validateItem(item: ISheetInventoryItem): FieldErrors<ISheetInventoryItem> {
  const errors = schemaErrors(inventoryItemSchema, item);
  if (!item.name.trim()) errors.name = "Dê um nome para o item.";
  return errors;
}

/**
 * Validates a trait with the shared schema, plus required name.
 */
export function validateTrait(trait: ISheetTrait): FieldErrors<ISheetTrait> {
  const errors = schemaErrors(traitSchema, trait);
  if (!trait.name.trim()) errors.name = "Dê um nome para o traço.";
  return errors;
}

/**
 * Note telling which special feature bonuses the shown test values already include
 * (" Valores já somam +2 da Marca."), or an empty string when there are none.
 */
export function bonusNote(terms: readonly IFeatureBonusTerm[]): string {
  if (terms.length === 0) return "";
  const parts = terms.map((term) => `${formatModifier(term.value)} da ${term.label}`);
  const joined =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
  return ` Valores já somam ${joined}.`;
}
