import { describe, expect, it } from "vitest";

import {
  WORLD_FOG_BASE64_LENGTH,
  WORLD_FOG_CELL,
  WORLD_FOG_COLUMNS,
  WORLD_FOG_ROWS,
  WORLD_MAP_BOARD,
  worldFogSchema,
} from "../../schemas/arena";
import {
  canMoveParty,
  clampToWorld,
  decodeFogMask,
  emptyFogMask,
  encodeFogMask,
  fillFog,
  fogCellValues,
  isFogCovered,
  paintFog,
} from "./worldMap";

const cellCenter = (column: number) => (column + 0.5) * WORLD_FOG_CELL;

describe("world map fog", () => {
  it("starts clear and fills both ways", () => {
    expect(isFogCovered(emptyFogMask(), 0, 0)).toBe(false);
    const hidden = fillFog("hide");
    expect(isFogCovered(hidden, 0, 0)).toBe(true);
    expect(isFogCovered(hidden, WORLD_FOG_COLUMNS - 1, WORLD_FOG_ROWS - 1)).toBe(true);
    expect(isFogCovered(fillFog("reveal"), 5, 5)).toBe(false);
  });

  it("treats cells outside the grid as clear", () => {
    const hidden = fillFog("hide");
    expect(isFogCovered(hidden, -1, 0)).toBe(false);
    expect(isFogCovered(hidden, WORLD_FOG_COLUMNS, 0)).toBe(false);
  });

  it("paints a disc around a single point without touching the original", () => {
    const mask = emptyFogMask();
    const painted = paintFog(mask, {
      mode: "hide",
      radius: 25,
      points: [{ x: cellCenter(50), y: cellCenter(40) }],
    });
    expect(isFogCovered(painted, 50, 40)).toBe(true);
    expect(isFogCovered(painted, 52, 40)).toBe(true);
    expect(isFogCovered(painted, 53, 40)).toBe(false);
    expect(isFogCovered(mask, 50, 40)).toBe(false);
  });

  it("paints a capsule between consecutive points", () => {
    const painted = paintFog(emptyFogMask(), {
      mode: "hide",
      radius: 10,
      points: [
        { x: cellCenter(10), y: cellCenter(10) },
        { x: cellCenter(30), y: cellCenter(10) },
      ],
    });
    for (let column = 10; column <= 30; column += 1) {
      expect(isFogCovered(painted, column, 10)).toBe(true);
    }
    expect(isFogCovered(painted, 20, 12)).toBe(false);
  });

  it("reveals what was hidden", () => {
    const revealed = paintFog(fillFog("hide"), {
      mode: "reveal",
      radius: 15,
      points: [{ x: cellCenter(5), y: cellCenter(5) }],
    });
    expect(isFogCovered(revealed, 5, 5)).toBe(false);
    expect(isFogCovered(revealed, 9, 5)).toBe(true);
  });

  it("round-trips through base64 with the schema length", () => {
    const painted = paintFog(emptyFogMask(), {
      mode: "hide",
      radius: 40,
      points: [{ x: 300, y: 300 }],
    });
    const encoded = encodeFogMask(painted);
    expect(encoded).toHaveLength(WORLD_FOG_BASE64_LENGTH);
    expect(worldFogSchema.safeParse(encoded).success).toBe(true);
    expect(decodeFogMask(encoded)).toEqual(painted);
  });

  it("decodes anything invalid as a clear mask", () => {
    expect(decodeFogMask(null)).toEqual(emptyFogMask());
    expect(decodeFogMask("AAAA")).toEqual(emptyFogMask());
    expect(decodeFogMask("%%%")).toEqual(emptyFogMask());
  });

  it("expands the mask to one byte per cell", () => {
    const values = fogCellValues(
      paintFog(emptyFogMask(), { mode: "hide", radius: 5, points: [{ x: 5, y: 5 }] }),
    );
    expect(values).toHaveLength(WORLD_FOG_COLUMNS * WORLD_FOG_ROWS);
    expect(values[0]).toBe(255);
    expect(values[1]).toBe(0);
  });
});

describe("world map party", () => {
  it("lets the GM move it always and players only while live", () => {
    expect(canMoveParty({ role: "GM" }, false)).toBe(true);
    expect(canMoveParty({ role: "PLAYER" }, true)).toBe(true);
    expect(canMoveParty({ role: "PLAYER" }, false)).toBe(false);
  });

  it("keeps the party inside the map", () => {
    expect(clampToWorld({ x: -5, y: 99_999 })).toEqual({ x: 0, y: WORLD_MAP_BOARD.height });
  });
});
