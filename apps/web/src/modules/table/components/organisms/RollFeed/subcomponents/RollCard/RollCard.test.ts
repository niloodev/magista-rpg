import { describe, expect, it } from "vitest";

import {
  flatModifier,
  hasCritical,
  naturalOutcome,
  splitNotes,
  toDieChips,
} from "@/modules/table/table.utils";

const row = (results: number[], sides = 20, flat = -1) => ({
  label: "Rolagem",
  outcome: {
    expression: "x",
    total: 0,
    terms: [
      { kind: "dice" as const, sign: 1 as const, count: results.length, sides, results },
      { kind: "flat" as const, sign: (flat < 0 ? -1 : 1) as 1 | -1, value: Math.abs(flat) },
    ],
  },
});

describe("roll feed utils", () => {
  it("flags criticals only on a single natural 20", () => {
    expect(hasCritical([row([20])])).toBe(true);
    expect(hasCritical([row([20, 20])])).toBe(false);
    expect(hasCritical([row([12], 6)])).toBe(false);
  });

  it("builds die chips with natural markers and the signed modifier", () => {
    expect(toDieChips(row([20]).outcome)).toEqual([{ value: 20, sides: 20, natural: "critical" }]);
    expect(toDieChips(row([1, 6], 6).outcome).map((chip) => chip.natural)).toEqual([null, null]);
    expect(flatModifier(row([5]).outcome)).toBe(-1);
    expect(naturalOutcome(row([1]).outcome)).toBe("fumble");
  });

  it("separates long descriptions from short notes", () => {
    expect(splitNotes(["CD 11", "a".repeat(200), "linha\nlinha"])).toEqual({
      short: ["CD 11"],
      long: ["a".repeat(200), "linha\nlinha"],
    });
  });
});
