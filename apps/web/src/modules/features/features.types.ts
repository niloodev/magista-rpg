import type { ISheetTrait } from "@magista/shared";
import type { ComponentType } from "react";

import type { IconName } from "@/shared/components/atoms";

/** What every sheet slot of a special feature receives. */
export interface FeatureSlotProps {
  characterId: string;
  traits: ISheetTrait[];
  /** Saves pending sheet edits before the feature talks to the server. */
  onBeforeShare: () => Promise<void>;
}

export type FeatureSlotName = "backdrop" | "traitsAddon" | "traitsSection";

export type FeatureTone = "gold" | "teal" | "ruby";

/** UI a special feature plugs into the sheet; every slot is optional. */
export interface IFeatureSheetSlots {
  badgeIcon: IconName;
  badgeTone: FeatureTone;
  backdrop?: ComponentType<FeatureSlotProps>;
  traitsAddon?: ComponentType<FeatureSlotProps>;
  traitsSection?: ComponentType<FeatureSlotProps>;
}
