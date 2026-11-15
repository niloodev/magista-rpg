import { characterPortrait, type IMarkedShare } from "@magista/shared";

import { characterImageUrls } from "@/core/services/media";

interface MarkedShareRow {
  id: string;
  traitName: string;
  traitDescription: string;
  startedAt: Date;
  source: { id: string; name: string; avatarKey: string | null; artKey: string | null };
}

/**
 * Maps a stored share (with its source character) to the DTO sent to the Marcados.
 */
export function toMarkedShare(row: MarkedShareRow): IMarkedShare {
  return {
    id: row.id,
    source: {
      characterId: row.source.id,
      name: row.source.name,
      portraitUrl: characterPortrait(characterImageUrls(row.source.avatarKey, row.source.artKey)),
    },
    trait: { name: row.traitName, description: row.traitDescription },
    startedAt: row.startedAt.toISOString(),
  };
}
