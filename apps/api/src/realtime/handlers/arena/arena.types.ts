import type { IArenaDragRelay, IArenaTokenChange } from "@/core/controllers/arena";

export interface IArenaHandlerCallbacks {
  onMoved: (change: IArenaTokenChange) => void;
  onDragged: (relay: IArenaDragRelay, socketId: string) => void;
}
