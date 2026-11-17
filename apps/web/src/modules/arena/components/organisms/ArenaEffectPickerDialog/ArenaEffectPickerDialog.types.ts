import type { ArenaChangeKind, ArenaEffectStyle, ArenaResourceKey } from "@magista/shared";

import type { ArenaEffectChoice } from "@/modules/arena/arena.types";

export interface ArenaEffectPickerDialogProps {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  value: ArenaEffectChoice;
  /** What "Automático" plays (defaults to the action's own animation). */
  autoStyle?: ArenaEffectStyle;
  onChoose: (choice: ArenaEffectChoice) => void;
  onClose: () => void;
}
