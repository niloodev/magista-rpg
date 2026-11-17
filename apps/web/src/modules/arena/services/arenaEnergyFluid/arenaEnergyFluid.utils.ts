import { TENDRIL_DEFAULTS } from "./arenaEnergyFluid.constants";
import type {
  IEnergyTendrilOptions,
  IEnergyTendrilThread,
  IFluidArea,
  IFluidBias,
  IFluidUvBias,
} from "./arenaEnergyFluid.types";

/** Texture size for an area: `resolution` texels on its longer side, the other side in proportion. */
export function fluidTexels(
  area: IFluidArea,
  resolution: number,
): { width: number; height: number } {
  const longest = Math.max(area.width, area.height, 1);
  return {
    width: Math.max(2, Math.round((area.width / longest) * resolution)),
    height: Math.max(2, Math.round((area.height / longest) * resolution)),
  };
}

/**
 * The bias in the units of the simulation: its pushes from local pixels per second to cells per second (the cells
 * are square, `cells` across the area's width), and its center in texture coordinates.
 */
export function biasToCells(
  bias: IFluidBias | undefined,
  area: IFluidArea,
  cells: number,
): IFluidUvBias {
  const width = Math.max(area.width, 1);
  const height = Math.max(area.height, 1);
  const scale = cells / width;
  const center = bias?.center ?? { x: area.x + width / 2, y: area.y + height / 2 };
  return {
    drift: [(bias?.drift?.x ?? 0) * scale, (bias?.drift?.y ?? 0) * scale],
    center: [(center.x - area.x) / width, (center.y - area.y) / height],
    radial: (bias?.radial ?? 0) * scale,
    swirl: (bias?.swirl ?? 0) * scale,
  };
}

/** Share kept over `delta` seconds when `decay` is kept each second. */
export function decayOver(decay: number, delta: number): number {
  return Math.min(Math.max(decay, 0), 1) ** Math.max(delta, 0);
}

/**
 * The threads of a tendril: each bows a little to one side of the tendril's curve and back across it near the
 * end, so they weave around each other; each is thinner than the tendril, with its own seed and sway.
 */
export function tendrilThreads(
  options: Pick<IEnergyTendrilOptions, "bend" | "counter" | "width" | "seed" | "swaySpeed">,
  count: number,
): IEnergyTendrilThread[] {
  const threads = Math.max(1, Math.round(count));
  const counter = options.counter ?? -options.bend * 0.5;
  return Array.from({ length: threads }, (_, index) => {
    const side = threads > 1 ? index / (threads - 1) - 0.5 : 0;
    return {
      bend: options.bend + side * 2 * TENDRIL_DEFAULTS.twist,
      counter: counter - side * 3 * TENDRIL_DEFAULTS.twist,
      width: options.width * TENDRIL_DEFAULTS.thread * (side === 0 ? 1.25 : 1),
      seed: (options.seed ?? 0) + index * 7.3,
      swaySpeed: (options.swaySpeed ?? 0.9) * (0.8 + 0.3 * index),
    };
  });
}
