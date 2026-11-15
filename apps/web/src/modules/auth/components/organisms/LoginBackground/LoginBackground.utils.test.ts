import { describe, expect, it } from "vitest";

import { isSettled } from "./LoginBackground.utils";

describe("isSettled", () => {
  it("stops only when the layers reached the cursor", () => {
    expect(isSettled({ x: 0.1, y: 0.1 }, { x: 0.1001, y: 0.1 })).toBe(true);
    expect(isSettled({ x: 0, y: 0 }, { x: 0.2, y: 0 })).toBe(false);
    expect(isSettled({ x: 0, y: 0 }, { x: 0, y: 0.2 })).toBe(false);
  });
});
