import { describe, expect, it } from "vitest";

import { barLayout, resourceFraction, resourceLabel, tweenValue } from "./arenaStatusBars.utils";

describe("status bars", () => {
  it("eases a tween to its value after the delay", () => {
    const tween = { from: 1, to: 0.5, start: 100, delay: 50, duration: 200 };
    expect(tweenValue(tween, 120)).toEqual({ value: 1, done: false });
    const middle = tweenValue(tween, 250).value;
    expect(middle).toBeLessThan(1);
    expect(middle).toBeGreaterThan(0.5);
    expect(tweenValue(tween, 400)).toEqual({ value: 0.5, done: true });
    expect(tweenValue({ ...tween, duration: 0 }, 160)).toEqual({ value: 0.5, done: true });
  });

  it("fills only resources with a maximum, clamped", () => {
    expect(resourceFraction({ current: 5, max: 20 })).toBe(0.25);
    expect(resourceFraction({ current: 30, max: 20 })).toBe(1);
    expect(resourceFraction({ current: -2, max: 20 })).toBe(0);
    expect(resourceFraction({ current: null, max: 20 })).toBe(1);
    expect(resourceFraction({ current: 5, max: null })).toBeNull();
    expect(resourceFraction({ current: 5, max: 0 })).toBeNull();
  });

  it("keeps the thickness readable on screen at any zoom", () => {
    expect(barLayout(140, 1, false).thickness).toBeCloseTo(8.4);
    expect(barLayout(140, 0.1, false).thickness).toBeCloseTo(60);
    expect(barLayout(400, 1, false).thickness).toBe(10);
    expect(barLayout(140, 2, true).thickness).toBe(9);
    expect(barLayout(140, 0.5, false).lift).toBe(20);
    expect(barLayout(140, 0.1, false).width).toBe(400);
    expect(barLayout(140, 1, false).width).toBe(126);
  });

  it("writes the values", () => {
    expect(resourceLabel({ current: 12, max: 20 })).toBe("12/20");
    expect(resourceLabel({ current: null, max: 8 })).toBe("8/8");
  });
});
