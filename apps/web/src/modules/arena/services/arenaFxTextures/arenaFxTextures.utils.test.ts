import { describe, expect, it } from "vitest";

import { FX_ATLAS_COLUMNS, FX_FRAME_SIZE } from "./arenaFxTextures.constants";
import { atlasCell, smooth } from "./arenaFxTextures.utils";

describe("atlasCell", () => {
  it("fills a row and wraps to the next one", () => {
    expect(atlasCell(0)).toEqual({ x: 0, y: 0 });
    expect(atlasCell(FX_ATLAS_COLUMNS - 1)).toEqual({
      x: (FX_ATLAS_COLUMNS - 1) * FX_FRAME_SIZE,
      y: 0,
    });
    expect(atlasCell(FX_ATLAS_COLUMNS + 2)).toEqual({ x: 2 * FX_FRAME_SIZE, y: FX_FRAME_SIZE });
  });
});

describe("smooth", () => {
  it("eases from 0 to 1 and clamps outside", () => {
    expect(smooth(-1)).toBe(0);
    expect(smooth(0.5)).toBe(0.5);
    expect(smooth(2)).toBe(1);
    expect(smooth(0.25)).toBeLessThan(0.25);
  });
});
