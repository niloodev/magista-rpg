"use client";

import { useSyncExternalStore } from "react";

import { SERVER_VIEWPORT_WIDTH } from "./useViewportWidth.constants";

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

const readWidth = () => window.innerWidth;

/**
 * Current viewport width in CSS pixels, following resizes (a desktop width during server rendering).
 */
export function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, readWidth, () => SERVER_VIEWPORT_WIDTH);
}
