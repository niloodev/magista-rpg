import type { FeatureKey, ICharacterSummary } from "@magista/shared";

import type { ITreeOutsidePreview } from "@/modules/library/components/organisms/FolderTree";
import type { ActionMenuItem } from "@/shared/components/molecules";

export interface ICharacterRowItem {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  portraitUrl: string | null;
  path?: string;
  accountLabels?: string[];
  features?: FeatureKey[];
  menu?: ActionMenuItem[];
  /** The sheet behind the row (what a drag onto the map places). */
  character?: ICharacterSummary;
}

export interface CharacterRowListProps {
  label: string;
  items: ICharacterRowItem[];
  emptyText: string;
  onOpen?: (characterId: string) => void;
  /** Rows can be dragged out (native drag, the sheet id under `CHARACTER_DRAG_TYPE`). */
  draggable?: boolean;
  /** What the dragged row turns into over a spot where it can be dropped (the token on the Arena map). */
  dragPreview?: ITreeOutsidePreview<ICharacterSummary>;
}

/** A row being dragged out of the list and the page point under the pointer. */
export interface ICharacterRowDrag {
  item: ICharacterRowItem;
  point: { x: number; y: number };
}
