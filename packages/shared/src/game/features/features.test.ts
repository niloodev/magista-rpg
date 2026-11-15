import { describe, expect, it } from "vitest";

import { featureBonusTerms, featureD20Bonus, hasFeature, normalizeFeatures } from "./features";
import { setFeaturesInputSchema } from "./features.schemas";

describe("features", () => {
  it("detects a feature tag", () => {
    expect(hasFeature(["marked"], "marked")).toBe(true);
    expect(hasFeature([], "marked")).toBe(false);
  });

  it("sums the d20 bonus of the Marca", () => {
    expect(featureD20Bonus(["marked"])).toBe(2);
    expect(featureD20Bonus([])).toBe(0);
    expect(featureBonusTerms(["marked"])).toEqual([{ label: "Marca", value: 2 }]);
  });

  it("drops unknown and repeated keys", () => {
    expect(normalizeFeatures(["x", "marked", "marked"])).toEqual(["marked"]);
  });

  it("rejects repeated or unknown tags in the input", () => {
    expect(setFeaturesInputSchema.safeParse({ features: ["marked"] }).success).toBe(true);
    expect(setFeaturesInputSchema.safeParse({ features: ["marked", "marked"] }).success).toBe(
      false,
    );
    expect(setFeaturesInputSchema.safeParse({ features: ["other"] }).success).toBe(false);
  });
});
