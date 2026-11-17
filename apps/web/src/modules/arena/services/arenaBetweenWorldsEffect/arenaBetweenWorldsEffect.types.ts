import type { Container, Sprite } from "pixi.js";

import type { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";

/** What the spell does on the whole screen (once per cast). */
export interface IBetweenScreen {
  step: (t: number, origin: Container, r: number) => void;
  /**
   * After the spell, its dark water keeps flowing with nothing new poured and fades by itself; `since` is how
   * long it has been over, in milliseconds. False once it is gone.
   */
  linger: (origin: Container, r: number, since: number) => boolean;
  end: () => void;
}

/** A spot in a wing of the god where a butterfly settles (half-spans from the root, on the right wing). */
export interface IWingSlot {
  x: number;
  y: number;
}

/** One eye on a wing of the god: the lid that opens (its vertical scale), its glow and the pupil that follows. */
export interface IBetweenEye {
  lid: Container;
  glow: Sprite;
  pupil: Container;
  /** When it blinks, in seconds of the spell. */
  blink: number;
}

/** One arm of the whirlpool: the water drawn on it and the darkness it pours. */
export interface IBetweenArm {
  water: ArenaEnergyFlow;
  ink: ArenaEnergyFlow;
}

/** A ring of water raised by the passage, in waves of the sound filter (all in token radii). */
export interface IBetweenRipple {
  born: number;
  span: number;
  from: number;
  to: number;
  strength: number;
}
