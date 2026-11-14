import type { IRollResult } from "@magista/shared";

export interface IRollHandlerCallbacks {
  onRolled: (roll: IRollResult) => void;
  onPinged: (entry: IRollResult) => void;
}
