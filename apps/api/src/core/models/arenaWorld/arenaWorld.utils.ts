import { decodeFogMask, defaultPartyPosition, emptyFogMask } from "@magista/shared";

import type { ArenaWorldRow, IArenaWorldState } from "./arenaWorld.types";

const fogOf = (bytes: Uint8Array | null): Uint8Array => {
  if (!bytes) return emptyFogMask();
  const fog = Uint8Array.from(bytes);
  return fog.length === emptyFogMask().length ? fog : decodeFogMask(null);
};

/** Maps the arena state row (or its absence) to the world map state. */
export function toArenaWorldState(row: ArenaWorldRow | null): IArenaWorldState {
  if (!row) {
    return {
      live: false,
      activeSceneId: null,
      party: defaultPartyPosition(),
      fog: emptyFogMask(),
      fogVersion: 0,
    };
  }
  return {
    live: row.worldMapLive,
    activeSceneId: row.activeSceneId,
    party: { x: row.partyX, y: row.partyY },
    fog: fogOf(row.fogMask),
    fogVersion: row.fogVersion,
  };
}
