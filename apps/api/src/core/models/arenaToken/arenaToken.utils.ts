import type { IArenaToken } from "@magista/shared";

import { mediaUrlOf } from "@/core/services/media";

interface ArenaTokenRow {
  id: string;
  sceneId: string;
  characterId: string | null;
  name: string | null;
  imageKey: string | null;
  x: number;
  y: number;
  size: number;
  hidden: boolean;
  position: number;
  character: { name: string; avatarKey: string | null; artKey: string | null } | null;
}

/**
 * Maps a stored token to the DTO: a character token takes the character's name and portrait (avatar, then art),
 * an NPC its own name and image.
 */
export function toArenaToken(row: ArenaTokenRow): IArenaToken {
  const character = row.character;
  return {
    id: row.id,
    sceneId: row.sceneId,
    characterId: row.characterId,
    name: row.name ?? character?.name ?? "",
    imageUrl:
      mediaUrlOf(row.imageKey) ??
      mediaUrlOf(character?.avatarKey ?? null) ??
      mediaUrlOf(character?.artKey ?? null),
    x: row.x,
    y: row.y,
    size: row.size,
    hidden: row.hidden,
    position: row.position,
  };
}
