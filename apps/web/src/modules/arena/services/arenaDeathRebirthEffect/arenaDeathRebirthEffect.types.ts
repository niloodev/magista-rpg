import type { Container, Sprite } from "pixi.js";

import type { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";

import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** A shadow coiling around the target: where it rises from, which way it wraps, and how it writhes. */
export interface IDeathShadow {
  /** The target it coils onto, in screen pixels relative to the token that plays the screen part. */
  target: IArenaPoint2;
  angle: number;
  wrap: 1 | -1;
  delay: number;
  speed: number;
  /** Its soft dark body, the violet energy running along it, the ink it pours, and the glow at its point. */
  body: ArenaEnergyFlow;
  energy: ArenaEnergyFlow;
  ink: ArenaEnergyFlow;
  tip: Sprite;
}

/** What the spell does on the whole screen (once per cast). */
export interface IDeathScreen {
  step: (t: number, origin: Container, r: number) => void;
  /**
   * After the spell, its living shadow keeps flowing with no new darkness and fades by itself; `since` is how
   * long it has been over, in milliseconds. False once it is gone.
   */
  linger: (origin: Container, r: number, since: number) => boolean;
  end: () => void;
}
