import { z } from "zod";

import {
  ALIGNMENT_KEYS,
  ATTRIBUTE_KEYS,
  CLASS_KEYS,
  LEVEL_MAX,
  LEVEL_MIN,
  SKILL_KEYS,
} from "../../game/catalog/catalog.constants";

export const CHARACTER_SHEET_VERSION = 1;

export const SHEET_LIMITS = {
  shortText: 200,
  longText: 20000,
  resource: 999999,
  damageFlat: 9999,
  armorBonus: 999,
  weightGrams: 99999999,
  quantity: 999999,
} as const;

export const SHEET_TEXT_MAX = SHEET_LIMITS.longText;

const shortText = z.string().max(SHEET_LIMITS.shortText);

const longText = z.string().max(SHEET_TEXT_MAX);

const optionalInt = z.number().int().min(-9999).max(SHEET_LIMITS.resource).nullable();

export const attributeKeySchema = z.enum(ATTRIBUTE_KEYS);

export const skillKeySchema = z.enum(SKILL_KEYS);

export const classKeySchema = z.enum(CLASS_KEYS);

export const alignmentKeySchema = z.enum(ALIGNMENT_KEYS);

export const sheetAttributeSchema = z.object({
  value: optionalInt,
  proficient: z.boolean(),
});

export const sheetSkillSchema = z.object({
  proficient: z.boolean(),
});

export const resourceSchema = z.object({
  current: optionalInt,
  max: optionalInt,
});

export const abilitySchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText,
  attackAttribute: attributeKeySchema.nullable(),
  damageDice: shortText,
  damageFlat: z.number().int().min(-SHEET_LIMITS.damageFlat).max(SHEET_LIMITS.damageFlat),
  damageAttribute: attributeKeySchema.nullable(),
  addBaseDamage: z.boolean(),
  addProficiency: z.boolean(),
  description: longText,
});

export const inventoryItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText,
  quantity: z.number().int().min(0).max(SHEET_LIMITS.quantity).nullable(),
  armorBonus: z.number().int().min(-SHEET_LIMITS.armorBonus).max(SHEET_LIMITS.armorBonus),
  weightGrams: z.number().int().min(0).max(SHEET_LIMITS.weightGrams),
  description: longText,
});

export const traitSchema = z.object({
  id: z.string().min(1).max(64),
  name: shortText,
  description: longText,
});

const byKey = <K extends readonly [string, ...string[]], S extends z.ZodType>(keys: K, schema: S) =>
  z.object(Object.fromEntries(keys.map((key) => [key, schema])) as { [P in K[number]]: S });

export const characterSheetSchema = z.object({
  identity: z.object({
    class: classKeySchema,
    level: z.number().int().min(LEVEL_MIN).max(LEVEL_MAX),
    alignment: alignmentKeySchema.nullable(),
    alignmentNote: shortText,
  }),
  attributes: byKey(ATTRIBUTE_KEYS, sheetAttributeSchema),
  skills: byKey(SKILL_KEYS, sheetSkillSchema),
  resources: z.object({
    health: resourceSchema,
    sanity: resourceSchema,
  }),
  combat: z.object({
    openings: z.number().int().min(0).max(999),
    movementBonus: z.boolean(),
  }),
  abilities: z.array(abilitySchema).max(200),
  innerRealm: z.array(abilitySchema).max(200),
  inventory: z.object({
    maxWeightGrams: optionalInt,
    items: z.array(inventoryItemSchema).max(500),
  }),
  traits: z.array(traitSchema).max(200),
});

export const CHARACTER_NAME_MAX_LENGTH = 80;

export const characterSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  tokenUrl: z.string().nullable(),
  classKey: classKeySchema,
  level: z.number().int(),
  folderId: z.string().nullable(),
  position: z.number().int(),
  accountIds: z.array(z.string()),
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  tokenUrl: z.string().nullable(),
  sheet: characterSheetSchema,
  sheetVersion: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export const characterIdSchema = z.uuid();

export const updateSheetInputSchema = z.object({
  sheet: characterSheetSchema,
  baseUpdatedAt: z.string().min(1).max(64),
});

export const characterNameSchema = z.string().trim().min(1).max(CHARACTER_NAME_MAX_LENGTH);

export const createCharacterInputSchema = z.object({
  name: characterNameSchema,
  folderId: z.uuid().nullable().default(null),
});

export const renameCharacterInputSchema = z.object({ name: characterNameSchema });

export const setCharacterAccessInputSchema = z.object({
  accountIds: z.array(z.uuid()).max(200),
});
