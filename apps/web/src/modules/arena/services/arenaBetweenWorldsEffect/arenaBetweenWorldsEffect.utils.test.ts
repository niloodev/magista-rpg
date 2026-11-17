import { describe, expect, it } from "vitest";

import { seededRandom } from "@/modules/arena/services/arenaTokenEffects";

import {
  BETWEEN_FOLDED,
  BETWEEN_FOREWING,
  BETWEEN_PHASES,
} from "./arenaBetweenWorldsEffect.constants";
import {
  insidePolygon,
  passageRipplePlan,
  passageRipples,
  smoothLoop,
  spiralPoint,
  wingSlots,
  wingSpread,
} from "./arenaBetweenWorldsEffect.utils";

describe("arenaBetweenWorldsEffect utils", () => {
  it("draws a smooth closed loop through the control points", () => {
    const loop = smoothLoop(BETWEEN_FOREWING, 36);
    expect(loop).toHaveLength(36);
    expect(loop[0]?.x).toBeCloseTo(BETWEEN_FOREWING[0].x);
    expect(loop[0]?.y).toBeCloseTo(BETWEEN_FOREWING[0].y);
  });

  it("tells inside from outside a polygon", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(insidePolygon({ x: 0.5, y: 0.5 }, square)).toBe(true);
    expect(insidePolygon({ x: 1.5, y: 0.5 }, square)).toBe(false);
  });

  it("settles butterflies inside the wings", () => {
    const slots = wingSlots(40, seededRandom(4));
    expect(slots).toHaveLength(40);
    for (const slot of slots) {
      expect(slot.x).toBeGreaterThan(0);
      expect(slot.x).toBeLessThan(1);
    }
  });

  it("unfolds the wings, keeps them open and claps them shut at the hit", () => {
    expect(wingSpread(0)).toBeCloseTo(0);
    expect(wingSpread(BETWEEN_PHASES.eyes)).toBeGreaterThan(0.85);
    expect(wingSpread(BETWEEN_PHASES.hit - 0.04)).toBeGreaterThan(1);
    expect(wingSpread(BETWEEN_PHASES.hit)).toBeCloseTo(BETWEEN_FOLDED);
    expect(wingSpread(BETWEEN_PHASES.hit + 0.1)).toBeCloseTo(BETWEEN_FOLDED);
  });

  it("winds the whirlpool from its rim to its heart", () => {
    const rim = spiralPoint(0, 10, 1, 1, 0, 1);
    const heart = spiralPoint(1, 10, 1, 1, 0, 1);
    expect(Math.hypot(rim.x, rim.y)).toBeCloseTo(10);
    expect(Math.hypot(heart.x, heart.y)).toBeCloseTo(1);
    expect(spiralPoint(0.25, 10, 1, 1, 0, 0.5).y).toBeCloseTo(
      spiralPoint(0.25, 10, 1, 1, 0, 1).y * 0.5,
    );
  });

  it("raises rings of water only while they live, never more than eight", () => {
    const plan = passageRipplePlan();
    expect(passageRipples(0, plan)).toHaveLength(0);
    expect(passageRipples(0.06, plan).length).toBeGreaterThan(0);
    const closing = passageRipples(BETWEEN_PHASES.pull + 0.05, plan);
    expect(closing.length).toBeGreaterThan(0);
    expect(closing[0]?.radius).toBeLessThan(9);
    for (let t = 0; t <= 1; t += 0.01)
      expect(passageRipples(t, plan).length).toBeLessThanOrEqual(8);
  });
});
