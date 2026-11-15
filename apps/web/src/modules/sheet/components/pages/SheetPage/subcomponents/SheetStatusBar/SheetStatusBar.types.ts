import type { SaveStatus, SheetVariant } from "@/modules/sheet/sheet.types";
import type { ConnectionStatus } from "@/modules/table/table.types";

export interface SheetStatusBarProps {
  variant: SheetVariant;
  characterId: string;
  characterName: string;
  saveStatus: SaveStatus;
  saveError: string | null;
  connection: ConnectionStatus;
  rollError: string | null;
  onRetrySave: () => void;
}
