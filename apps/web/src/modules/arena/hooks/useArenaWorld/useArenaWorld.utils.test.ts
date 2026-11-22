import { WORLD_FOG_CELL, emptyFogMask, encodeFogMask, isFogCovered } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { appendStroke, shownFog } from "./useArenaWorld.utils";

describe("world fog brush", () => {
  it("shows the pending batches over the server fog", () => {
    const fog = shownFog(encodeFogMask(emptyFogMask()), [
      { mode: "hide", radius: 20, points: [{ x: 5 * WORLD_FOG_CELL, y: 5 * WORLD_FOG_CELL }] },
    ]);
    expect(isFogCovered(fog, 4, 4)).toBe(true);
    expect(isFogCovered(fog, 20, 20)).toBe(false);
  });

  it("joins segments into one batch and starts over on another brush", () => {
    const first = appendStroke(null, {
      mode: "hide",
      radius: 30,
      points: [{ x: 1, y: 1 }],
    });
    const joined = appendStroke(first, {
      mode: "hide",
      radius: 30,
      points: [
        { x: 1, y: 1 },
        { x: 9, y: 9 },
      ],
    });
    expect(joined.points).toEqual([
      { x: 1, y: 1 },
      { x: 9, y: 9 },
    ]);
    const other = appendStroke(joined, { mode: "reveal", radius: 30, points: [{ x: 2, y: 2 }] });
    expect(other).toEqual({ mode: "reveal", radius: 30, points: [{ x: 2, y: 2 }] });
  });
});
