import type { ISheetInventoryItem } from "../../schemas/character/character.types";

/**
 * Joins expression parts into "a + b - c", skipping empty strings and zero numbers.
 */
export function joinExpression(parts: (string | number)[]): string {
  return parts.reduce<string>((expression, part) => {
    if (part === "" || part === 0) return expression;
    if (!expression) return String(part);
    if (typeof part === "number") return `${expression} ${part < 0 ? "-" : "+"} ${Math.abs(part)}`;
    return `${expression} + ${part}`;
  }, "");
}

/**
 * Formats a modifier with an explicit plus sign when positive.
 */
export function formatModifier(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Formats grams as kilograms with Brazilian decimals ("1,5 kg").
 */
export function formatWeight(grams: number): string {
  return `${(grams / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
}

/**
 * One-line summary of an inventory item: quantity (when set), weight and armor bonus (when not zero).
 */
export function itemSummary(item: ISheetInventoryItem): string {
  return [
    item.quantity !== null ? `Qtd. ${item.quantity}` : "",
    formatWeight(item.weightGrams),
    item.armorBonus !== 0 ? `CA ${formatModifier(item.armorBonus)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
