import {
  ATTRIBUTE_KEYS,
  SKILL_KEYS,
  characterSheetSchema,
  createEmptySheet,
  type ISheetAbility,
} from "@magista/shared";

import { PROFICIENT_VALUE, TEXT_LIMITS } from "./roll20.constants";
import { roll20ExportSchema } from "./roll20.schemas";
import type { IRoll20Character, Roll20Row } from "./roll20.types";
import {
  clip,
  toAlignmentKey,
  toAttributeKey,
  toAttributeMap,
  toClassKey,
  toInt,
  toRows,
} from "./roll20.utils";

function toAbility(row: Roll20Row, prefix: "hab" | "reino"): ISheetAbility {
  const field = (name: string) => row.fields[`${prefix}${name}`];
  return {
    id: row.id,
    name: clip(field("name"), TEXT_LIMITS.short),
    attackAttribute: toAttributeKey(field("modS")),
    damageDice: clip(field("dado"), TEXT_LIMITS.short).trim(),
    damageFlat: toInt(field("damage")) ?? 0,
    damageAttribute: toAttributeKey(field("hitmodS")),
    addBaseDamage: field("basedamage") === "base",
    addProficiency: field("proficiency") === "prof",
    description: clip(field("desc"), TEXT_LIMITS.long),
  };
}

/**
 * Converts a Roll20 character export (character.json) into a Magista sheet v1.
 * Derived values stored by Roll20 are ignored; they are recalculated by the shared rules.
 */
export function fromRoll20Export(input: unknown): IRoll20Character {
  const raw = roll20ExportSchema.parse(input);
  const map = toAttributeMap(raw);
  const sheet = createEmptySheet();
  const level = toInt(map.get("level")) ?? 1;

  sheet.identity = {
    class: toClassKey(map.get("class")),
    level: Math.min(99, Math.max(1, level)),
    alignment: toAlignmentKey(map.get("alignment")),
    alignmentNote: clip(map.get("variant"), TEXT_LIMITS.short),
  };
  for (const key of ATTRIBUTE_KEYS) {
    sheet.attributes[key] = {
      value: toInt(map.get(key)),
      proficient: map.get(`${key}PR`) === PROFICIENT_VALUE,
    };
  }
  for (const key of SKILL_KEYS) {
    sheet.skills[key] = { proficient: map.get(`${key}Prof`) === PROFICIENT_VALUE };
  }
  sheet.resources = {
    health: { current: toInt(map.get("hp")), max: toInt(map.get("maxHp")) },
    sanity: { current: toInt(map.get("sn")), max: toInt(map.get("maxSn")) },
  };
  sheet.combat = {
    openings: Math.max(0, toInt(map.get("aberturas")) ?? 0),
    movementBonus: map.get("deslocBonus") === "1",
  };
  sheet.abilities = toRows(map, "habs").map((row) => toAbility(row, "hab"));
  sheet.innerRealm = toRows(map, "reino").map((row) => toAbility(row, "reino"));
  sheet.inventory = {
    maxWeightGrams: toInt(map.get("pesoMaximo")),
    items: toRows(map, "inventory").map((row) => ({
      id: row.id,
      name: clip(row.fields.invname, TEXT_LIMITS.short),
      quantity: toInt(row.fields.invquant),
      armorBonus: toInt(row.fields.invca) ?? 0,
      weightGrams: Math.max(0, toInt(row.fields.invpeso) ?? 0),
      description: clip(row.fields.invdesc, TEXT_LIMITS.long),
    })),
  };
  sheet.traits = toRows(map, "tracos").map((row) => ({
    id: row.id,
    name: clip(row.fields.traconame, TEXT_LIMITS.short),
    description: clip(row.fields.tracodesc, TEXT_LIMITS.long),
  }));

  return { name: raw.name.trim(), sheet: characterSheetSchema.parse(sheet) };
}
