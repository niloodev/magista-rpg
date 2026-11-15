import { describe, expect, it } from "vitest";

import { TAB_BASE, TAB_DENSE, TAB_REGULAR, TAB_REGULAR_CONTAINER } from "./Tabs.constants";
import { tabVariantClasses } from "./Tabs.utils";

describe("tabVariantClasses", () => {
  it("measures by the screen by default, dense or regular", () => {
    expect(tabVariantClasses(false, false)).toBe(`${TAB_BASE.viewport} ${TAB_REGULAR}`);
    expect(tabVariantClasses(true, false)).toBe(`${TAB_BASE.viewport} ${TAB_DENSE}`);
  });

  it("measures by the container when asked, ignoring dense", () => {
    expect(tabVariantClasses(false, true)).toBe(`${TAB_BASE.container} ${TAB_REGULAR_CONTAINER}`);
    expect(tabVariantClasses(true, true)).toBe(`${TAB_BASE.container} ${TAB_REGULAR_CONTAINER}`);
  });
});
