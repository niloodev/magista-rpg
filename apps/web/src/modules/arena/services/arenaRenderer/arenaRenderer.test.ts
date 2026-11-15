import { describe, expect, it } from "vitest";

import {
  approach,
  centerCamera,
  clampZoom,
  fitCamera,
  fitTextureSize,
  parseStoredCamera,
  scaleTokenSize,
  screenToWorld,
  tokensInRect,
  zoomAt,
} from "./arenaRenderer.utils";

describe("arena camera", () => {
  it("fits the whole map in the viewport, centered", () => {
    const camera = fitCamera({ width: 2000, height: 1000 }, { width: 1096, height: 1096 });
    expect(camera.scale).toBeCloseTo(0.5);
    expect(camera.x).toBeCloseTo(48);
    expect(camera.y).toBeCloseTo(298);
  });

  it("keeps the point under the cursor still when zooming", () => {
    const camera = { x: 100, y: 50, scale: 1 };
    const before = screenToWorld(camera, { x: 400, y: 300 });
    const zoomed = zoomAt(camera, 2, { x: 400, y: 300 });
    expect(zoomed.scale).toBe(2);
    expect(screenToWorld(zoomed, { x: 400, y: 300 })).toEqual(before);
  });

  it("clamps the zoom", () => {
    expect(clampZoom(100)).toBe(4);
    expect(clampZoom(0)).toBe(0.08);
  });

  it("leaves the top bar out of the fitted area", () => {
    const camera = fitCamera({ width: 2000, height: 1000 }, { width: 1096, height: 1152 }, 56);
    expect(camera.scale).toBeCloseTo(0.5);
    expect(camera.y).toBeCloseTo(56 + 298);
  });

  it("centers a map point keeping the zoom", () => {
    const camera = centerCamera(
      { x: 0, y: 0, scale: 2 },
      { x: 100, y: 50 },
      { width: 800, height: 600 },
    );
    expect(camera).toEqual({ x: 200, y: 200, scale: 2 });
  });

  it("eases toward a target and snaps when close", () => {
    expect(approach(0, 100, 0.5, 0.5)).toBe(50);
    expect(approach(99.8, 100, 0.5, 0.5)).toBe(100);
  });

  it("reads only well formed stored cameras", () => {
    expect(parseStoredCamera('{"x":1,"y":2,"scale":9}')).toEqual({ x: 1, y: 2, scale: 4 });
    for (const raw of [null, "", "nope", "[]", '{"x":"1","y":2,"scale":1}', '{"x":1,"y":2}'])
      expect(parseStoredCamera(raw)).toBeNull();
  });

  it("shrinks textures above the GPU limit keeping the ratio", () => {
    expect(fitTextureSize(8000, 4000, 4096)).toEqual({ width: 4096, height: 2048, scaled: true });
    expect(fitTextureSize(1000, 800, 4096)).toEqual({ width: 1000, height: 800, scaled: false });
  });

  it("picks the tokens whose center is inside the selection box", () => {
    const tokens = [
      { id: "a", x: 10, y: 10 },
      { id: "b", x: 50, y: 50 },
      { id: "c", x: 200, y: 20 },
    ];
    expect(tokensInRect(tokens, { x: 60, y: 60 }, { x: 0, y: 0 })).toEqual(["a", "b"]);
    expect(tokensInRect(tokens, { x: 300, y: 300 }, { x: 250, y: 250 })).toEqual([]);
  });

  it("scales token sizes inside the allowed range", () => {
    expect(scaleTokenSize(140, 1.5)).toBe(210);
    expect(scaleTokenSize(140, 0.1)).toBe(40);
    expect(scaleTokenSize(500, 2)).toBe(600);
  });

  it("also leaves the bottom controls out of the fitted area", () => {
    const camera = fitCamera({ width: 2000, height: 1000 }, { width: 1096, height: 1224 }, 56, 72);
    expect(camera.scale).toBeCloseTo(0.5);
    expect(camera.y).toBeCloseTo(56 + 298);
  });
});
