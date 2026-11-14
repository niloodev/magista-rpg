import type { DropPosition } from "@/modules/library/library.types";
import type { ReactNode } from "react";

export interface CharacterRowProps {
  name: string;
  subtitle: string;
  href: string;
  portraitUrl: string | null;
  path?: string;
  accountLabels?: string[];
  actions?: ReactNode;
  handle?: ReactNode;
  dropPosition?: DropPosition | null;
  dimmed?: boolean;
}
