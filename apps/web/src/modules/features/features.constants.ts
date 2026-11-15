import type { FeatureKey } from "@magista/shared";

import {
  MarkedBackdrop,
  MarkedSharedTrait,
  MarkedSoulPanel,
} from "@/modules/marked/components/organisms";

import type { FeatureTone, IFeatureSheetSlots } from "./features.types";

export const FEATURE_TONE_CLASSES: Record<FeatureTone, string> = {
  gold: "border-gold-400/50 bg-gold-400/10 text-gold-300",
  teal: "border-teal-400/50 bg-teal-900/40 text-teal-300",
  ruby: "border-ruby-400/50 bg-primary/15 text-accent-text",
};

/**
 * Registry of the sheet UI of each special feature. A new feature adds its key to SPECIAL_FEATURES
 * (shared) and its components here.
 */
export const FEATURE_SHEET_SLOTS: Record<FeatureKey, IFeatureSheetSlots> = {
  marked: {
    badgeIcon: "sparkles",
    badgeTone: "gold",
    backdrop: MarkedBackdrop,
    traitsAddon: MarkedSharedTrait,
    traitsSection: MarkedSoulPanel,
  },
};
