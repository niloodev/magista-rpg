import { POPOUT_FEATURES } from "./windows.constants";
import type { IPopoutHost, IPopoutTarget } from "./windows.types";
import { popoutName, popoutUrl } from "./windows.utils";

/**
 * Opens a screen in its own small browser window (reusing and focusing the one already open for the same
 * item). When the browser blocks popups it falls back to a regular new tab. Returns whether a window opened.
 */
export function openPopout(target: IPopoutTarget, host: IPopoutHost = window): boolean {
  const url = popoutUrl(target);
  const opened = host.open(url, popoutName(target), POPOUT_FEATURES);
  if (opened) {
    opened.focus();
    return true;
  }
  return host.open(url, "_blank", "") !== null;
}
