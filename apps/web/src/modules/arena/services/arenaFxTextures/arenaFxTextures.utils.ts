import { FX_ATLAS_COLUMNS, FX_FRAME_SIZE } from "./arenaFxTextures.constants";

/** Top-left corner of the atlas slot `index`, filling rows of `FX_ATLAS_COLUMNS` frames. */
export function atlasCell(index: number): { x: number; y: number } {
  return {
    x: (index % FX_ATLAS_COLUMNS) * FX_FRAME_SIZE,
    y: Math.floor(index / FX_ATLAS_COLUMNS) * FX_FRAME_SIZE,
  };
}

/** Smoothstep of `value` clamped to 0..1: eases in and out, for soft edges painted on the atlas. */
export function smooth(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}
