import type { ArenaChangeKind, ArenaResourceKey } from "@magista/shared";

import type { ArenaEffectChoice } from "@/modules/arena/arena.types";

export interface ArenaEffectPickerDialogProps {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  value: ArenaEffectChoice;
  onChoose: (choice: ArenaEffectChoice) => void;
  onClose: () => void;
}
