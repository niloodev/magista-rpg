import type { SheetSectionProps } from "@/modules/sheet/sheet.types";
import type { IconName } from "@/shared/components/atoms";

export type AbilityListKey = "abilities" | "innerRealm";

export interface AbilitiesPanelProps extends SheetSectionProps {
  list: AbilityListKey;
  title: string;
  entityLabel: string;
  icon: IconName;
  emptyLabel: string;
}
