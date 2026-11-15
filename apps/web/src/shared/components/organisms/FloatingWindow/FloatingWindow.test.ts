import { describe, expect, it } from "vitest";

import { clampWindowRect, gestureRect, keyGesture } from "./FloatingWindow.utils";

const viewport = { width: 1440, height: 900 };
const min = { width: 380, height: 420 };

describe("floating window", () => {
  it("keeps the window on screen and within the size limits", () => {
    expect(clampWindowRect({ x: -50, y: 800, width: 200, height: 2000 }, viewport, min)).toEqual({
      x: 0,
      y: 0,
      width: 380,
      height: 900,
    });
    expect(clampWindowRect({ x: 1300, y: 10, width: 500, height: 600 }, viewport, min)).toEqual({
      x: 940,
      y: 10,
      width: 500,
      height: 600,
    });
  });

  it("moves or resizes from a pointer gesture", () => {
    const rect = { x: 100, y: 100, width: 500, height: 600 };
    expect(gestureRect(rect, "move", 20, -10)).toEqual({ ...rect, x: 120, y: 90 });
    expect(gestureRect(rect, "resize", 20, -10)).toEqual({ ...rect, width: 520, height: 590 });
  });

  it("maps Alt+arrows to moves and Alt+Shift+arrows to resizes", () => {
    expect(keyGesture("ArrowLeft", false, 24)).toEqual({ mode: "move", dx: -24, dy: 0 });
    expect(keyGesture("ArrowDown", true, 24)).toEqual({ mode: "resize", dx: 0, dy: 24 });
    expect(keyGesture("a", false, 24)).toBeNull();
  });

  it("keeps the window below a minimum top, even on a short screen", () => {
    expect(
      clampWindowRect({ x: 10, y: 0, width: 500, height: 600 }, viewport, min, 56),
    ).toMatchObject({
      y: 56,
      height: 600,
    });
    expect(
      clampWindowRect({ x: 10, y: 10, width: 500, height: 2000 }, viewport, min, 56),
    ).toMatchObject({
      y: 56,
      height: 844,
    });
    expect(
      clampWindowRect(
        { x: 0, y: 0, width: 500, height: 500 },
        { width: 800, height: 400 },
        min,
        56,
      ),
    ).toMatchObject({ y: 56, height: 420 });
  });
});
