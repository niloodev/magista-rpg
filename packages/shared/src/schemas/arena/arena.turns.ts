import { z } from "zod";

export const ARENA_INITIATIVE_MIN = -99;

export const ARENA_INITIATIVE_MAX = 999;

export const ARENA_INITIATIVE_BONUS_MIN = -20;

export const ARENA_INITIATIVE_BONUS_MAX = 20;

/** Most tokens one turn order command may touch at once (add, remove or roll). */
export const ARENA_TURN_BATCH_MAX = 100;

const turnIdSchema = z.uuid();

const initiativeSchema = z.number().int().min(ARENA_INITIATIVE_MIN).max(ARENA_INITIATIVE_MAX);

export const arenaInitiativeBonusSchema = z
  .number()
  .int()
  .min(ARENA_INITIATIVE_BONUS_MIN)
  .max(ARENA_INITIATIVE_BONUS_MAX);

export const arenaTurnEntrySchema = z.object({
  tokenId: z.string(),
  /** Rolled or typed initiative; null when the token joined without a value. */
  initiative: z.number().int().nullable(),
});

/** Turn order of a scene: entries in order, whose turn it is and the round. */
export const arenaTurnOrderSchema = z.object({
  sceneId: z.string(),
  round: z.number().int(),
  currentTokenId: z.string().nullable(),
  entries: z.array(arenaTurnEntrySchema),
});

const turnTokenIdsSchema = z
  .array(turnIdSchema)
  .min(1)
  .max(ARENA_TURN_BATCH_MAX)
  .refine((ids) => new Set(ids).size === ids.length);

const sceneField = { sceneId: turnIdSchema };

/** A change to the turn order of a scene, sent by the GM (or by a player ending their own turn). */
export const arenaTurnCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("next"), ...sceneField }),
  z.object({ action: z.literal("previous"), ...sceneField }),
  /** Ends the turn of `tokenId` (ignored when it is no longer that token's turn). */
  z.object({ action: z.literal("endTurn"), ...sceneField, tokenId: turnIdSchema }),
  z.object({ action: z.literal("add"), ...sceneField, tokenIds: turnTokenIdsSchema }),
  z.object({ action: z.literal("remove"), ...sceneField, tokenIds: turnTokenIdsSchema }),
  z.object({ action: z.literal("roll"), ...sceneField, tokenIds: turnTokenIdsSchema }),
  z.object({
    action: z.literal("set"),
    ...sceneField,
    tokenId: turnIdSchema,
    initiative: initiativeSchema.nullable(),
  }),
  z.object({
    action: z.literal("move"),
    ...sceneField,
    tokenId: turnIdSchema,
    index: z.number().int().min(0).max(10_000),
  }),
  /** Makes it the turn of this token. */
  z.object({ action: z.literal("focus"), ...sceneField, tokenId: turnIdSchema }),
  z.object({ action: z.literal("sort"), ...sceneField }),
  z.object({ action: z.literal("clear"), ...sceneField }),
]);
