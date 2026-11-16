import type { IArenaPoint } from "@magista/shared";

import type { IconName } from "@/shared/components/atoms";

export interface IArenaTokenMenuItem {
  id: string;
  label: string;
  icon: IconName;
  onSelect: () => void;
  destructive?: boolean;
  /** Draws a thin line above the item (separates groups). */
  separated?: boolean;
}

export interface ArenaTokenMenuProps {
  label: string;
  /** Page point of the right click; the menu opens there, kept inside the window. */
  anchor: IArenaPoint;
  items: IArenaTokenMenuItem[];
  onClose: () => void;
}
