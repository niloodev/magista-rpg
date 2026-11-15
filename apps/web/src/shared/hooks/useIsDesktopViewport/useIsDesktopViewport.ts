"use client";

import { useSyncExternalStore } from "react";

import { DESKTOP_VIEWPORT_QUERY } from "./useIsDesktopViewport.constants";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_VIEWPORT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const isDesktop = () => window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches;

/**
 * True when the viewport is at least 1024px wide (assumed true during server rendering, so desktops never
 * flash a phone-only state). Follows resizes live.
 */
export function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(subscribe, isDesktop, () => true);
}
