import { z } from "zod";

import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../catalog/catalog.constants";
import { BLOCK_KEYS } from "./rolls.constants";

export const rollKindSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("attribute"), key: z.enum(ATTRIBUTE_KEYS) }),
  z.object({ kind: z.literal("skill"), key: z.enum(SKILL_KEYS) }),
  z.object({ kind: z.literal("initiative") }),
  z.object({ kind: z.literal("baseDamage") }),
  z.object({ kind: z.literal("lifeDie") }),
  z.object({ kind: z.literal("sanityDie") }),
  z.object({ kind: z.literal("block"), key: z.enum(BLOCK_KEYS) }),
  z.object({ kind: z.literal("counterAttack") }),
  z.object({
    kind: z.literal("ability"),
    list: z.enum(["abilities", "innerRealm"]),
    id: z.string().min(1).max(64),
  }),
]);

export const levelUpInputSchema = z.object({
  addToCurrent: z.boolean(),
});

export const rollRequestSchema = z.object({
  characterId: z.uuid(),
  roll: rollKindSchema,
});
