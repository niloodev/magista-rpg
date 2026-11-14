import type { AttributeKey, SkillKey } from "../catalog/catalog.types";

export interface IDerivedAttribute {
  value: number;
  modifier: number;
  dc: number;
}

export interface IDerivedAbility {
  attack: string;
  damage: string;
}

export interface IDerivedSheet {
  proficiency: number;
  attributes: Record<AttributeKey, IDerivedAttribute>;
  skills: Record<SkillKey, number>;
  armorBonus: number;
  armorClass: number;
  movementMeters: number;
  baseDamage: string;
  lifeDie: string;
  sanityDie: string;
  initiative: string;
  currentWeightGrams: number;
  abilities: Record<string, IDerivedAbility>;
  innerRealm: Record<string, IDerivedAbility>;
}
