import type { Container } from "pixi.js";

import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** One circle of the Flower of Life: its center and the ring it belongs to (0 center, 1 inner, 2 outer). */
export interface IFlowerCircle {
  center: IArenaPoint2;
  ring: number;
  /** Where its trace starts, so neighbors do not start at the same point. */
  startAngle: number;
}

/** A vine growing from the target: its path outward and where its leaves sprout (shares of the path). */
export interface IVitaeVine {
  points: IArenaPoint2[];
  leaves: { at: number; side: 1 | -1; size: number }[];
  /** When it starts growing, as a share of the weave. */
  delay: number;
  width: number;
}

/** What the spell does on the whole screen (once per cast). */
export interface IVitaeScreen {
  step: (t: number, origin: Container, r: number) => void;
  end: () => void;
}
