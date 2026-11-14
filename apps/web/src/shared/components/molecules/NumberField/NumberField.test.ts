import { describe, expect, it } from "vitest";

import { clamp } from "./NumberField.utils";

describe("NumberField clamp", () => {
  it("clamps to optional bounds", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-2, 0)).toBe(0);
    expect(clamp(7)).toBe(7);
  });
});
