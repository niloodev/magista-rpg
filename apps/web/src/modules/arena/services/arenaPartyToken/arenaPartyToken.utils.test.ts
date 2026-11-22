import { describe, expect, it } from "vitest";

import { mixColor, paletteOf, partyColorAt, pathStrokes } from "./arenaPartyToken.utils";

describe("party token colors", () => {
  it("mixes colors channel by channel", () => {
    expect(mixColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mixColor(0xff0000, 0x0000ff, 1)).toBe(0x0000ff);
  });

  it("holds each color, blends into the next and loops", () => {
    const colors = [0xff0000, 0x00ff00];
    expect(partyColorAt(0, colors, 100, 100)).toBe(0xff0000);
    expect(partyColorAt(90, colors, 100, 100)).toBe(0xff0000);
    expect(partyColorAt(150, colors, 100, 100)).toBe(0x808000);
    expect(partyColorAt(210, colors, 100, 100)).toBe(0x00ff00);
    expect(partyColorAt(400, colors, 100, 100)).toBe(0xff0000);
  });

  it("builds a palette from a color", () => {
    expect(paletteOf(0x000000)).toEqual({ core: 0xcccccc, mid: 0x404040, deep: 0x000000 });
  });
});

describe("rune strokes", () => {
  it("turns a straight-line SVG path into scaled polylines", () => {
    expect(pathStrokes("M0 -9V9M0 -2L-5 -8", 1)).toEqual([
      [
        { x: 0, y: -9 },
        { x: 0, y: 9 },
      ],
      [
        { x: 0, y: -2 },
        { x: -5, y: -8 },
      ],
    ]);
    expect(pathStrokes("M0 -9L5 0L0 9Z", 2)[0]?.at(-1)).toEqual({ x: 0, y: -18 });
    expect(pathStrokes("M-2.5 2H2.5", 1)[0]).toEqual([
      { x: -2.5, y: 2 },
      { x: 2.5, y: 2 },
    ]);
  });
});
