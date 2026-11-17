import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

export interface IArenaShotOptions {
  /** Shooter diameter in map pixels. */
  size: number;
  /** From the shooter center to the target point, in map pixels. */
  toward: IArenaPoint2;
  /** Radius of the target token (the bullet stops at its edge). */
  targetRadius: number;
  seed: number;
}
