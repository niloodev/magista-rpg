import { z } from "zod";

export const ARENA_NAME_MAX_LENGTH = 60;

export const ARENA_MAP_MAX_BYTES = 25 * 1024 * 1024;

export const ARENA_TOKEN_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const ARENA_IMAGE_FIELD = "file";

export const ARENA_COORD_MAX = 20_000;

export const ARENA_TOKEN_SIZE_MIN = 40;

export const ARENA_TOKEN_SIZE_MAX = 600;

export const ARENA_TOKEN_SIZE_DEFAULT = 140;

export const arenaIdSchema = z.uuid();

const arenaNameSchema = z.string().trim().min(1).max(ARENA_NAME_MAX_LENGTH);

const arenaCoordSchema = z.number().min(0).max(ARENA_COORD_MAX);

const arenaTokenSizeSchema = z.number().int().min(ARENA_TOKEN_SIZE_MIN).max(ARENA_TOKEN_SIZE_MAX);

export const arenaSceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  mapUrl: z.string().nullable(),
  position: z.number().int(),
});

export const arenaTokenSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  characterId: z.string().nullable(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  size: z.number().int(),
  hidden: z.boolean(),
  position: z.number().int(),
});

export const arenaViewSchema = z.object({
  activeSceneId: z.string().nullable(),
  scene: arenaSceneSchema.nullable(),
  tokens: z.array(arenaTokenSchema),
  controllableCharacterIds: z.array(z.string()),
});

export const createArenaSceneInputSchema = z.object({ name: arenaNameSchema });

export const renameArenaSceneInputSchema = z.object({ name: arenaNameSchema });

export const setActiveSceneInputSchema = z.object({ sceneId: arenaIdSchema.nullable() });

export const createArenaTokenInputSchema = z
  .object({
    characterId: arenaIdSchema.nullable().default(null),
    name: arenaNameSchema.optional(),
    x: arenaCoordSchema.default(0),
    y: arenaCoordSchema.default(0),
    size: arenaTokenSizeSchema.default(ARENA_TOKEN_SIZE_DEFAULT),
    hidden: z.boolean().default(false),
  })
  .refine((input) => input.characterId !== null || input.name !== undefined);

export const updateArenaTokenInputSchema = z
  .object({
    name: arenaNameSchema.optional(),
    size: arenaTokenSizeSchema.optional(),
    hidden: z.boolean().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined));

export const moveArenaTokenInputSchema = z.object({
  tokenId: arenaIdSchema,
  x: arenaCoordSchema,
  y: arenaCoordSchema,
});
