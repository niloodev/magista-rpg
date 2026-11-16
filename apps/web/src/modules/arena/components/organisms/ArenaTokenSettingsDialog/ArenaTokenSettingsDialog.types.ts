import type { IAccount, IUpdateArenaTokenInput } from "@magista/shared";

import type { ArenaTokenImageChange } from "@/modules/arena/arena.types";
import type { IArenaTokenSettingsTarget } from "@/modules/arena/hooks";
import type { LoadStatus } from "@/shared/types";

export interface ArenaTokenSettingsDialogProps {
  target: IArenaTokenSettingsTarget;
  accounts: IAccount[];
  accountsStatus: LoadStatus;
  onRetryAccounts: () => void;
  onSubmit: (input: IUpdateArenaTokenInput, image: ArenaTokenImageChange) => Promise<string | null>;
  onOpenSheet: (characterId: string) => void;
  onClose: () => void;
}
