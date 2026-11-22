import { describe, expect, it } from "vitest";

import { assetProgress, formatMegabytes, runPooled } from "./assets.utils";

const assets = [
  { url: "/a.jpg", label: "Mapa" },
  { url: "/b.png", label: "Selo" },
];

describe("asset progress", () => {
  it("counts bytes when every size is known", () => {
    const progress = assetProgress(
      assets,
      new Map([
        ["/a.jpg", { loaded: 50, total: 100 }],
        ["/b.png", { loaded: 0, total: 100 }],
      ]),
      new Set(),
    );
    expect(progress).toMatchObject({ ratio: 0.25, current: "Mapa", done: false });
  });

  it("counts finished assets when a size is unknown", () => {
    const progress = assetProgress(
      assets,
      new Map([["/a.jpg", { loaded: 50, total: 0 }]]),
      new Set(),
    );
    expect(progress.ratio).toBe(0.25);
  });

  it("is done when all assets finished (or there are none)", () => {
    expect(assetProgress(assets, new Map(), new Set(["/a.jpg", "/b.png"]))).toMatchObject({
      ratio: 1,
      done: true,
      current: null,
    });
    expect(assetProgress([], new Map(), new Set()).done).toBe(true);
  });

  it("formats megabytes in Portuguese", () => {
    expect(formatMegabytes(2_457_000)).toBe("2,5 MB");
  });
});

describe("runPooled", () => {
  it("runs every item in order, never more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    const started: number[] = [];
    await runPooled([1, 2, 3, 4, 5], 2, async (item) => {
      started.push(item);
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
    });
    expect(started).toEqual([1, 2, 3, 4, 5]);
    expect(peak).toBe(2);
  });

  it("finishes at once with nothing to run", async () => {
    await expect(runPooled([], 3, async () => undefined)).resolves.toBeUndefined();
  });
});
