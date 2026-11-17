import type { IRollResult } from "@magista/shared";

import type { IArenaTurnDelivery, IArenaTurnRolls } from "@/core/controllers/arenaTurn";

export interface IArenaTurnHandlerCallbacks {
  onTurns: (delivery: IArenaTurnDelivery) => void;
  /** Initiatives rolled from the token menu: the character ones as sheet rolls, the NPC ones in secret. */
  onRolling: (rolls: IArenaTurnRolls, results: IRollResult[]) => void;
}
