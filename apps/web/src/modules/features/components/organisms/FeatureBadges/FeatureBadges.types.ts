import type { FeatureKey } from "@magista/shared";

export interface FeatureBadgesProps {
  features: readonly FeatureKey[];
  size?: "sm" | "md";
  /** Most badges shown at once (the last slot becomes "+N" when there are more). */
  max?: number;
  /** Below `sm` each badge shows only its icon (the name stays for screen readers and in the title). */
  compact?: boolean;
}
