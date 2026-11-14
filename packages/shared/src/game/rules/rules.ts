import type { ICharacterSheet, ISheetAbility } from "../../schemas/character/character.types";
import {
  ATTRIBUTE_KEYS,
  BASE_DAMAGE_SCALING_PER_LEVEL,
  CLASSES,
  DEFAULT_ATTRIBUTE_VALUE,
  PROFICIENCY_MAX,
  PROFICIENCY_MIN,
  SKILLS,
} from "../catalog/catalog.constants";
import type { AttributeKey, ClassKey } from "../catalog/catalog.types";
import { ATTRIBUTE_DC_BASE, BASE_DAMAGE_PATTERN, D20, SANITY_DIE_BASE } from "./rules.constants";
import type { IDerivedAbility, IDerivedAttribute, IDerivedSheet } from "./rules.types";
import { joinExpression } from "./rules.utils";

/**
 * Attribute modifier, truncated toward zero exactly like the Roll20 sheet (9 gives 0).
 */
export function attributeModifier(value: number | null): number {
  return Math.trunc(((value ?? DEFAULT_ATTRIBUTE_VALUE) - 10) / 2) || 0;
}

/**
 * Proficiency bonus for a level: ceil(level / 2) clamped to 1..10.
 */
export function proficiencyForLevel(level: number): number {
  return Math.min(PROFICIENCY_MAX, Math.max(PROFICIENCY_MIN, Math.ceil(Math.max(1, level) / 2)));
}

/**
 * Base damage dice for a class and level, adding +1 per level above the 12-level table.
 */
export function baseDamageFor(classKey: ClassKey, level: number): string {
  const table = CLASSES[classKey].baseDamage;
  const safeLevel = Math.max(1, level);
  if (safeLevel <= table.length) return table[safeLevel - 1] ?? table[0];
  const last = table[table.length - 1] ?? table[0];
  const match = BASE_DAMAGE_PATTERN.exec(last);
  if (!match) return last;
  const bonus = Number(match[2] ?? 0) + (safeLevel - table.length) * BASE_DAMAGE_SCALING_PER_LEVEL;
  return `${match[1]} + ${bonus}`;
}

function deriveAttributes(
  sheet: ICharacterSheet,
  proficiency: number,
): Record<AttributeKey, IDerivedAttribute> {
  const entries = ATTRIBUTE_KEYS.map((key) => {
    const { value, proficient } = sheet.attributes[key];
    const modifier = attributeModifier(value);
    const dc = ATTRIBUTE_DC_BASE + modifier + (proficient ? proficiency : 0);
    return [key, { value: value ?? DEFAULT_ATTRIBUTE_VALUE, modifier, dc }];
  });
  return Object.fromEntries(entries) as Record<AttributeKey, IDerivedAttribute>;
}

function deriveAbility(
  ability: ISheetAbility,
  attributes: Record<AttributeKey, IDerivedAttribute>,
  proficiency: number,
  baseDamage: string,
): IDerivedAbility {
  const attackMod = ability.attackAttribute ? attributes[ability.attackAttribute].modifier : 0;
  const damageMod = ability.damageAttribute ? attributes[ability.damageAttribute].modifier : 0;
  return {
    attack: joinExpression([D20, attackMod, ability.addProficiency ? proficiency : 0]),
    damage:
      joinExpression([
        ability.damageDice.trim(),
        ability.addBaseDamage ? baseDamage : "",
        ability.damageFlat,
        damageMod,
      ]) || "0",
  };
}

/**
 * Computes every derived value of a sheet (modifiers, DCs, skills, CA, dice strings, weights).
 */
export function deriveSheet(sheet: ICharacterSheet): IDerivedSheet {
  const { identity } = sheet;
  const classInfo = CLASSES[identity.class];
  const proficiency = proficiencyForLevel(identity.level);
  const attributes = deriveAttributes(sheet, proficiency);
  const baseDamage = baseDamageFor(identity.class, identity.level);
  const armorBonus = sheet.inventory.items.reduce((sum, item) => sum + item.armorBonus, 0);
  const skills = Object.fromEntries(
    SKILLS.map((skill) => [
      skill.key,
      attributes[skill.attribute].modifier + (sheet.skills[skill.key].proficient ? proficiency : 0),
    ]),
  ) as IDerivedSheet["skills"];
  const mapAbilities = (list: ISheetAbility[]) =>
    Object.fromEntries(
      list.map((ability) => [
        ability.id,
        deriveAbility(ability, attributes, proficiency, baseDamage),
      ]),
    );

  return {
    proficiency,
    attributes,
    skills,
    armorBonus,
    armorClass: classInfo.armorClass + armorBonus,
    movementMeters: classInfo.movement[sheet.combat.movementBonus ? 1 : 0],
    baseDamage,
    lifeDie: joinExpression([classInfo.lifeDie, attributes.con.modifier]),
    sanityDie: joinExpression([SANITY_DIE_BASE, attributes.sab.modifier]),
    initiative: joinExpression([D20, attributes.des.modifier]),
    currentWeightGrams: sheet.inventory.items.reduce((sum, item) => sum + item.weightGrams, 0),
    abilities: mapAbilities(sheet.abilities),
    innerRealm: mapAbilities(sheet.innerRealm),
  };
}
