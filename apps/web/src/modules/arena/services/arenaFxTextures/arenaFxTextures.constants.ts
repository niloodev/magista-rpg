import type { ArenaFxFrame } from "./arenaFxTextures.types";

/** Side of each frame of the atlas, in pixels. */
export const FX_FRAME_SIZE = 64;

export const FX_FRAMES: readonly ArenaFxFrame[] = [
  "glow",
  "streak",
  "shard",
  "spark",
  "smoke",
  "petal",
  "blossom",
  "beam",
  "link",
];

/** Math symbols painted into the atlas after the shapes. */
export const FX_GLYPHS = "∑ ∫ π ∞ √ ∂ ∇ Δ θ φ λ ≠ ∮ ℵ e i x".split(" ");

/** Digits and arithmetic signs painted after the symbols. */
export const FX_DIGITS = "0 1 2 3 4 5 6 7 8 9 + − × ÷ = %".split(" ");

/** Font of the glyphs: a math face where there is one, then a plain serif. */
export const FX_GLYPH_FONT = "bold 46px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif";

/** Frames per row of the atlas, so it stays under 2048 px wide (older GPUs refuse wider textures). */
export const FX_ATLAS_COLUMNS = 16;
