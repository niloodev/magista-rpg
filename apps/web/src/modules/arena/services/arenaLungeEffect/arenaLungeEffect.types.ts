import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { LUNGE_PALETTES } from "./arenaLungeEffect.constants";

export interface IArenaLungeOptions {
  /** Attacker diameter in map pixels. */
  size: number;
  /** From the attacker center to the target point, in map pixels. */
  toward: IArenaPoint2;
  /** Radius of the target, to stop at its edge. */
  targetRadius: number;
  seed: number;
  /** Colors of the trail (ruby by default). */
  palette?: ArenaLungePalette;
}

export type ArenaLungePalette = keyof typeof LUNGE_PALETTES;
