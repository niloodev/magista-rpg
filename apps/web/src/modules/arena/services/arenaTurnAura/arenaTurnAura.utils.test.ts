import { describe, expect, it } from "vitest";

import { TURN_AURA_FADE_MS, TURN_BOB_PERIOD_MS, TURN_LIFT } from "./arenaTurnAura.constants";
import { auraPresence, breath, floatLift } from "./arenaTurnAura.utils";

describe("turn aura", () => {
  it("fades in, stays and fades out", () => {
    expect(auraPresence(0, 0, null)).toBe(0);
    expect(auraPresence(TURN_AURA_FADE_MS, 0, null)).toBe(1);
    expect(auraPresence(5000, 0, 5000)).toBe(1);
    expect(auraPresence(5000 + TURN_AURA_FADE_MS, 0, 5000)).toBe(0);
  });

  it("floats the token a little, big tokens no higher than the cap", () => {
    expect(floatLift(140, 0, 1)).toBeCloseTo(140 * TURN_LIFT.hover);
    expect(floatLift(140, TURN_BOB_PERIOD_MS / 4, 1)).toBeCloseTo(
      140 * (TURN_LIFT.hover + TURN_LIFT.bob),
    );
    expect(floatLift(600, 0, 1)).toBe(TURN_LIFT.max);
    expect(floatLift(600, TURN_BOB_PERIOD_MS / 4, 1)).toBe(TURN_LIFT.max + TURN_LIFT.bobMax);
    expect(floatLift(140, 0, 0)).toBe(0);
  });

  it("breathes between 0 and 1", () => {
    expect(breath(TURN_BOB_PERIOD_MS / 4)).toBeCloseTo(1);
    expect(breath((TURN_BOB_PERIOD_MS * 3) / 4)).toBeCloseTo(0);
  });
});
