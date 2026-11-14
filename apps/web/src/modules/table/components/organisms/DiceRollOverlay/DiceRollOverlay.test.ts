import type { IRollOutcome } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { diceRange, naturalOf, splitOutcome } from "./DiceRollOverlay.utils";

const outcome = (d20: number, extra: Partial<IRollOutcome> = {}): IRollOutcome => ({
  expression: "1d20 + 3",
  terms: [
    { kind: "dice", sign: 1, count: 1, sides: 20, results: [d20] },
    { kind: "flat", sign: 1, value: 3 },
  ],
  total: d20 + 3,
  ...extra,
});

describe("DiceRollOverlay utils", () => {
  it("splits dice sum from modifiers", () => {
    expect(splitOutcome(outcome(12))).toEqual({ dice: 12, modifier: 3 });
  });

  it("computes the spinning range from positive dice", () => {
    expect(
      diceRange({
        expression: "2d6 + 1d4",
        total: 0,
        terms: [
          { kind: "dice", sign: 1, count: 2, sides: 6, results: [1, 1] },
          { kind: "dice", sign: 1, count: 1, sides: 4, results: [1] },
        ],
      }),
    ).toEqual({ min: 3, max: 16 });
  });

  it("detects natural 20 and 1 on a single d20 only", () => {
    expect(naturalOf(outcome(20))).toBe("critical");
    expect(naturalOf(outcome(1))).toBe("fumble");
    expect(naturalOf(outcome(10))).toBeNull();
  });
});
