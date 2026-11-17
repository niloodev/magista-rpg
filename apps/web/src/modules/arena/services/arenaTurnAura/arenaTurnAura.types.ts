import type { TokenStyle } from "@magista/shared";

import type { Container } from "pixi.js";

import type { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import type { ArenaEnergyFlow } from "@/modules/arena/services/arenaEnergyFlow";
import type { IArenaFxHost } from "@/modules/arena/services/arenaTokenEffects";

export interface IArenaTurnAuraOptions {
  /** The effects host (its `screen` runs the fluid, its `textures` give the soft glow). */
  host: IArenaFxHost;
  /** Performance mode: a still ring and glow, with no fluid, no shader and no motion. */
  lite: boolean;
  seed: number;
}

/** Shape of the token the aura sits under. */
export interface IArenaTurnAuraShape {
  size: number;
  style: TokenStyle;
  halfWidth: number;
  halfHeight: number;
}

/** What the aura asks of its token this frame. */
export interface IArenaTurnAuraFrame {
  /** How high the token floats, in map pixels (the ground pieces stay down). */
  lift: number;
  /** The aura keeps moving (needs another frame). */
  animating: boolean;
  /** Fully gone after leaving (its fluid faded too): destroy it. */
  done: boolean;
}

/** The pieces drawn with the energy kit, built for one token shape. */
export interface IAuraRig {
  fluid: ArenaEnergyFluid;
  ring: ArenaEnergyFlow;
  ringInk: ArenaEnergyFlow;
  layer: Container;
  center: { x: number; y: number };
  radius: number;
  /** Token size it was built for (a new size only scales `layer`). */
  size: number;
}
