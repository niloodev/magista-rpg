import { FEATURE_SHEET_SLOTS } from "@/modules/features/features.constants";

import type { FeatureSlotsProps } from "./FeatureSlots.types";

export function FeatureSlots({ features, slot, ...props }: FeatureSlotsProps) {
  return features.map((key) => {
    const Slot = FEATURE_SHEET_SLOTS[key][slot];
    return Slot ? <Slot key={key} {...props} /> : null;
  });
}
