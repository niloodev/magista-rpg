import { z } from "zod";

export const ARENA_NAME_MAX_LENGTH = 60;

/** Message of the API when a scene does not exist (the web uses it to drop a preview of a deleted scene). */
export const ARENA_SCENE_NOT_FOUND_MESSAGE = "Cena não encontrada.";

export const ARENA_MAP_MAX_BYTES = 60 * 1024 * 1024;

export const ARENA_TOKEN_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const ARENA_IMAGE_FIELD = "file";

export const ARENA_COORD_MAX = 20_000;

/** Pixels of one board unit (the Roll20 grid square), the unit the GM uses to size a board. */
export const ARENA_UNIT_PX = 70;

/** Smallest board side in pixels (5 units). */
export const ARENA_BOARD_MIN_SIDE = 350;

/** Largest board side in pixels (every coordinate fits in it). */
export const ARENA_BOARD_MAX_SIDE = ARENA_COORD_MAX;

/** Side of a board without a map or a chosen size (25 units, as a new Roll20 page). */
export const ARENA_BOARD_DEFAULT_SIDE = 25 * ARENA_UNIT_PX;

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
  /** Board size in world pixels (the map image is stretched to it, always keeping its aspect ratio). */
  width: z.number(),
  height: z.number(),
  /** Natural pixel size of the map image, or null without a map. */
  mapWidth: z.number().int().nullable(),
  mapHeight: z.number().int().nullable(),
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

const arenaBoardSideSchema = z.number().min(ARENA_BOARD_MIN_SIDE).max(ARENA_BOARD_MAX_SIDE);

/** New board size in pixels; with a map only the width counts (the height follows the map's aspect ratio). */
export const arenaBoardInputSchema = z.object({
  width: arenaBoardSideSchema,
  height: arenaBoardSideSchema.optional(),
});

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
