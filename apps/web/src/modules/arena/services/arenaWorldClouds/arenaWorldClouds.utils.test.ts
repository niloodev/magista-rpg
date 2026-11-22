import { WORLD_FOG_COLUMNS, WORLD_FOG_ROWS, emptyFogMask, paintFog } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { coverageGoal, stepCoverage, writeCoverage } from "./arenaWorldClouds.utils";

const total = WORLD_FOG_COLUMNS * WORLD_FOG_ROWS;

describe("world clouds coverage", () => {
  it("moves the cells toward their goal and says when it settles", () => {
    const cells = new Float32Array([0, 1, 0.5]);
    const goal = new Float32Array([1, 0, 0.5]);
    expect(stepCoverage(cells, goal, 0.6)).toBe(true);
    expect([...cells].map((value) => Number(value.toFixed(2)))).toEqual([0.6, 0.4, 0.5]);
    expect(stepCoverage(cells, goal, 0.6)).toBe(false);
    expect([...cells]).toEqual([1, 0, 0.5]);
  });

  it("reads the goal from the fog mask", () => {
    const goal = new Float32Array(total);
    coverageGoal(
      paintFog(emptyFogMask(), { mode: "hide", radius: 5, points: [{ x: 5, y: 5 }] }),
      goal,
    );
    expect(goal[0]).toBe(1);
    expect(goal[1]).toBe(0);
  });

  it("writes the coverage as opaque gray", () => {
    const bytes = new Uint8Array(8);
    writeCoverage(new Float32Array([1, 0.5]), bytes);
    expect([...bytes]).toEqual([255, 255, 255, 255, 128, 128, 128, 255]);
  });
});
