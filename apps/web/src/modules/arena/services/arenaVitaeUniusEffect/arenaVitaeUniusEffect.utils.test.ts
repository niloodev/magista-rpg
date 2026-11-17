import { describe, expect, it } from "vitest";

import {
  flowerOfLife,
  heartbeat,
  leafShape,
  pathPoint,
  vinePath,
} from "./arenaVitaeUniusEffect.utils";

describe("flowerOfLife", () => {
  it("has the center, six around it and twelve outside, each neighbor one radius away", () => {
    const circles = flowerOfLife(10);
    expect(circles).toHaveLength(19);
    expect(circles.filter((circle) => circle.ring === 1)).toHaveLength(6);
    expect(circles.filter((circle) => circle.ring === 2)).toHaveLength(12);
    for (const circle of circles.filter((entry) => entry.ring === 1))
      expect(Math.hypot(circle.center.x, circle.center.y)).toBeCloseTo(10);
    const outer = circles
      .filter((circle) => circle.ring === 2)
      .map((c) => Math.hypot(c.center.x, c.center.y));
    expect(Math.max(...outer)).toBeCloseTo(20);
    expect(Math.min(...outer)).toBeCloseTo(10 * Math.sqrt(3));
  });
});

describe("heartbeat", () => {
  it("peaks on the lub, beats softer on the dub and rests between beats", () => {
    expect(heartbeat(0.5, [0.5], 0.04, 0.06)).toBeCloseTo(1);
    expect(heartbeat(0.54, [0.5], 0.04, 0.06)).toBeCloseTo(0.6);
    expect(heartbeat(0.7, [0.5], 0.04, 0.06)).toBe(0);
    expect(heartbeat(0.4, [0.5], 0.04, 0.06)).toBe(0);
  });
});

describe("vinePath", () => {
  it("starts on the token edge, grows outward and spreads its leaves along it", () => {
    const vine = vinePath(0, 10, 50, 1, 4, () => 0.5);
    expect(vine.points[0]).toEqual({ x: 10, y: 0 });
    const end = vine.points[vine.points.length - 1] ?? { x: 0, y: 0 };
    expect(Math.hypot(end.x, end.y)).toBeGreaterThan(30);
    expect(vine.leaves).toHaveLength(4);
    expect(vine.leaves.every((leaf) => leaf.at > 0 && leaf.at < 1)).toBe(true);
  });
});

describe("pathPoint", () => {
  it("finds the point at a share of a path and the way it goes", () => {
    const { point, angle } = pathPoint(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ],
      1,
    );
    expect(point).toEqual({ x: 20, y: 0 });
    expect(angle).toBeCloseTo(0);
  });
});

describe("leafShape", () => {
  it("draws a closed almond from its base to its tip", () => {
    const flat = leafShape({ x: 0, y: 0 }, 0, 10);
    expect(flat.length % 2).toBe(0);
    expect(Math.max(...flat.filter((_, index) => index % 2 === 0))).toBeCloseTo(10);
  });
});
