import type { ReactNode } from "react";

import type { IconName } from "@/shared/components/atoms";

export interface ArenaNoticeProps {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}
