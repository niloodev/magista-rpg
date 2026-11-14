import type { SaveStatus } from "@/modules/sheet/sheet.types";
import type { ConnectionStatus } from "@/modules/table/table.types";

export interface SheetStatusBarProps {
  saveStatus: SaveStatus;
  saveError: string | null;
  connection: ConnectionStatus;
  rollError: string | null;
  onRetrySave: () => void;
}
