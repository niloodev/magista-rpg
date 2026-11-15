import {
  createEmptySheet,
  migrateSheet,
  normalizeFeatures,
  type ICharacter,
  type ICharacterSummary,
} from "@magista/shared";

import { mediaUrlOf } from "@/core/services/media";
import type { Character } from "@/generated/prisma/client";

/**
 * Maps a database character row to the character DTO, upgrading old sheet versions.
 */
export function toCharacter(row: Character): ICharacter {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: mediaUrlOf(row.avatarKey),
    artUrl: mediaUrlOf(row.artKey),
    sheet: migrateSheet(row.sheet, row.sheetVersion),
    sheetVersion: Math.max(row.sheetVersion, 1),
    features: normalizeFeatures(row.features),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type SummaryRow = Pick<
  Character,
  | "id"
  | "name"
  | "avatarKey"
  | "artKey"
  | "folderId"
  | "position"
  | "sheet"
  | "sheetVersion"
  | "features"
> & { access: { accountId: string }[] };

/**
 * Reads class and level from a stored sheet, falling back to an empty sheet when it is invalid.
 */
function identityOf(row: Pick<Character, "sheet" | "sheetVersion">) {
  try {
    return migrateSheet(row.sheet, row.sheetVersion).identity;
  } catch {
    return createEmptySheet().identity;
  }
}

/**
 * Maps a database character row (with its access list) to the summary DTO used by the library.
 */
export function toCharacterSummary(row: SummaryRow): ICharacterSummary {
  const identity = identityOf(row);
  return {
    id: row.id,
    name: row.name,
    avatarUrl: mediaUrlOf(row.avatarKey),
    artUrl: mediaUrlOf(row.artKey),
    classKey: identity.class,
    level: identity.level,
    folderId: row.folderId,
    position: row.position,
    accountIds: row.access.map((entry) => entry.accountId),
    features: normalizeFeatures(row.features),
  };
}
