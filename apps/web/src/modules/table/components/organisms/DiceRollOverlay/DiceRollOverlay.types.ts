import type { IRollResult } from "@magista/shared";

export type DicePhase = "rolling" | "adding" | "result";

export interface DiceRollOverlayProps {
  roll: IRollResult;
  onClose: () => void;
}
