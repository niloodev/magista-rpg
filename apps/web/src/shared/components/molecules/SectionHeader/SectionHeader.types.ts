import type { ElementType, ReactNode } from "react";

import type { IconName } from "@/shared/components/atoms";

export interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  aside?: ReactNode;
  as?: ElementType;
}
