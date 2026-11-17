import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** Colors of a flow: its white-hot core, its main body and its deep edge. */
export interface IEnergyPalette {
  core: number;
  mid: number;
  deep: number;
}

/** How a flow looks and moves. */
export interface IEnergyFlowOptions {
  palette: IEnergyPalette;
  /** Points along the ribbon (the path is resampled to this many). */
  samples?: number;
  /** How fast the energy runs along the ribbon, in pixels per second. */
  speed?: number;
  /** Size of the folds of light, in pixels (bigger: broader, calmer flow). */
  grain?: number;
  /** How thin and sharp the veins of light are (1 soft and wide, 6 razor thin). */
  sharpness?: number;
  /** How many veins of light run through the energy (1 to 8). */
  strands?: number;
  /** How much its sides tear into wisps instead of ending as a band (0 a clean ribbon, 1 fully feathered). */
  feather?: number;
  /** How dense it is (1 the usual; 3 or so for a solid body, like a shadow's). */
  density?: number;
  /** `add` (the default) lights up what is under it; `normal` covers it (for dark bodies, like a shadow). */
  blend?: "add" | "normal";
  /** A closed ribbon (a ring): no fade where it meets itself. */
  closed?: boolean;
  seed?: number;
}

/** What a flow shows this frame: how much of it (from `tail` to `head`, 0 to 1) and how strongly. */
export interface IEnergyFlowFrame {
  head?: number;
  tail?: number;
  alpha?: number;
}

/** The ribbon mesh along a path: positions and UVs (along 0 to 1, across 0 to 1) and its length. */
export interface IEnergyRibbon {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  length: number;
}

export type EnergyWidth = number | ((along: number) => number);

export type EnergyPath = readonly IArenaPoint2[];

/** A channel of energy between two points: how it bends and sways, and how wide it is. */
export interface IEnergyChannelOptions extends IEnergyFlowOptions {
  from: IArenaPoint2;
  to: IArenaPoint2;
  /** How far it bows to one side and back the other way near its end (shares of its length). */
  bend: number;
  counter?: number;
  /** How much the bend sways, and how fast (radians per second). */
  sway?: number;
  swaySpeed?: number;
  /** Its width at the widest (it narrows toward both ends). */
  width: number;
}
