import { describe, expect, it } from "vitest";

import { castArc } from "./arenaCastEffect.utils";

describe("cast arc", () => {
  it("leaves the caster, bows up and lands on the target", () => {
    expect(castArc({ x: 200, y: 0 }, 0)).toEqual({ x: 0, y: 0 });
    expect(castArc({ x: 200, y: 0 }, 1)).toEqual({ x: 200, y: 0 });
    expect(castArc({ x: 200, y: 0 }, 0.5).y).toBeLessThan(0);
  });
});
