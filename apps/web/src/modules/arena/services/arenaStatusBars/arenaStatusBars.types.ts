import type { ArenaResourceKey } from "@magista/shared";

/** A value moving from `from` to `to`, starting at `start` (after `delay`) and lasting `duration`. */
export interface IStatusTween {
  from: number;
  to: number;
  start: number;
  delay: number;
  duration: number;
}

export interface IStatusBarState {
  key: ArenaResourceKey;
  current: number;
  max: number;
  /** Shown fill (0 to 1) and the lighter trail behind it. */
  fill: IStatusTween;
  chip: IStatusTween;
}

export interface IStatusBarsOptions {
  fontFamily: string;
  lite: boolean;
}

/** How a new status arrives: animated (a change seen live) and with a floating number or not. */
export interface IStatusUpdate {
  animate: boolean;
  float: boolean;
}

/** Sizes of the bars in map pixels for the current token size and zoom. */
export interface IStatusBarLayout {
  width: number;
  thickness: number;
  gap: number;
  /** Space between the bars and the token. */
  lift: number;
}
