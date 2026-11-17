import { describe, expect, it } from "vitest";

import { chainLinks, chainOrigins, quadPoint, spiralIn } from "./arenaEntropiaEffect.utils";

describe("quadPoint", () => {
  it("starts at the first point, ends at the last and bends toward the control", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 0 };
    const control = { x: 5, y: 10 };
    expect(quadPoint(a, control, b, 0)).toEqual(a);
    expect(quadPoint(a, control, b, 1)).toEqual(b);
    expect(quadPoint(a, control, b, 0.5).y).toBeCloseTo(5);
  });
});

describe("chainLinks", () => {
  it("puts one link every step along a straight chain, only as far as it has flown", () => {
    const links = chainLinks({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, 10, 1);
    expect(links).toHaveLength(10);
    expect(links[0]?.point.x).toBeCloseTo(10);
    expect(links[0]?.angle).toBeCloseTo(0);
    expect(chainLinks({ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, 10, 0.5)).toHaveLength(5);
  });
});

describe("spiralIn", () => {
  it("starts where the verse is and ends in the center, stretched", () => {
    const start = { x: 100, y: 0 };
    const center = { x: 0, y: 0 };
    expect(spiralIn(start, center, 0, 2).point.x).toBeCloseTo(100);
    const end = spiralIn(start, center, 1, 2);
    expect(Math.hypot(end.point.x, end.point.y)).toBeCloseTo(0);
    expect(end.stretch).toBeGreaterThan(3);
  });
});

describe("chainOrigins", () => {
  it("spreads the chains around the target, past the edges of the screen", () => {
    const origins = chainOrigins(6, 800, 600, () => 0.5);
    expect(origins).toHaveLength(6);
    for (const origin of origins) expect(Math.hypot(origin.x, origin.y)).toBeCloseTo(600);
  });
});
