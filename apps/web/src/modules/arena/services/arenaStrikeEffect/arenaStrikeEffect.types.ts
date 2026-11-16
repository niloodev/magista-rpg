import type { Particle } from "pixi.js";

import type { IFxParticleSpawn } from "@/modules/arena/services/arenaTokenEffects";

export type StrikeParticleKind = "spark" | "hot" | "shard" | "smoke" | "glow" | "core";

/** A particle of the Golpe: its launch, its sprite and how it looks over its life. */
export interface IStrikeParticle {
  kind: StrikeParticleKind;
  spawn: IFxParticleSpawn;
  particle: Particle;
  /** Size in map pixels (length for sparks). */
  size: number;
  spin: number;
  tint: number;
}
