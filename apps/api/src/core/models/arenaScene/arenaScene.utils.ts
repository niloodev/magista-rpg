import { resolveBoard, type IArenaBounds, type IArenaScene } from "@magista/shared";

import { mediaUrlOf } from "@/core/services/media";

export interface ArenaSceneRow {
  id: string;
  name: string;
  folderId: string | null;
  mapKey: string | null;
  mapWidth: number | null;
  mapHeight: number | null;
  boardWidth: number | null;
  boardHeight: number | null;
  position: number;
}

/**
 * Maps a stored scene to the DTO (the map key becomes its public URL and the board is always resolved).
 */
export function toArenaScene(row: ArenaSceneRow): IArenaScene {
  const board = resolveBoard(row);
  return {
    id: row.id,
    name: row.name,
    folderId: row.folderId,
    mapUrl: mediaUrlOf(row.mapKey),
    width: board.width,
    height: board.height,
    mapWidth: row.mapKey ? row.mapWidth : null,
    mapHeight: row.mapKey ? row.mapHeight : null,
    position: row.position,
  };
}

/**
 * The natural size of a stored scene's map, or null when it has none (or it was never measured).
 */
export function mapSizeOf(row: ArenaSceneRow): IArenaBounds | null {
  return row.mapKey && row.mapWidth !== null && row.mapHeight !== null
    ? { width: row.mapWidth, height: row.mapHeight }
    : null;
}
