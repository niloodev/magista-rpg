import { describe, expect, it } from "vitest";

import { splitBadges } from "./features.utils";

describe("features utils", () => {
  it("shows every tag without a limit or when they fit", () => {
    expect(splitBadges(["marked"])).toMatchObject({ shown: ["marked"], hiddenCount: 0 });
    expect(splitBadges(["marked"], 2)).toMatchObject({ shown: ["marked"], hiddenCount: 0 });
  });

  it("folds the extra tags into the last slot", () => {
    const many = ["marked", "marked", "marked"] as const;
    expect(splitBadges(many, 2)).toMatchObject({
      shown: ["marked"],
      hiddenCount: 2,
      hiddenLabel: "Marcado, Marcado",
    });
  });
});
