import { POPOUT_ROUTES } from "./windows.constants";
import type { IPopoutTarget } from "./windows.types";

/**
 * Path of the window version of a screen.
 */
export function popoutUrl({ kind, id }: IPopoutTarget): string {
  return POPOUT_ROUTES[kind](id);
}

/**
 * Window name per screen and item, so opening the same sheet twice focuses the window already open.
 */
export function popoutName({ kind, id }: IPopoutTarget): string {
  return `magista-${kind}-${id}`;
}
