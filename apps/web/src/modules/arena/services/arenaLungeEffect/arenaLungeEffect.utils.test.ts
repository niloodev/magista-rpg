import { describe, expect, it } from "vitest";

import { LUNGE_PHASES } from "./arenaLungeEffect.constants";
import { lungeDistance, lungeReach } from "./arenaLungeEffect.utils";

describe("lunge", () => {
  it("pulls back, reaches the target at the hit, holds and comes home", () => {
    expect(lungeDistance(0, 300, 30)).toBeCloseTo(0);
    expect(lungeDistance(LUNGE_PHASES.windup, 300, 30)).toBeCloseTo(-30);
    expect(lungeDistance(LUNGE_PHASES.hit, 300, 30)).toBe(300);
    expect(lungeDistance((LUNGE_PHASES.hit + LUNGE_PHASES.hold) / 2, 300, 30)).toBe(300);
    expect(lungeDistance(1, 300, 30)).toBeCloseTo(0);
  });

  it("stops at the edge of the target", () => {
    expect(lungeReach({ x: 400, y: 0 }, 70, 70)).toBeCloseTo(316);
    expect(lungeReach({ x: 100, y: 0 }, 70, 70)).toBeCloseTo(40);
  });
});
