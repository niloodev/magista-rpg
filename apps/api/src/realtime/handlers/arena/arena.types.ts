import type { IArenaChangeOutcome, IArenaTokenChange } from "@/core/controllers/arena";

export interface IArenaHandlerCallbacks {
  onMoved: (changes: IArenaTokenChange[]) => void;
  onChanged: (outcome: IArenaChangeOutcome) => void;
}
