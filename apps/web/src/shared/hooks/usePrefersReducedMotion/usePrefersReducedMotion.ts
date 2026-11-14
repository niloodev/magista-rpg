"use client";

import { useSyncExternalStore } from "react";

import { PERF_MODE_ATTRIBUTE, REDUCED_MOTION_QUERY } from "./usePrefersReducedMotion.constants";
import { prefersReducedMotion } from "./usePrefersReducedMotion.utils";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  const observer = new MutationObserver(onChange);
  media.addEventListener("change", onChange);
  observer.observe(document.documentElement, { attributeFilter: [PERF_MODE_ATTRIBUTE] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/**
 * True when motion should be reduced: the performance mode is on, or the system asks for it and the user did not
 * choose the full mode (false during server rendering). Follows changes live.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
