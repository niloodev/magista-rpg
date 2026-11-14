import { describe, expect, it } from "vitest";

import { parseDiceExpression, rollDiceExpression } from "./dice";

describe("dice", () => {
  it("parses dice, flats and signs", () => {
    expect(parseDiceExpression("2d6 + 3 - 1d4")).toEqual([
      { kind: "dice", sign: 1, count: 2, sides: 6 },
      { kind: "flat", sign: 1, value: 3 },
      { kind: "dice", sign: -1, count: 1, sides: 4 },
    ]);
    expect(parseDiceExpression("d20")).toEqual([{ kind: "dice", sign: 1, count: 1, sides: 20 }]);
  });

  it("rejects invalid expressions", () => {
    for (const bad of ["", "abc", "1d", "2d6 +", "1d0", "500d6", "1d20 * 2"]) {
      expect(parseDiceExpression(bad)).toBeNull();
    }
  });

  it("rolls with the injected source", () => {
    const outcome = rollDiceExpression("2d6 + 3 - 1", (_min, max) => max);
    expect(outcome?.total).toBe(14);
    expect(outcome?.terms[0]).toMatchObject({ results: [6, 6] });
  });
});
