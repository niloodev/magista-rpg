import { describe, expect, it } from "vitest";

import { followRatio, formatUnits, isBoardSide, parseUnits } from "./SceneBoardDialog.utils";

describe("SceneBoardDialog utils", () => {
  it("converts units and pixels like Roll20", () => {
    expect(formatUnits(4096)).toBe("58,51");
    expect(formatUnits(1750)).toBe("25");
    expect(parseUnits("58,5")).toBe(4095);
    expect(parseUnits(" 25 ")).toBe(1750);
    expect(parseUnits("abc")).toBeNull();
    expect(parseUnits("-3")).toBeNull();
  });

  it("checks the board limits", () => {
    expect(isBoardSide(350)).toBe(true);
    expect(isBoardSide(349)).toBe(false);
    expect(isBoardSide(20_001)).toBe(false);
    expect(isBoardSide(null)).toBe(false);
  });

  it("makes the other side follow the map ratio", () => {
    const draft = { width: "58,51", height: "43,89" };
    expect(followRatio(draft, "width", "40", 0.75)).toEqual({ width: "40", height: "30" });
    expect(followRatio(draft, "height", "30", 0.75)).toEqual({ width: "40", height: "30" });
    expect(followRatio(draft, "width", "", 0.75)).toEqual({ width: "", height: "43,89" });
    expect(followRatio(draft, "width", "10", null)).toEqual({ width: "10", height: "43,89" });
  });
});
