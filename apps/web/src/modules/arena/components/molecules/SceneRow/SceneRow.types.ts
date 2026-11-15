import type { ReactNode } from "react";

import type { DropPosition } from "@/modules/library/library.types";

export interface SceneRowProps {
  name: string;
  mapUrl: string | null;
  live: boolean;
  viewing: boolean;
  onOpen: () => void;
  actions?: ReactNode;
  handle?: ReactNode;
  dropPosition?: DropPosition | null;
  dimmed?: boolean;
}
