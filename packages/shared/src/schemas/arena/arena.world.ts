import { z } from "zod";

/**
 * Board of the world map, in world pixels: the proportion of the fixed image (4096 x 2983), which the renderer
 * stretches over it, so a sharper image never moves the party or the fog.
 */
export const WORLD_MAP_BOARD = { width: 2000, height: 1457 } as const;

/** Side of a fog cell in world pixels: the fog is a grid of covered or clear cells. */
export const WORLD_FOG_CELL = 10;

export const WORLD_FOG_COLUMNS = Math.ceil(WORLD_MAP_BOARD.width / WORLD_FOG_CELL);

export const WORLD_FOG_ROWS = Math.ceil(WORLD_MAP_BOARD.height / WORLD_FOG_CELL);

/** Bytes of the fog bitset (one bit per cell, row by row). */
export const WORLD_FOG_BYTES = Math.ceil((WORLD_FOG_COLUMNS * WORLD_FOG_ROWS) / 8);

/** Length of the fog bitset in base64. */
export const WORLD_FOG_BASE64_LENGTH = Math.ceil(WORLD_FOG_BYTES / 3) * 4;

export const WORLD_FOG_BRUSH_MIN = 10;

export const WORLD_FOG_BRUSH_MAX = 400;

/** Most points of one brush batch. */
export const WORLD_FOG_POINTS_MAX = 64;

/** Diameter of the party token on the world map, in world pixels. */
export const WORLD_PARTY_SIZE = 44;

/** Id of the party pseudo-token (the party is not an arena token). */
export const WORLD_PARTY_ID = "party";

export const WORLD_FOG_MODES = ["hide", "reveal"] as const;

const worldXSchema = z.number().min(0).max(WORLD_MAP_BOARD.width);

const worldYSchema = z.number().min(0).max(WORLD_MAP_BOARD.height);

export const worldPointSchema = z.object({ x: worldXSchema, y: worldYSchema });

export const worldFogModeSchema = z.enum(WORLD_FOG_MODES);

/** The fog bitset in base64. */
export const worldFogSchema = z.string().length(WORLD_FOG_BASE64_LENGTH);

/** The world map as one viewer sees it: the party position and the fog. */
export const arenaWorldSchema = z.object({
  party: worldPointSchema,
  fog: worldFogSchema,
  fogVersion: z.number().int().min(0),
});

export const setWorldLiveInputSchema = z.object({ live: z.boolean() });

export const moveWorldPartyInputSchema = worldPointSchema;

const worldFogStrokeSchema = z.object({
  mode: worldFogModeSchema,
  radius: z.number().min(WORLD_FOG_BRUSH_MIN).max(WORLD_FOG_BRUSH_MAX),
  points: z.array(worldPointSchema).min(1).max(WORLD_FOG_POINTS_MAX),
});

const worldFogFillSchema = z.object({
  mode: worldFogModeSchema,
  fill: z.literal(true),
});

/** A brush batch over the fog, or covering or clearing the whole map. */
export const paintWorldFogInputSchema = z.union([worldFogFillSchema, worldFogStrokeSchema]);

/** The fog after a change, sent to everyone who sees the world map. */
export const arenaWorldFogEventSchema = z.object({
  fog: worldFogSchema,
  fogVersion: z.number().int().min(0),
});
