import { z } from "zod";

export const ARENA_NAME_MAX_LENGTH = 60;

/** Message of the API when a scene does not exist (the web uses it to drop a preview of a deleted scene). */
export const ARENA_SCENE_NOT_FOUND_MESSAGE = "Cena não encontrada.";

export const ARENA_MAP_MAX_BYTES = 25 * 1024 * 1024;

export const ARENA_TOKEN_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const ARENA_IMAGE_FIELD = "file";

export const ARENA_COORD_MAX = 20_000;

export const ARENA_TOKEN_SIZE_MIN = 40;

export const ARENA_TOKEN_SIZE_MAX = 600;

export const ARENA_TOKEN_SIZE_DEFAULT = 140;

export const ARENA_MOVE_BATCH_MAX = 50;

export const ARENA_EDIT_BATCH_MAX = 100;

export const arenaIdSchema = z.uuid();

const arenaNameSchema = z.string().trim().min(1).max(ARENA_NAME_MAX_LENGTH);

const arenaCoordSchema = z.number().min(0).max(ARENA_COORD_MAX);

const arenaTokenSizeSchema = z.number().int().min(ARENA_TOKEN_SIZE_MIN).max(ARENA_TOKEN_SIZE_MAX);

export const ARENA_MAP_MAX_SIDE = 16_384;

export const ARENA_MAP_MAX_PIXELS = 64_000_000;

export const ARENA_TOKEN_IMAGE_MAX_SIDE = 4096;

export const ARENA_LIBRARY_ITEM_KINDS = ["folder", "scene"] as const;

export const arenaSceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string().nullable(),
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

export const createArenaSceneInputSchema = z.object({
  name: arenaNameSchema,
  folderId: arenaIdSchema.nullable().default(null),
});

export const arenaFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  position: z.number().int(),
});

export const arenaLibrarySchema = z.object({
  scenes: z.array(arenaSceneSchema),
  folders: z.array(arenaFolderSchema),
});

export const createArenaFolderInputSchema = z.object({
  name: arenaNameSchema,
  parentId: arenaIdSchema.nullable().default(null),
});

export const renameArenaFolderInputSchema = z.object({ name: arenaNameSchema });

export const moveArenaLibraryItemInputSchema = z.object({
  kind: z.enum(ARENA_LIBRARY_ITEM_KINDS),
  id: arenaIdSchema,
  parentId: arenaIdSchema.nullable(),
  index: z.number().int().min(0).max(10_000),
});

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

const tokenPatchSchema = z
  .object({
    id: arenaIdSchema,
    name: arenaNameSchema.optional(),
    size: arenaTokenSizeSchema.optional(),
    hidden: z.boolean().optional(),
  })
  .refine((input) => [input.name, input.size, input.hidden].some((value) => value !== undefined));

export const updateArenaTokensInputSchema = z.object({
  updates: z
    .array(tokenPatchSchema)
    .min(1)
    .max(ARENA_EDIT_BATCH_MAX)
    .refine((updates) => new Set(updates.map((update) => update.id)).size === updates.length),
});

export const deleteArenaTokensInputSchema = z.object({
  ids: z
    .array(arenaIdSchema)
    .min(1)
    .max(ARENA_EDIT_BATCH_MAX)
    .refine((ids) => new Set(ids).size === ids.length),
});

export const moveArenaTokenInputSchema = z.object({
  tokenId: arenaIdSchema,
  x: arenaCoordSchema,
  y: arenaCoordSchema,
});

export const moveArenaTokensInputSchema = z.object({
  moves: z
    .array(moveArenaTokenInputSchema)
    .min(1)
    .max(ARENA_MOVE_BATCH_MAX)
    .refine((moves) => new Set(moves.map((move) => move.tokenId)).size === moves.length),
});
