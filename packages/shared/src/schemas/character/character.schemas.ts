import { z } from "zod";

import { sheetEffectsSchema } from "../arena/arena.effects";
import {
  ALIGNMENT_KEYS,
  ATTRIBUTE_KEYS,
  CLASS_KEYS,
  LEVEL_MAX,
  LEVEL_MIN,
  SKILL_KEYS,
} from "../../game/catalog/catalog.constants";
import { characterFeaturesSchema } from "../../game/features/features.schemas";

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
  /** Animations this sheet uses on "Aplicar mudança" when it attacks with the effect on "Automático". */
  effects: sheetEffectsSchema.default({}),
});

export const CHARACTER_NAME_MAX_LENGTH = 80;

/**
 * How a token is drawn on the Arena: a round portrait (avatar) or an isometric figure, a transparent image of
 * any aspect ratio drawn whole, without the circle.
 */
export const TOKEN_STYLES = ["portrait", "figure"] as const;

export const tokenStyleSchema = z.enum(TOKEN_STYLES);

export const characterSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  artUrl: z.string().nullable(),
  /** Small versions (256 px WebP) for portraits; null for images stored before thumbnails existed. */
  avatarThumbUrl: z.string().nullable(),
  artThumbUrl: z.string().nullable(),
  /** Isometric token image (transparent, any aspect ratio) and its thumbnail. */
  figureUrl: z.string().nullable(),
  figureThumbUrl: z.string().nullable(),
  /** Token style chosen for the Arena (a figure without its image falls back to the portrait). */
  tokenStyle: tokenStyleSchema,
  /** Whether the tokens of this sheet show the name on the map (new sheets start hidden, for mobs). */
  showTokenName: z.boolean(),
  classKey: classKeySchema,
  level: z.number().int(),
  folderId: z.string().nullable(),
  position: z.number().int(),
  accountIds: z.array(z.string()),
  features: characterFeaturesSchema,
  /** Animations the sheet prefers on "Aplicar mudança" (shown as the resolved "Automático"). */
  effects: sheetEffectsSchema,
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  artUrl: z.string().nullable(),
  /** Small versions (256 px WebP) for portraits; null for images stored before thumbnails existed. */
  avatarThumbUrl: z.string().nullable(),
  artThumbUrl: z.string().nullable(),
  /** Isometric token image (transparent, any aspect ratio) and its thumbnail. */
  figureUrl: z.string().nullable(),
  figureThumbUrl: z.string().nullable(),
  /** Token style chosen for the Arena (a figure without its image falls back to the portrait). */
  tokenStyle: tokenStyleSchema,
  /** Whether the tokens of this sheet show the name on the map (new sheets start hidden, for mobs). */
  showTokenName: z.boolean(),
  sheet: characterSheetSchema,
  sheetVersion: z.number().int().nonnegative(),
  features: characterFeaturesSchema,
  updatedAt: z.string(),
});

export const characterIdSchema = z.uuid();

export const CHARACTER_IMAGE_KINDS = ["avatar", "art", "figure"] as const;

export const CHARACTER_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/** Largest side of an avatar or artwork, read from the header before decoding it. */
export const CHARACTER_IMAGE_MAX_SIDE = 8192;

export const CHARACTER_IMAGE_FIELD = "file";

export const CHARACTER_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const characterImageKindSchema = z.enum(CHARACTER_IMAGE_KINDS);

export const characterImagesSchema = z.object({
  id: z.string(),
  avatarUrl: z.string().nullable(),
  artUrl: z.string().nullable(),
  /** Small versions (256 px WebP) for portraits; null for images stored before thumbnails existed. */
  avatarThumbUrl: z.string().nullable(),
  artThumbUrl: z.string().nullable(),
  /** Isometric token image (transparent, any aspect ratio) and its thumbnail. */
  figureUrl: z.string().nullable(),
  figureThumbUrl: z.string().nullable(),
  /** Token style chosen for the Arena (a figure without its image falls back to the portrait). */
  tokenStyle: tokenStyleSchema,
  /** Whether the tokens of this sheet show the name on the map (new sheets start hidden, for mobs). */
  showTokenName: z.boolean(),
});

export const updateSheetInputSchema = z.object({
  sheet: characterSheetSchema,
  baseUpdatedAt: z.string().min(1).max(64),
});

export const characterNameSchema = z.string().trim().min(1).max(CHARACTER_NAME_MAX_LENGTH);

export const createCharacterInputSchema = z.object({
  name: characterNameSchema,
  folderId: z.uuid().nullable().default(null),
});

/** Token defaults of a sheet: its style and whether the name shows on the map (applied to its tokens too). */
export const setTokenSettingsInputSchema = z
  .object({ style: tokenStyleSchema.optional(), showName: z.boolean().optional() })
  .refine((input) => input.style !== undefined || input.showName !== undefined);

export const renameCharacterInputSchema = z.object({ name: characterNameSchema });

export const setCharacterAccessInputSchema = z.object({
  accountIds: z.array(z.uuid()).max(200),
});
