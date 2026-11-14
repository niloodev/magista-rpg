import {
  createEmptySheet,
  migrateSheet,
  type ICharacter,
  type ICharacterSummary,
} from "@magista/shared";

import type { Character } from "@/generated/prisma/client";

/**
 * Maps a database character row to the character DTO, upgrading old sheet versions.
 */
export function toCharacter(row: Character): ICharacter {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl,
    tokenUrl: row.tokenUrl,
    sheet: migrateSheet(row.sheet, row.sheetVersion),
    sheetVersion: Math.max(row.sheetVersion, 1),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type SummaryRow = Pick<
  Character,
  "id" | "name" | "avatarUrl" | "tokenUrl" | "folderId" | "position" | "sheet" | "sheetVersion"
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
    avatarUrl: row.avatarUrl,
    tokenUrl: row.tokenUrl,
    classKey: identity.class,
    level: identity.level,
    folderId: row.folderId,
    position: row.position,
    accountIds: row.access.map((entry) => entry.accountId),
  };
}
