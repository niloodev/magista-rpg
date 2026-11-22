import { describe, expect, it } from "vitest";

import { WORLD_TRANSITION_TIMING, WORLD_TRANSITION_ZOOM } from "./arenaWorldTransition.constants";
import {
  approachElapsedFor,
  easeInFlight,
  easeOutFlight,
  stepCloudZoom,
  transitionDensity,
} from "./arenaWorldTransition.utils";

const timing = WORLD_TRANSITION_TIMING;

describe("world transition flight", () => {
  it("thickens to white on the approach and clears on the departure", () => {
    expect(transitionDensity("approach", 0, timing)).toBe(0);
    expect(transitionDensity("approach", timing.approach, timing)).toBe(1);
    expect(transitionDensity("covered", 0, timing)).toBe(1);
    expect(transitionDensity("depart", 0, timing)).toBe(1);
    expect(transitionDensity("depart", timing.depart, timing)).toBe(0);
  });

  it("turns back from any density without a jump", () => {
    for (const density of [0.1, 0.5, 0.9]) {
      const elapsed = approachElapsedFor(density, timing);
      expect(transitionDensity("approach", elapsed, timing)).toBeCloseTo(density);
    }
  });

  it("only shrinks the clouds flying up and only grows them flying down, at a steady pace", () => {
    const up = [stepCloudZoom(2, "out", 0.2, timing), stepCloudZoom(2, "out", 0.4, timing)];
    expect(up[0]).toBeLessThan(2);
    expect(up[1]).toBeLessThan(up[0] ?? 0);
    expect(stepCloudZoom(1, "in", 0.3, timing)).toBeGreaterThan(1);
    const ratio = stepCloudZoom(1, "out", 0.1, timing);
    expect(stepCloudZoom(ratio, "out", 0.1, timing)).toBeCloseTo(ratio * ratio);
    expect(stepCloudZoom(0.01, "out", 1, timing)).toBe(WORLD_TRANSITION_ZOOM.out.end);
  });

  it("speeds up on the way in and slows down on the way out", () => {
    expect(easeInFlight(0.5)).toBeLessThan(0.5);
    expect(easeOutFlight(0.5)).toBeGreaterThan(0.5);
  });
});
