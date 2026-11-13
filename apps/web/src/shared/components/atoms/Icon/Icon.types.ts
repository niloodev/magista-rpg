import type { LucideProps } from "lucide-react";

import type { ICONS } from "./Icon.constants";

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}
