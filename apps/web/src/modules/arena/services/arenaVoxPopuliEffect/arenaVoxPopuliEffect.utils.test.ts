import { describe, expect, it } from "vitest";

import { seededRandom } from "@/modules/arena/services/arenaTokenEffects";

import {
  buildRumorCells,
  fracturePattern,
  gothicArch,
  rayToPolygon,
} from "./arenaVoxPopuliEffect.utils";

describe("gothicArch", () => {
  it("is a rectangle under a pointed arch whose apex is at the top", () => {
    const outline = gothicArch(100, 200);
    expect(outline[0]).toEqual({ x: -50, y: 100 });
    const top = Math.min(...outline.map((point) => point.y));
    expect(top).toBeCloseTo(-100, 0);
  });
});

describe("rayToPolygon", () => {
  const square = [
    { x: -10, y: -10 },
    { x: 10, y: -10 },
    { x: 10, y: 10 },
    { x: -10, y: 10 },
  ];

  it("measures the way out of the polygon", () => {
    expect(rayToPolygon({ x: 0, y: 0 }, 0, square)).toBeCloseTo(10);
    expect(rayToPolygon({ x: 0, y: 0 }, Math.PI / 4, square)).toBeCloseTo(Math.SQRT2 * 10);
  });
});

describe("buildRumorCells", () => {
  it("cuts rays and a ring around the eye and lights the pupil last", () => {
    const { cells } = buildRumorCells(100, 140, 12, seededRandom(3));
    expect(cells.filter((cell) => cell.kind === "ray")).toHaveLength(12);
    expect(cells.filter((cell) => cell.kind === "ring")).toHaveLength(12);
    const last = [...cells].sort((a, b) => b.order - a.order)[0];
    expect(last?.kind).toBe("pupil");
    expect(cells.every((cell) => cell.order >= 0 && cell.order <= 1)).toBe(true);
  });
});

describe("fracturePattern", () => {
  it("starts every radial at the impact and joins them with rings, missing a few", () => {
    const center = { x: 50, y: 40 };
    const fracture = fracturePattern(center, 200, seededRandom(9), 10);
    const mains = fracture.radials.filter((line) => line.from === 0);
    expect(mains).toHaveLength(10);
    expect(mains.every((line) => line.points[0] === center)).toBe(true);
    expect(fracture.rings.length).toBeGreaterThan(20);
    expect(fracture.rings.length).toBeLessThan(60);
    expect(fracture.crush.length).toBeGreaterThan(0);
  });
});
