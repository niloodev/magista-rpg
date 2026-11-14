import type { ActionMenuItem } from "@/shared/components/molecules";

export interface ICharacterRowItem {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  portraitUrl: string | null;
  path?: string;
  accountLabels?: string[];
  menu?: ActionMenuItem[];
}

export interface CharacterRowListProps {
  label: string;
  items: ICharacterRowItem[];
  emptyText: string;
}
