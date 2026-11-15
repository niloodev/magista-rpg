import { SPECIAL_FEATURES, type FeatureKey } from "@magista/shared";

/**
 * Splits the tags of a character into the badges shown and the ones folded into a "+N" chip.
 * Without a limit every tag is shown.
 */
export function splitBadges(features: readonly FeatureKey[], max?: number) {
  const limit =
    max === undefined || features.length <= max ? features.length : Math.max(0, max - 1);
  const hidden = features.slice(limit);
  return {
    shown: features.slice(0, limit),
    hiddenCount: hidden.length,
    hiddenLabel: hidden.map((key) => SPECIAL_FEATURES[key].label).join(", "),
  };
}
