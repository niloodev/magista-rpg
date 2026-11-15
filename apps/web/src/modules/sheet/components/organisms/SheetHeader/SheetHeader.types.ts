import type { ICharacter } from "@magista/shared";

import type { SheetEditor } from "@/modules/sheet/sheet.types";

export interface SheetHeaderProps {
  character: ICharacter;
  onEdit: SheetEditor;
  isGm: boolean;
  onLevelUp: () => void;
  /** Tag of the character name: h1 on the sheet page, h2 inside another page (floating panel). */
  headingAs?: "h1" | "h2";
}
