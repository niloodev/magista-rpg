import type { ICharacter, IDerivedSheet } from "@magista/shared";

import type { SheetEditor } from "@/modules/sheet/sheet.types";

export interface SheetSummaryBarProps {
  character: ICharacter;
  derived: IDerivedSheet;
  onEdit: SheetEditor;
}
