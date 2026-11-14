import type { z } from "zod";

import {
  abilitySchema,
  inventoryItemSchema,
  parseDiceExpression,
  traitSchema,
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
 * Formats grams as kilograms with Brazilian decimals ("1,5 kg").
 */
export function formatWeight(grams: number): string {
  return `${(grams / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
}

/**
 * Formats a modifier with an explicit plus sign when positive.
 */
export function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Best image for small portraits: the round Roll20 token, falling back to the full art.
 */
export function portraitOf(character: {
  tokenUrl: string | null;
  avatarUrl: string | null;
}): string | null {
  return character.tokenUrl ?? character.avatarUrl;
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
