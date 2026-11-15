import type { ReactNode } from "react";

import type { IconName } from "@/shared/components/atoms";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon?: IconName;
  className?: string;
}

export interface TabsProps<K extends string> {
  items: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  label: string;
  idPrefix: string;
  /** Smaller tabs for narrow panels (sidebars). */
  dense?: boolean;
  /** Decide the narrow and wide layouts by the nearest `@container` instead of the screen (takes precedence over `dense`). */
  container?: boolean;
}

export interface TabPanelProps {
  idPrefix: string;
  tabKey: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}
