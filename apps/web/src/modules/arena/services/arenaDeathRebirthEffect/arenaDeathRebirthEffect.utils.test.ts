import { describe, expect, it } from "vitest";

import { coilPath, coilWidth, crescent, tendrilPath } from "./arenaDeathRebirthEffect.utils";

describe("tendrilPath", () => {
  it("starts at the base, ends near the tip and writhes in between", () => {
    const points = tendrilPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 0, 10);
    expect(points).toHaveLength(11);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[10]?.x).toBeCloseTo(100);
    expect(points.some((point) => Math.abs(point.y) > 1)).toBe(true);
  });
});

describe("coilPath", () => {
  it("rises from the ground far out and ends on the target edge, only as far as it has grown", () => {
    const full = coilPath(0, 1, 30, 10, 5, 0.5, 0, 1);
    expect(full[0]).toEqual({ x: 30, y: 0 });
    const end = full[full.length - 1] ?? { x: 0, y: 0 };
    expect(Math.hypot(end.x, end.y / 0.5)).toBeLessThan(15);
    const half = coilPath(0, 1, 30, 10, 5, 0.5, 0, 0.5);
    const halfEnd = half[half.length - 1] ?? { x: 0, y: 0 };
    expect(Math.hypot(halfEnd.x, halfEnd.y)).toBeGreaterThan(Math.hypot(end.x, end.y));
  });
});

describe("crescent", () => {
  it("keeps only the part of the disk outside the cut, as a closed outline", () => {
    const outline = crescent(10, 9, { x: -4, y: 0 });
    expect(outline.length % 2).toBe(0);
    expect(outline.length).toBeGreaterThan(20);
    for (let index = 0; index < outline.length; index += 2) {
      const x = outline[index] ?? 0;
      const y = outline[index + 1] ?? 0;
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(10.0001);
      expect(Math.hypot(x + 4, y)).toBeGreaterThanOrEqual(8.9999);
    }
    expect(Math.max(...outline.filter((_, index) => index % 2 === 0))).toBeCloseTo(10);
  });
});

describe("coilWidth", () => {
  it("swells out of the ground and narrows to a point", () => {
    expect(coilWidth(0)).toBeCloseTo(0.35);
    expect(coilWidth(0.15)).toBeGreaterThan(coilWidth(0.05));
    expect(coilWidth(0.5)).toBeLessThan(coilWidth(0.2));
    expect(coilWidth(1)).toBe(0);
  });
});
