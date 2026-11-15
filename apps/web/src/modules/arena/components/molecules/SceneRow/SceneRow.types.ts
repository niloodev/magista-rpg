import type { ReactNode } from "react";

import type { DropPosition } from "@/modules/library/library.types";

export interface SceneRowProps {
  name: string;
  /** Whether the scene has a map at all. */
  hasMap: boolean;
  /** Small version of the map for the row (never the full map), or null to show the map icon. */
  thumbUrl: string | null;
  live: boolean;
  viewing: boolean;
  onOpen: () => void;
  actions?: ReactNode;
  handle?: ReactNode;
  dropPosition?: DropPosition | null;
  dimmed?: boolean;
}
