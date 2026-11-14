import { PERF_MODE_ATTRIBUTE, type PerfMode } from "@/shared/hooks";

import { PERF_COOKIE, PERF_COOKIE_MAX_AGE_SECONDS } from "./performance.constants";

/**
 * Saves the performance mode for this device (cookie read by the root layout, so the next HTML already comes
 * light) and applies it to the open page right away.
 */
export function writePerfMode(mode: PerfMode): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PERF_COOKIE}=${mode}; Path=/; Max-Age=${PERF_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  document.documentElement.setAttribute(PERF_MODE_ATTRIBUTE, mode);
}
