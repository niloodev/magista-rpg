import { z } from "zod";

export const ARENA_RESOURCE_KEYS = ["health", "sanity"] as const;

export const ARENA_CHANGE_KINDS = ["damage", "heal"] as const;

/**
 * Animations a change can play. The first four are the automatic ones of each action and attribute; the others
 * are free (no action of their own: players pick what they use them for).
 */
export const ARENA_EFFECT_STYLES = [
  "strike",
  "fissure",
  "ember",
  "clarity",
  "voxPopuli",
  "vitaeUnius",
  "entropiaPoema",
  "deathRebirth",
  "divineCall",
  "gunshot",
  "shovel",
  "soulDrain",
  "floralStrike",
  "floralCast",
  "voodooAxe",
  "voodooFire",
  "nonEuclidean",
] as const;

export const arenaEffectStyleSchema = z.enum(ARENA_EFFECT_STYLES);

const effectsByResourceSchema = z.object({
  health: arenaEffectStyleSchema.optional(),
  sanity: arenaEffectStyleSchema.optional(),
});

/**
 * Animations a sheet prefers when it attacks or heals with the effect on "Automático", by action and attribute
 * (a missing one keeps the default).
 */
export const sheetEffectsSchema = z.object({
  damage: effectsByResourceSchema.optional(),
  heal: effectsByResourceSchema.optional(),
});
