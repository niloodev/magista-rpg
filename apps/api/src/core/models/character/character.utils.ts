import {
  createEmptySheet,
  migrateSheet,
  normalizeFeatures,
  type ICharacter,
  type ICharacterSummary,
} from "@magista/shared";

import { characterTokenFields, characterImageUrls } from "@/core/services/media";
import type { Character } from "@/generated/prisma/client";

/**
 * Maps a database character row to the character DTO, upgrading old sheet versions.
 */
export function toCharacter(row: Character): ICharacter {
  return {
    id: row.id,
    name: row.name,
    ...characterImageUrls(row.avatarKey, row.artKey),
    ...characterTokenFields(row.figureKey, row.tokenStyle, row.showTokenName),
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
  | "figureKey"
  | "tokenStyle"
  | "showTokenName"
  | "folderId"
  | "position"
  | "sheet"
  | "sheetVersion"
  | "features"
> & { access: { accountId: string }[] };

/**
 * Reads a stored sheet (class, level, preferred animations), falling back to an empty sheet when it is invalid.
 */
function sheetOf(row: Pick<Character, "sheet" | "sheetVersion">) {
  try {
    return migrateSheet(row.sheet, row.sheetVersion);
  } catch {
    return createEmptySheet();
  }
}

/**
 * Maps a database character row (with its access list) to the summary DTO used by the library.
 */
export function toCharacterSummary(row: SummaryRow): ICharacterSummary {
  const sheet = sheetOf(row);
  const identity = sheet.identity;
  return {
    id: row.id,
    name: row.name,
    ...characterImageUrls(row.avatarKey, row.artKey),
    ...characterTokenFields(row.figureKey, row.tokenStyle, row.showTokenName),
    classKey: identity.class,
    level: identity.level,
    folderId: row.folderId,
    position: row.position,
    accountIds: row.access.map((entry) => entry.accountId),
    features: normalizeFeatures(row.features),
    effects: sheet.effects,
  };
}
