import type { ReactNode } from "react";

export interface SkeletonRegionProps {
  label: string;
  className?: string;
  announce?: boolean;
  children: ReactNode;
}
