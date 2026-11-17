import { describe, expect, it } from "vitest";

import { passingRipples, spoutPath, wavePath } from "./arenaPassingFlowEffect.utils";

describe("arenaPassingFlowEffect utils", () => {
  it("starts on the side facing the blow and wraps to the far side, each side its own way", () => {
    const right = wavePath(0, 1, 10, 20);
    const left = wavePath(0, -1, 10, 20);
    expect(right).toHaveLength(20);
    expect(right[0]?.x).toBeCloseTo(-10);
    expect(right.at(-1)?.x ?? 0).toBeGreaterThan(5);
    expect(Math.sign(right[8]?.y ?? 0)).toBe(-Math.sign(left[8]?.y ?? 0));
  });

  it("winds the spout from the floor up to its height, opening like a funnel", () => {
    const arm = spoutPath(0, 10, 60, 5, 1, 21);
    expect(arm).toHaveLength(21);
    expect(arm[0]).toEqual({ x: 5.5, y: 5 });
    expect(arm.at(-1)?.x).toBeCloseTo(18.5);
    expect(arm.at(-1)?.y).toBeCloseTo(-55);
  });

  it("raises rings of water at the crash and the slam only", () => {
    expect(passingRipples(0, 0, 1)).toHaveLength(0);
    expect(passingRipples(0.3, 0, 1)).toHaveLength(1);
    expect(passingRipples(1.2, 0, 1)).toHaveLength(2);
    expect(passingRipples(3, 0, 1)).toHaveLength(0);
  });
});
