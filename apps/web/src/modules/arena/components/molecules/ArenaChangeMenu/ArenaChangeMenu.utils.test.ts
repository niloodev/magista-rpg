import { describe, expect, it } from "vitest";

import { barAnchor } from "./ArenaChangeMenu.utils";

describe("change menu", () => {
  it("opens centered above the selection bar", () => {
    expect(barAnchor({ left: 100, top: 800, width: 400 }, { width: 300, height: 200 })).toEqual({
      x: 150,
      y: 588,
    });
  });
});
