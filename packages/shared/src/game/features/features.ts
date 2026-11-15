import { FEATURE_KEYS, SPECIAL_FEATURES } from "./features.constants";
import type { FeatureKey, IFeatureBonusTerm } from "./features.types";

/**
 * Whether a character carries a special feature tag.
 */
export function hasFeature(features: readonly FeatureKey[], key: FeatureKey): boolean {
  return features.includes(key);
}

/**
 * Bonus terms every d20 test of the character gains from its special features, in catalog order.
 */
export function featureBonusTerms(features: readonly FeatureKey[]): IFeatureBonusTerm[] {
  return FEATURE_KEYS.filter((key) => features.includes(key))
    .map((key) => SPECIAL_FEATURES[key])
    .filter((feature) => feature.d20Bonus !== 0)
    .map((feature) => ({ label: feature.bonusLabel, value: feature.d20Bonus }));
}

/**
 * Total bonus added to every d20 test of the character.
 */
export function featureD20Bonus(features: readonly FeatureKey[]): number {
  return featureBonusTerms(features).reduce((sum, term) => sum + term.value, 0);
}

/**
 * Keeps only known feature keys, without duplicates, in catalog order (tolerates legacy rows).
 */
export function normalizeFeatures(values: readonly string[]): FeatureKey[] {
  return FEATURE_KEYS.filter((key) => values.includes(key));
}
