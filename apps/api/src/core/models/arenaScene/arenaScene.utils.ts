import type { IArenaScene } from "@magista/shared";

import { mediaUrlOf } from "@/core/services/media";

interface ArenaSceneRow {
  id: string;
  name: string;
  folderId: string | null;
  mapKey: string | null;
  position: number;
}

/**
 * Maps a stored scene to the DTO (the map key becomes its public URL).
 */
export function toArenaScene(row: ArenaSceneRow): IArenaScene {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folderId,
    mapUrl: mediaUrlOf(row.mapKey),
    position: row.position,
  };
}
