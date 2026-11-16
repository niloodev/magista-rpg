import type { TokenStyle } from "@magista/shared";

export interface ArenaImageTokenDialogProps {
  /** Images dropped on the map (already checked for type and size). */
  files: File[];
  /** Creates the tokens; resolves to an error message (shown in the form alert) or null. */
  onSubmit: (names: string[], style: TokenStyle) => Promise<string | null>;
  onClose: () => void;
}
