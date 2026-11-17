import { describe, expect, it } from "vitest";

import { withSheetEffect } from "./SheetEffectsDialog.utils";

describe("withSheetEffect", () => {
  it("sets a slot and keeps the others", () => {
    const effects = withSheetEffect({ heal: { health: "clarity" } }, "damage", "health", "fissure");
    expect(effects).toEqual({ heal: { health: "clarity" }, damage: { health: "fissure" } });
  });

  it("goes back to the default and drops the empty group", () => {
    expect(withSheetEffect({ damage: { health: "fissure" } }, "damage", "health", "auto")).toEqual(
      {},
    );
  });
});
