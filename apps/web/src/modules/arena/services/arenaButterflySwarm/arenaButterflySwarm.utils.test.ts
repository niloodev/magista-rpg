import { describe, expect, it } from "vitest";

import { BUTTERFLY_CLOSED } from "./arenaButterflySwarm.constants";
import {
  curvePoint,
  easeInOut,
  fadeInOut,
  flightRotation,
  flutter,
  wingBeat,
} from "./arenaButterflySwarm.utils";

describe("arenaButterflySwarm utils", () => {
  it("beats the wings between closed and fully open", () => {
    expect(wingBeat(0, 10)).toBeCloseTo(1);
    expect(wingBeat(0.05, 10)).toBeCloseTo(BUTTERFLY_CLOSED);
    for (let age = 0; age < 1; age += 0.013) {
      const open = wingBeat(age, 9);
      expect(open).toBeGreaterThanOrEqual(BUTTERFLY_CLOSED - 1e-9);
      expect(open).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("flutters within a share of the wingspan, differently per seed", () => {
    for (let time = 0; time < 2; time += 0.07) {
      const off = flutter(time, 3, 20);
      expect(Math.hypot(off.x, off.y)).toBeLessThan(20);
    }
    expect(flutter(0.4, 1, 20)).not.toEqual(flutter(0.4, 2, 20));
  });

  it("points the head where it flies, and up when it hovers", () => {
    const right = flightRotation((time) => ({ x: time * 1000, y: 0 }), 1, 10);
    expect(right).toBeCloseTo(Math.PI / 2, 1);
    const still = flightRotation(() => ({ x: 5, y: 5 }), 1, 10);
    expect(still).toBeCloseTo(0);
  });

  it("curves from the start to the end", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 0 };
    expect(curvePoint(from, { x: 5, y: -10 }, to, 0)).toEqual(from);
    expect(curvePoint(from, { x: 5, y: -10 }, to, 1)).toEqual(to);
    expect(curvePoint(from, { x: 5, y: -10 }, to, 0.5).y).toBeLessThan(0);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(2)).toBe(1);
  });

  it("fades in and out, fully shown in the middle of its life", () => {
    expect(fadeInOut(0)).toBe(0);
    expect(fadeInOut(0.5)).toBe(1);
    expect(fadeInOut(1)).toBe(0);
  });
});
