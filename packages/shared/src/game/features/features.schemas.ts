import { z } from "zod";

import { FEATURE_KEYS, FEATURES_MAX } from "./features.constants";

export const featureKeySchema = z.enum(FEATURE_KEYS);

export const characterFeaturesSchema = z
  .array(featureKeySchema)
  .max(FEATURES_MAX)
  .refine((keys) => new Set(keys).size === keys.length, { message: "Tag repetida." });

export const setFeaturesInputSchema = z.object({ features: characterFeaturesSchema });
