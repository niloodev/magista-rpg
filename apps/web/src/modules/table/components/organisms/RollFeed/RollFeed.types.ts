import type { IRollPending, IRollResult } from "@magista/shared";

export interface RollFeedProps {
  rolls: IRollResult[];
  /** Rolls still in the air (shown only where the table watches the suspense, like the Arena). */
  pending?: IRollPending[];
  loading?: boolean;
  nested?: boolean;
  /** Hint under "Nenhuma rolagem ainda." (the sheet explains how to roll; other screens can say something else). */
  emptyHint?: string;
  className?: string;
}
