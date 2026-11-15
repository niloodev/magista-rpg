import { describe, expect, it } from "vitest";

import { toggleIcon } from "./ArenaPanelToggle.utils";

describe("panel toggle", () => {
  it("points outward to collapse and inward to open", () => {
    expect(toggleIcon("left", true)).toBe("chevron-left");
    expect(toggleIcon("left", false)).toBe("chevron-right");
    expect(toggleIcon("right", true)).toBe("chevron-right");
    expect(toggleIcon("right", false)).toBe("chevron-left");
  });
});
