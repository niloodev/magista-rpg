import type { Container } from "pixi.js";

import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** What part of the rumor a pane of glass is: the outer rays, the ring, the eye, the iris or the pupil. */
export type RumorCellKind = "ray" | "ring" | "white" | "iris" | "pupil";

/** One pane of the stained-glass rumor, lit when people believe it. */
export interface IRumorCell {
  kind: RumorCellKind;
  /** Outline, flat for `Graphics.poly`. */
  points: number[];
  centroid: IArenaPoint2;
  /** When it lights up, from 0 (first believers) to 1 (the last piece: it becomes true). */
  order: number;
  /** Color of the lit glass. */
  color: number;
}

/** One line of a fracture: its points from where it starts outward, and how far from the impact it starts. */
export interface IFractureLine {
  points: IArenaPoint2[];
  /** Share of the reach where the line starts (rings and branches appear after the radials pass there). */
  from: number;
  /** Line width at its start (it tapers to its end). */
  width: number;
}

/** A glass fracture around an impact: radial cracks, branches, the spiderweb rings and the crushed center. */
export interface IFracture {
  radials: IFractureLine[];
  rings: IFractureLine[];
  crush: IFractureLine[];
}

/** A big shard flying out of the screen at the viewer. */
export interface IScreenShard {
  points: IArenaPoint2[];
  angle: number;
  speed: number;
  spin: number;
  delay: number;
  tone: number;
}

/** What the spell does on the whole screen (once per cast). */
export interface IVoxScreen {
  /** `focus` is the middle of the targets and `paneOffset` the rumor window, both from `origin` on screen. */
  step: (
    t: number,
    origin: Container,
    focus: IArenaPoint2,
    paneOffset: IArenaPoint2,
    r: number,
  ) => void;
  /**
   * After the spell, its fluid keeps flowing with no new ink and fades by itself; `since` is how long it has been
   * over, in milliseconds. False once it is gone.
   */
  linger: (origin: Container, r: number, since: number) => boolean;
  end: () => void;
}
