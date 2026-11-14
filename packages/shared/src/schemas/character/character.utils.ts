import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../../game/catalog/catalog.constants";
import { CHARACTER_SHEET_VERSION, characterSheetSchema } from "./character.schemas";
import type { ICharacterSheet } from "./character.types";

/**
 * Builds an empty level 1 sheet with every attribute and skill present.
 */
export function createEmptySheet(): ICharacterSheet {
  return {
    identity: { class: "sem-classe", level: 1, alignment: null, alignmentNote: "" },
    attributes: Object.fromEntries(
      ATTRIBUTE_KEYS.map((key) => [key, { value: null, proficient: false }]),
    ) as ICharacterSheet["attributes"],
    skills: Object.fromEntries(
      SKILL_KEYS.map((key) => [key, { proficient: false }]),
    ) as ICharacterSheet["skills"],
    resources: {
      health: { current: null, max: null },
      sanity: { current: null, max: null },
    },
    combat: { openings: 0, movementBonus: false },
    abilities: [],
    innerRealm: [],
    inventory: { maxWeightGrams: null, items: [] },
    traits: [],
  };
}

/**
 * Upgrades a stored sheet to the current version. Version 0 was an empty placeholder.
 */
export function migrateSheet(raw: unknown, version: number): ICharacterSheet {
  if (version < 1) return createEmptySheet();
  if (version > CHARACTER_SHEET_VERSION)
    throw new Error(`Versão de ficha desconhecida: ${version}`);
  return characterSheetSchema.parse(raw);
}

/**
 * True when a current value goes above its maximum (Vida or Sanidade).
 */
export function exceedsResourceMax(sheet: ICharacterSheet): boolean {
  return [sheet.resources.health, sheet.resources.sanity].some(
    (resource) =>
      resource.max !== null && resource.current !== null && resource.current > resource.max,
  );
}

/**
 * Applies the GM-only fields (class, level and resource maximums) of a newer server sheet onto a local draft.
 */
export function mergeGmOnlyFields(
  local: ICharacterSheet,
  server: ICharacterSheet,
): ICharacterSheet {
  const merged = structuredClone(local);
  merged.identity.class = server.identity.class;
  merged.identity.level = server.identity.level;
  merged.resources.health.max = server.resources.health.max;
  merged.resources.sanity.max = server.resources.sanity.max;
  for (const key of ["health", "sanity"] as const) {
    const resource = merged.resources[key];
    if (resource.max !== null && resource.current !== null && resource.current > resource.max) {
      resource.current = resource.max;
    }
  }
  return merged;
}
