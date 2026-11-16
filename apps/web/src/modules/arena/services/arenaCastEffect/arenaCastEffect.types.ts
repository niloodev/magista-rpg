import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import type { CAST_PALETTES } from "./arenaCastEffect.constants";

export type ArenaCastPalette = keyof typeof CAST_PALETTES;

export interface IArenaCastOptions {
  /** Caster diameter in map pixels. */
  size: number;
  /** From the caster center to the target point, in map pixels. */
  toward: IArenaPoint2;
  palette: ArenaCastPalette;
  seed: number;
}
