import { Graphics } from "pixi.js";
import { describe, expect, it } from "vitest";

import { paintFalloff } from "./arenaFxScreen.utils";

describe("paintFalloff", () => {
  it("paints nothing when there is no room between the opening and the edge", () => {
    const g = new Graphics();
    paintFalloff(g, 0, 0, 100, 50, 0, 1);
    expect(g.bounds.width).toBe(0);
  });

  it("reaches out to the edge and no further", () => {
    const g = new Graphics();
    paintFalloff(g, 0, 0, 50, 200, 0, 1);
    expect(g.bounds.width).toBeGreaterThan(380);
    expect(g.bounds.width).toBeLessThan(420);
  });
});
