import { describe, expect, it } from "vitest";

import { tokenPreviewDiameter } from "./ArenaTokenDragPreview.utils";

describe("tokenPreviewDiameter", () => {
  it("follows the token size on screen within readable limits", () => {
    expect(tokenPreviewDiameter(10)).toBe(40);
    expect(tokenPreviewDiameter(140)).toBe(140);
    expect(tokenPreviewDiameter(63.6)).toBe(64);
    expect(tokenPreviewDiameter(900)).toBe(200);
  });
});
