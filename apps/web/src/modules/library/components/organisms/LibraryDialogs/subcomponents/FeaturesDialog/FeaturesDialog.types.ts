import type { FeatureKey } from "@magista/shared";

export interface FeaturesDialogProps {
  characterName: string;
  initialFeatures: FeatureKey[];
  onSubmit: (features: FeatureKey[]) => Promise<string | null>;
  onClose: () => void;
}

export type FeaturesDialogHookProps = Pick<FeaturesDialogProps, "initialFeatures" | "onSubmit">;
