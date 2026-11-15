import type { FeatureKey } from "@magista/shared";

import type { FeatureSlotName, FeatureSlotProps } from "@/modules/features/features.types";

export interface FeatureSlotsProps extends FeatureSlotProps {
  features: readonly FeatureKey[];
  slot: FeatureSlotName;
}
