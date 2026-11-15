import type { FeatureKey } from "@magista/shared";
import type { ReactNode } from "react";

import type { DropPosition } from "@/modules/library/library.types";

export interface CharacterRowProps {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  portraitUrl: string | null;
  path?: string;
  accountLabels?: string[];
  features?: readonly FeatureKey[];
  actions?: ReactNode;
  handle?: ReactNode;
  dropPosition?: DropPosition | null;
  dimmed?: boolean;
}
