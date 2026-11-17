import { describe, expect, it } from "vitest";

import { biasToCells, decayOver, fluidTexels, tendrilThreads } from "./arenaEnergyFluid.utils";

describe("fluidTexels", () => {
  it("puts the resolution on the longer side and keeps the shape", () => {
    expect(fluidTexels({ x: 0, y: 0, width: 1000, height: 500 }, 512)).toEqual({
      width: 512,
      height: 256,
    });
  });
});

describe("biasToCells", () => {
  it("turns local pixels per second into cells per second, and the center into texture coordinates", () => {
    const area = { x: -100, y: -50, width: 200, height: 100 };
    const cells = biasToCells(
      { drift: { x: 0, y: -50 }, center: { x: 0, y: 0 }, radial: 100, swirl: 20 },
      area,
      100,
    );
    expect(cells.drift).toEqual([0, -25]);
    expect(cells.center).toEqual([0.5, 0.5]);
    expect(cells.radial).toBe(50);
    expect(cells.swirl).toBe(10);
  });

  it("centers on the area without a bias", () => {
    expect(biasToCells(undefined, { x: 0, y: 0, width: 10, height: 10 }, 10).center).toEqual([
      0.5, 0.5,
    ]);
  });
});

describe("decayOver", () => {
  it("keeps the share of a second over a frame", () => {
    expect(decayOver(0.25, 0.5)).toBeCloseTo(0.5);
    expect(decayOver(0.5, 0)).toBe(1);
  });
});

describe("tendrilThreads", () => {
  it("weaves thinner threads around the curve of the tendril, each with its own seed", () => {
    const threads = tendrilThreads({ bend: 0.2, width: 100, seed: 4 }, 3);
    expect(threads).toHaveLength(3);
    expect(threads[0]?.bend).toBeLessThan(0.2);
    expect(threads[1]?.bend).toBeCloseTo(0.2);
    expect(threads[2]?.bend).toBeGreaterThan(0.2);
    expect(threads[0]?.counter).toBeGreaterThan(threads[2]?.counter ?? 0);
    expect(threads.every((thread) => thread.width < 100)).toBe(true);
    expect(new Set(threads.map((thread) => thread.seed)).size).toBe(3);
  });

  it("keeps a single thread on the curve itself", () => {
    const [thread] = tendrilThreads({ bend: 0.3, counter: -0.1, width: 50 }, 1);
    expect(thread?.bend).toBeCloseTo(0.3);
    expect(thread?.counter).toBeCloseTo(-0.1);
  });
});
