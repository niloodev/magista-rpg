import {
  PERF_MODE_ATTRIBUTE,
  PERF_MODES,
  REDUCED_MOTION_QUERY,
} from "./usePrefersReducedMotion.constants";
import type { PerfMode } from "./usePrefersReducedMotion.types";

/**
 * Reads a stored performance mode ("low" or "full"); anything else means "follow the system".
 */
export function parsePerfMode(value: string | null | undefined): PerfMode | null {
  return PERF_MODES.find((mode) => mode === value) ?? null;
}

/**
 * Whether motion and heavy effects should be off: performance mode on, or the system asks for reduced motion
 * and the user did not pick the full mode. False during server rendering.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mode = parsePerfMode(document.documentElement.getAttribute(PERF_MODE_ATTRIBUTE));
  if (mode) return mode === "low";
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
