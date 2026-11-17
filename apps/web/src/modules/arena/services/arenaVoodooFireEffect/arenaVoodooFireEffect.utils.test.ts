import { describe, expect, it } from "vitest";

import { slashPath } from "./arenaVoodooFireEffect.utils";

describe("slashPath", () => {
  it("runs from one end to the other, bowed to one side in the middle", () => {
    const points = slashPath({ x: -10, y: 0 }, { x: 10, y: 0 }, 0.2, 10);
    expect(points).toHaveLength(11);
    expect(points[0]).toEqual({ x: -10, y: 0 });
    expect(points[10]).toEqual({ x: 10, y: 0 });
    expect(points[5]?.y).toBeCloseTo(2);
    expect(slashPath({ x: -10, y: 0 }, { x: 10, y: 0 }, -0.2, 10)[5]?.y).toBeCloseTo(-2);
  });
});
