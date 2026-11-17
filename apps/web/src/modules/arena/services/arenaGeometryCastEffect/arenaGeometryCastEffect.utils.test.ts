import { describe, expect, it } from "vitest";

import { helixPoint, squarePoints } from "./arenaGeometryCastEffect.utils";

describe("helixPoint", () => {
  it("starts at the caster and ends on the target, off the line in between", () => {
    const toward = { x: 100, y: 0 };
    expect(helixPoint(toward, 0, 20, 2, 1)).toEqual({ x: 0, y: 0 });
    const end = helixPoint(toward, 1, 20, 2, 1);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(0);
    expect(Math.abs(helixPoint(toward, 0.375, 20, 2, 0).y)).toBeGreaterThan(5);
  });
});

describe("squarePoints", () => {
  it("puts the four corners at the half side on each axis", () => {
    const points = squarePoints({ x: 0, y: 0 }, 10, 0);
    expect(points).toHaveLength(8);
    expect(points[0]).toBeCloseTo(10);
    expect(points[1]).toBeCloseTo(10);
  });
});
