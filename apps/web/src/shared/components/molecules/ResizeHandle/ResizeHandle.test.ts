import { describe, expect, it } from "vitest";

import { clampWidth } from "./ResizeHandle.utils";

describe("clampWidth", () => {
  it("keeps widths inside the limits", () => {
    expect(clampWidth(200, 280, 520)).toBe(280);
    expect(clampWidth(900, 280, 520)).toBe(520);
    expect(clampWidth(333.6, 280, 520)).toBe(334);
  });
});
