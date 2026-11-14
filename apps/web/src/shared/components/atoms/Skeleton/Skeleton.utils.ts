import { SKELETON_SAMPLE_FILLER, SKELETON_SAMPLE_MAX } from "./Skeleton.constants";

/**
 * Sample text with `length` characters (1 to 60), to size an invisible `glyphs` placeholder like the real text.
 */
export function skeletonSample(length: number): string {
  const size = Math.min(Math.max(Math.trunc(length) || 1, 1), SKELETON_SAMPLE_MAX);
  const repeats = Math.ceil(size / SKELETON_SAMPLE_FILLER.length) + 1;
  return SKELETON_SAMPLE_FILLER.repeat(repeats).slice(0, size).trimEnd().padEnd(size, "a");
}
