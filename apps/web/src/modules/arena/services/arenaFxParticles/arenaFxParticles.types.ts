import type { Texture } from "pixi.js";

import type { IArenaPoint2, IFxParticleSpawn } from "@/modules/arena/services/arenaTokenEffects";

/** How one particle looks along its life (`life` from 0 to 1, `age` in seconds). */
export interface IFxParticleLook {
  /** Width in map pixels (also the height unless `height` is given). */
  size: (life: number) => number;
  height?: (life: number) => number;
  alpha: (life: number, age: number) => number;
  tint: (life: number) => number;
  /** Rotation in radians; `velocity` points where it goes. */
  rotation?: (age: number, velocity: IArenaPoint2) => number;
  /** Extra offset on top of the motion (sway, orbit), in map pixels. */
  drift?: (age: number) => IArenaPoint2;
}

export interface IFxParticleSpec {
  texture: Texture;
  spawn: IFxParticleSpawn;
  look: IFxParticleLook;
  /** Anchor on the x axis (1 puts a streak head on the particle point). */
  anchorX?: number;
}
