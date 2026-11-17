import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

export interface IArenaGeometryCastOptions {
  /** Caster diameter in map pixels. */
  size: number;
  /** From the caster center to the target point, in map pixels. */
  toward: IArenaPoint2;
  seed: number;
}
