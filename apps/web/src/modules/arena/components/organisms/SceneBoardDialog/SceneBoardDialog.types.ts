import type { IArenaBoardInput, IArenaScene } from "@magista/shared";

export interface SceneBoardDialogProps {
  scene: IArenaScene;
  /** Saves the board in pixels; resolves to an error message, or null when saved. */
  onSubmit: (board: IArenaBoardInput) => Promise<string | null>;
  onClose: () => void;
}

/** The two size fields as typed (units, with a comma or a dot). */
export interface IBoardDraft {
  width: string;
  height: string;
}
