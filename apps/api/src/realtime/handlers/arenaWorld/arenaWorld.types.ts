import type { IArenaWorldFogEvent, IWorldPoint } from "@magista/shared";

import type { IArenaWorldChange } from "@/core/controllers/arenaWorld";

export interface IArenaWorldHandlerCallbacks {
  onPartyMoved: (change: IArenaWorldChange<IWorldPoint>) => void;
  onFogChanged: (change: IArenaWorldChange<IArenaWorldFogEvent>) => void;
}
