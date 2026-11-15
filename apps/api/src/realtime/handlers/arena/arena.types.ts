import type { IArenaTokenChange } from "@/core/controllers/arena";

export interface IArenaHandlerCallbacks {
  onMoved: (change: IArenaTokenChange) => void;
}
