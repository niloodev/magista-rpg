import { describe, expect, it } from "vitest";

import { menuPosition } from "./ArenaTokenMenu.utils";

const viewport = { width: 1000, height: 800 };
const size = { width: 200, height: 300 };

describe("menuPosition", () => {
  it("opens to the right and below the click", () => {
    expect(menuPosition({ x: 100, y: 100 }, size, viewport)).toEqual({ x: 100, y: 100 });
  });

  it("flips near the right and bottom edges", () => {
    expect(menuPosition({ x: 950, y: 700 }, size, viewport)).toEqual({ x: 750, y: 400 });
  });

  it("never leaves the window", () => {
    expect(menuPosition({ x: 50, y: 200 }, { width: 200, height: 790 }, viewport)).toEqual({
      x: 50,
      y: 8,
    });
  });
});
