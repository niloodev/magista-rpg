import type { IconName } from "@/shared/components/atoms";

export interface ActionMenuItem {
  label: string;
  icon: IconName;
  onSelect: () => void;
  destructive?: boolean;
}

export interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
  className?: string;
}
