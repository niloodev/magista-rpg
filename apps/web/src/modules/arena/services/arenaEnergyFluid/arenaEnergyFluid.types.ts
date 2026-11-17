import type {
  IEnergyChannelOptions,
  IEnergyPalette,
} from "@/modules/arena/services/arenaEnergyFlow";
import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** The area the fluid covers, in the local pixels of the effect that owns it. */
export interface IFluidArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How the fluid moves on its own, beyond its turbulence (all in local pixels per second). */
export interface IFluidBias {
  /** A steady drift (rising smoke, a current). */
  drift?: IArenaPoint2;
  /** A point the fluid pours away from (positive) or into (negative), and one it swirls around. */
  center?: IArenaPoint2;
  radial?: number;
  swirl?: number;
}

/** How a fluid of energy looks and behaves. */
export interface IEnergyFluidOptions {
  area: IFluidArea;
  /** Its core color lights the hottest threads; the energy itself takes the colors of the sources. */
  palette: IEnergyPalette;
  /**
   * In fire mode, the palette of the fire poured in a red-dominant color (red sources burn in it, the others in
   * `palette`, and where they meet the two fires blend).
   */
  secondary?: IEnergyPalette;
  /** Texels on the longer side of the area (detail versus cost). */
  resolution?: number;
  /** Cells of the simulation on the longer side (the velocity and the pressure; coarser than the ink). */
  simulation?: number;
  /** Share of the ink kept each second (0.3 fades fast, 0.9 lingers), and of the motion. */
  decay?: number;
  velocityDecay?: number;
  /** Size of the turbulent swirls (pixels) and how hard they push (pixels per second, per second). */
  turbulence?: { scale: number; force: number };
  /** Relaxation steps of the pressure each frame (more: truer swirls, more cost; 8 to 10 is plenty for a token). */
  pressureSteps?: number;
  /** How strongly the swirls are fed, so they keep spinning (the liquid look). */
  vorticity?: number;
  /**
   * `light` (the default) shows the energy as glowing mist added to the scene; `shadow` shows it as a living
   * darkness covering the scene, with the veins of energy glowing through it; `fire` shows it as flames, the
   * ink as heat burning from white-hot through the palette's `core`, `mid` and `deep` (give it a strong rising
   * drift and a fast `decay`).
   */
  mode?: "light" | "shadow" | "fire";
  /** How many veins of light run through the mist, and how strong its haze is (0 none). */
  threads?: number;
  haze?: number;
  /** How bright the fluid shows. */
  gain?: number;
  seed?: number;
}

/** A tendril of energy: a channel made of thin weaving threads that leaves a wake in a fluid. */
export interface IEnergyTendrilOptions extends IEnergyChannelOptions {
  /** How many threads weave it (`width` is the whole tendril). */
  threads?: number;
  /** How wide the stream of ink it pours into the fluid is, in widths of the tendril. */
  wake?: number;
}

/** What one thread of a tendril changes in the channel it is drawn with. */
export interface IEnergyTendrilThread {
  bend: number;
  counter: number;
  width: number;
  seed: number;
  swaySpeed: number;
}

/** What the fluid does this frame. */
export interface IEnergyFluidFrame {
  /** How much of what the sources draw is poured in each second (0 none). */
  inject?: number;
  alpha?: number;
  bias?: IFluidBias;
  decay?: number;
}

/** The bias of the fluid in the units of the simulation (cells per second; the center in texture coordinates). */
export interface IFluidUvBias {
  drift: [number, number];
  center: [number, number];
  radial: number;
  swirl: number;
}
