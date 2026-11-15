import type { IArenaToken } from "@magista/shared";

import { characterImageUrls, mediaUrlOf, thumbUrlOf } from "@/core/services/media";

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
 * Full and thumbnail images of a token: its own image (NPC), else the character's avatar, else the art.
 */
export function tokenImageUrls(
  imageKey: string | null,
  character: { avatarKey: string | null; artKey: string | null } | null,
): { imageUrl: string | null; imageThumbUrl: string | null } {
  if (imageKey) return { imageUrl: mediaUrlOf(imageKey), imageThumbUrl: thumbUrlOf(imageKey) };
  if (!character) return { imageUrl: null, imageThumbUrl: null };
  const urls = characterImageUrls(character.avatarKey, character.artKey);
  return urls.avatarUrl
    ? { imageUrl: urls.avatarUrl, imageThumbUrl: urls.avatarThumbUrl }
    : { imageUrl: urls.artUrl, imageThumbUrl: urls.artThumbUrl };
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
    ...tokenImageUrls(row.imageKey, character),
    x: row.x,
    y: row.y,
    size: row.size,
    hidden: row.hidden,
    position: row.position,
  };
}
