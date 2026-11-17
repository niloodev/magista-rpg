import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** One wave of sound: how far it has run, how strong it is, how thick, and how wide its front opens. */
export interface ISoundWave {
  /** Distance from the source, in units. */
  radius: number;
  /** 0 none, 1 full. */
  strength: number;
  /** Thickness of the compressed band, in units. */
  thickness: number;
  /** Half the angle of its front, in radians (`Math.PI` or more: a full ring). */
  spread: number;
}

/** How the sound looks. */
export interface ISoundWaveOptions {
  /** The faint light on the crests of the waves. */
  tint: number;
  /** How far the strongest wave pushes the picture, in units. */
  push?: number;
  /** How far the colors split on a crest, as a share of the push. */
  split?: number;
}

/** What the sound does this frame (all in screen pixels, so it follows the camera). */
export interface ISoundWaveFrame {
  origin: IArenaPoint2;
  /** Where the waves go (any length); the fronts open around it. */
  direction: IArenaPoint2;
  /** The size of one unit on the screen (the token radius there). */
  unit: number;
  waves: readonly ISoundWave[];
}
