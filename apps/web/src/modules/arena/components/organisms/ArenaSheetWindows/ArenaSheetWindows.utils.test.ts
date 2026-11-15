import { describe, expect, it } from "vitest";

import { defaultSheetWindowRect, omitRect, parseSheetWindowRect } from "./ArenaSheetWindows.utils";

describe("sheet window utils", () => {
  it("opens windows next to the roll feed, cascading", () => {
    const viewport = { width: 1440, height: 900 };
    expect(defaultSheetWindowRect(0, { left: 340, right: 0 }, viewport)).toEqual({
      x: 364,
      y: 72,
      width: 640,
      height: 740,
    });
    expect(defaultSheetWindowRect(1, { left: 340, right: 0 }, viewport)).toMatchObject({
      x: 396,
      y: 104,
    });
    expect(
      defaultSheetWindowRect(0, { left: 323, right: 341 }, { width: 1024, height: 900 }),
    ).toMatchObject({
      x: 347,
      width: 380,
    });
  });

  it("reads saved rects safely and forgets a docked window", () => {
    expect(parseSheetWindowRect('{"x":1,"y":2,"width":500,"height":600}')).toEqual({
      x: 1,
      y: 2,
      width: 500,
      height: 600,
    });
    expect(parseSheetWindowRect('{"x":"1"}')).toBeNull();
    expect(parseSheetWindowRect("nope")).toBeNull();
    expect(parseSheetWindowRect(null)).toBeNull();
    const rect = { x: 0, y: 0, width: 400, height: 500 };
    expect(omitRect({ a: rect, b: rect }, "a")).toEqual({ b: rect });
  });
});
