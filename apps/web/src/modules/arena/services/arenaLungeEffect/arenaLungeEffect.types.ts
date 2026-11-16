import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

export interface IArenaLungeOptions {
  /** Attacker diameter in map pixels. */
  size: number;
  /** From the attacker center to the target point, in map pixels. */
  toward: IArenaPoint2;
  /** Radius of the target, to stop at its edge. */
  targetRadius: number;
  seed: number;
}
