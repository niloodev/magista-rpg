import type { ICharacter } from "@magista/shared";

import type { SheetEditor } from "@/modules/sheet/sheet.types";

export interface SheetHeaderProps {
  character: ICharacter;
  onEdit: SheetEditor;
  isGm: boolean;
  onLevelUp: () => void;
}
