import type { Texture } from "pixi.js";

/** Frames of the particle atlas (all in one texture, as a ParticleContainer needs). */
export type ArenaFxFrame = "glow" | "streak" | "shard" | "spark" | "smoke";

export type IArenaFxTextureSet = Record<ArenaFxFrame, Texture>;
