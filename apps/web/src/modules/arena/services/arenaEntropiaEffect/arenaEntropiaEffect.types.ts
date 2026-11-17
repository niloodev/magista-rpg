import type { Container } from "pixi.js";

import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** A chain thrown at the target: where it comes from (off the screen) and how it sways and lands. */
export interface IEntropiaChain {
  /** Start, in screen pixels relative to the middle of the targets. */
  from: IArenaPoint2;
  /** The target it binds, in screen pixels relative to the token that plays the screen part. */
  to: IArenaPoint2;
  /** When it is thrown, as a share of the bind phase. */
  delay: number;
  /** Sideways bow of the chain (share of its length) and its rattle. */
  bow: number;
  rattle: number;
}

/** A point along a chain and the angle of the chain there. */
export interface IChainLink {
  point: IArenaPoint2;
  angle: number;
}

/** What the spell does on the whole screen (once per cast). */
export interface IEntropiaScreen {
  step: (t: number, origin: Container, r: number) => void;
  end: () => void;
}
