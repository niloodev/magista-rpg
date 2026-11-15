import type { z } from "zod";

import type { FEATURE_KEYS } from "./features.constants";
import type { characterFeaturesSchema, setFeaturesInputSchema } from "./features.schemas";

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type ICharacterFeatures = z.infer<typeof characterFeaturesSchema>;

export type ISetFeaturesInput = z.infer<typeof setFeaturesInputSchema>;

export interface ISpecialFeature {
  key: FeatureKey;
  label: string;
  description: string;
  d20Bonus: number;
  bonusLabel: string;
}

export interface IFeatureBonusTerm {
  label: string;
  value: number;
}

export interface ICharacterFeaturesEvent {
  id: string;
  features: FeatureKey[];
}
