import type { AttributeKey, SkillKey } from "../catalog/catalog.types";
import type { IFeatureBonusTerm } from "../features/features.types";

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
  d20Bonus: number;
  /** Where the d20 bonus comes from (one term per special feature). */
  d20BonusTerms: IFeatureBonusTerm[];
  /** Skill value used by the test roll: skill plus the d20 bonus. */
  skillTests: Record<SkillKey, number>;
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
