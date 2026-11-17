import type { Texture } from "pixi.js";

/** Frames of the particle atlas (all in one texture, as a ParticleContainer needs). */
export type ArenaFxFrame =
  "glow" | "streak" | "shard" | "spark" | "smoke" | "petal" | "blossom" | "beam" | "link";

export type IArenaFxTextureSet = Record<ArenaFxFrame, Texture> & {
  /** Math symbols, white (tinted per particle), for the geometry spell. */
  glyphs: readonly Texture[];
  /** Digits and arithmetic signs, white, for the geometry spell. */
  digits: readonly Texture[];
};
