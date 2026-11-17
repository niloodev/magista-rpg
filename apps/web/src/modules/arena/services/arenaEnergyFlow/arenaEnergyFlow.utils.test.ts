import { describe, expect, it } from "vitest";

import {
  buildRibbon,
  channelPath,
  circlePath,
  colorChannels,
  resamplePath,
} from "./arenaEnergyFlow.utils";

describe("resamplePath", () => {
  it("spaces points evenly along the path, keeping its ends", () => {
    const points = resamplePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      5,
    );
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[2]).toEqual({ x: 10, y: 0 });
    expect(points[4]).toEqual({ x: 10, y: 10 });
  });
});

describe("buildRibbon", () => {
  it("puts a vertex on each side of every point, UVs along and across, and two triangles per segment", () => {
    const ribbon = buildRibbon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      4,
    );
    expect(Array.from(ribbon.positions)).toEqual([0, 2, 0, -2, 10, 2, 10, -2]);
    expect(Array.from(ribbon.uvs)).toEqual([0, 0, 0, 1, 1, 0, 1, 1]);
    expect(Array.from(ribbon.indices)).toEqual([0, 1, 2, 1, 3, 2]);
    expect(ribbon.length).toBe(10);
  });

  it("follows a width that changes along the ribbon", () => {
    const ribbon = buildRibbon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      (along) => 2 + along * 2,
    );
    expect(ribbon.positions[1]).toBe(1);
    expect(ribbon.positions[5]).toBe(2);
  });
});

describe("circlePath", () => {
  it("closes on itself", () => {
    const points = circlePath(10, 9);
    expect(points[0]?.x).toBeCloseTo(10);
    expect(points[8]?.x).toBeCloseTo(10);
    expect(points[8]?.y).toBeCloseTo(0);
  });
});

describe("colorChannels", () => {
  it("splits a color into 0 to 1 channels", () => {
    expect(colorChannels(0xff8000)).toEqual([1, 128 / 255, 0]);
  });
});

describe("channelPath", () => {
  it("runs from one point to the other, bowing to the side", () => {
    const points = channelPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.3, 0, 11);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[10]?.x).toBeCloseTo(100);
    expect(points[10]?.y).toBeCloseTo(0);
    expect(Math.max(...points.map((point) => point.y))).toBeGreaterThan(10);
  });
});
