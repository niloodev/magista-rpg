import { z } from "zod";

import { resourceSchema, tokenStyleSchema } from "../character/character.schemas";

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

/** Most player accounts one token can list as allowed to see its status. */
export const ARENA_STATUS_VIEWERS_MAX = 100;

/** Largest damage or healing applied at once through "Aplicar mudança". */
export const ARENA_CHANGE_AMOUNT_MAX = 999;

export const ARENA_RESOURCE_KEYS = ["health", "sanity"] as const;

export const ARENA_CHANGE_KINDS = ["damage", "heal"] as const;

/** Animations a change can play; without a choice, the one of its kind and resource. */
export const ARENA_EFFECT_STYLES = ["strike", "fissure", "ember", "clarity"] as const;

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
  /** Small version of the map (256 px WebP) for the scene list; null for maps stored before thumbnails. */
  mapThumbUrl: z.string().nullable(),
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
  /** Small version of the token portrait (256 px WebP), or null. */
  imageThumbUrl: z.string().nullable(),
  /** Effective style: a character token follows its sheet (a figure without its image is a portrait). */
  style: tokenStyleSchema,
  /** Whether the name shows under the token on the map (the GM still sees a hidden one, faded). */
  showName: z.boolean(),
  x: z.number(),
  y: z.number(),
  size: z.number().int(),
  hidden: z.boolean(),
  position: z.number().int(),
});

/** Health and sanity of a token: the sheet resources for a character token, its own values for an NPC. */
export const arenaTokenStatusSchema = z.object({
  health: resourceSchema,
  sanity: resourceSchema,
});

/** Who may see a token status besides the GM and the accounts with access to its sheet. */
export const arenaTokenStatusAccessSchema = z.object({
  public: z.boolean(),
  accountIds: z.array(z.string()),
});

export const arenaViewSchema = z.object({
  activeSceneId: z.string().nullable(),
  scene: arenaSceneSchema.nullable(),
  tokens: z.array(arenaTokenSchema),
  controllableCharacterIds: z.array(z.string()),
  /** Status of each token the viewer may see, by token id. */
  statuses: z.record(z.string(), arenaTokenStatusSchema),
  /** Status permissions of every token, by token id (GM only). */
  statusAccess: z.record(z.string(), arenaTokenStatusAccessSchema).optional(),
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
    /** Style of an NPC token (a character token follows its sheet). */
    style: tokenStyleSchema.default("portrait"),
  })
  .refine((input) => input.characterId !== null || input.name !== undefined);

const tokenStatusPatchSchema = z
  .object({ health: resourceSchema.optional(), sanity: resourceSchema.optional() })
  .refine((status) => status.health !== undefined || status.sanity !== undefined);

const statusViewerIdsSchema = z
  .array(arenaIdSchema)
  .max(ARENA_STATUS_VIEWERS_MAX)
  .refine((ids) => new Set(ids).size === ids.length);

const tokenEditFields = {
  name: arenaNameSchema.optional(),
  size: arenaTokenSizeSchema.optional(),
  hidden: z.boolean().optional(),
  /** Own style (NPC tokens only). */
  style: tokenStyleSchema.optional(),
  showName: z.boolean().optional(),
  /** Own health and sanity (NPC tokens only; a character token follows its sheet). */
  status: tokenStatusPatchSchema.optional(),
  statusPublic: z.boolean().optional(),
  statusViewerIds: statusViewerIdsSchema.optional(),
};

const hasTokenEdit = (input: Record<string, unknown>) =>
  Object.entries(input).some(([key, value]) => key !== "id" && value !== undefined);

export const updateArenaTokenInputSchema = z.object(tokenEditFields).refine(hasTokenEdit);

const tokenPatchSchema = z.object({ id: arenaIdSchema, ...tokenEditFields }).refine(hasTokenEdit);

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

/** Pasted copies of tokens (from any scene) into a scene, each at its own point. */
export const copyArenaTokensInputSchema = z.object({
  tokens: z
    .array(z.object({ sourceId: arenaIdSchema, x: arenaCoordSchema, y: arenaCoordSchema }))
    .min(1)
    .max(ARENA_EDIT_BATCH_MAX),
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

/** Damage or healing applied to one or more tokens ("Aplicar mudança"); anyone who sees the tokens may apply it. */
export const applyArenaChangeInputSchema = z
  .object({
    tokenIds: z
      .array(arenaIdSchema)
      .min(1)
      .max(ARENA_EDIT_BATCH_MAX)
      .refine((ids) => new Set(ids).size === ids.length),
    kind: z.enum(ARENA_CHANGE_KINDS),
    resource: z.enum(ARENA_RESOURCE_KEYS),
    amount: z.number().int().min(1).max(ARENA_CHANGE_AMOUNT_MAX),
    /** Token that deals the change (its own animation plays before the hit); never one of the targets. */
    attackerTokenId: arenaIdSchema.optional(),
    /** Animation chosen by hand; without it, the automatic one. */
    effect: z.enum(ARENA_EFFECT_STYLES).optional(),
  })
  .refine((input) => !input.attackerTokenId || !input.tokenIds.includes(input.attackerTokenId));
