import { sheetResourceOf } from "@magista/shared";
import type { IArenaToken, IArenaTokenStatus, TokenStyle } from "@magista/shared";

import { characterImageUrls, mediaUrlOf, thumbUrlOf } from "@/core/services/media";

interface ArenaTokenRow {
  id: string;
  sceneId: string;
  characterId: string | null;
  name: string | null;
  imageKey: string | null;
  tokenStyle: string;
  showName: boolean;
  x: number;
  y: number;
  size: number;
  hidden: boolean;
  position: number;
  initiativeBonus: number;
  character: (ITokenCharacterImages & { name: string }) | null;
}

/** The stored images of a character that decide how its tokens are drawn. */
export interface ITokenCharacterImages {
  avatarKey: string | null;
  artKey: string | null;
  figureKey: string | null;
  tokenStyle: string;
}

/**
 * Images and effective style of a token. An NPC uses its own image and style; a character token uses the
 * isometric figure when the sheet chose it and has one, else the avatar, else the art (as a round portrait).
 */
export function tokenImageUrls(
  imageKey: string | null,
  ownStyle: string,
  character: ITokenCharacterImages | null,
): { imageUrl: string | null; imageThumbUrl: string | null; style: TokenStyle } {
  if (!character) {
    return {
      imageUrl: mediaUrlOf(imageKey),
      imageThumbUrl: thumbUrlOf(imageKey),
      style: imageKey && ownStyle === "figure" ? "figure" : "portrait",
    };
  }
  if (imageKey) {
    return {
      imageUrl: mediaUrlOf(imageKey),
      imageThumbUrl: thumbUrlOf(imageKey),
      style: "portrait",
    };
  }
  if (character.tokenStyle === "figure" && character.figureKey) {
    return {
      imageUrl: mediaUrlOf(character.figureKey),
      imageThumbUrl: thumbUrlOf(character.figureKey),
      style: "figure",
    };
  }
  const urls = characterImageUrls(character.avatarKey, character.artKey);
  return urls.avatarUrl
    ? { imageUrl: urls.avatarUrl, imageThumbUrl: urls.avatarThumbUrl, style: "portrait" }
    : { imageUrl: urls.artUrl, imageThumbUrl: urls.artThumbUrl, style: "portrait" };
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
    ...tokenImageUrls(row.imageKey, row.tokenStyle, character),
    showName: row.showName,
    x: row.x,
    y: row.y,
    size: row.size,
    hidden: row.hidden,
    position: row.position,
    initiativeBonus: row.initiativeBonus,
  };
}

export interface ArenaTokenStatusSqlRow {
  id: string;
  sceneId: string;
  characterId: string | null;
  hidden: boolean;
  healthCurrent: number | null;
  healthMax: number | null;
  sanityCurrent: number | null;
  sanityMax: number | null;
  statusPublic: boolean;
  resources: unknown;
  viewers: string[] | null;
}

/**
 * Status of a token: the resources of its sheet for a character token, its own columns for an NPC.
 */
export function tokenStatusOf(row: ArenaTokenStatusSqlRow): IArenaTokenStatus {
  if (row.characterId) {
    return {
      health: sheetResourceOf(row.resources, "health"),
      sanity: sheetResourceOf(row.resources, "sanity"),
    };
  }
  return {
    health: { current: row.healthCurrent, max: row.healthMax },
    sanity: { current: row.sanityCurrent, max: row.sanityMax },
  };
}
