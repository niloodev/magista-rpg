import { characterSheetSchema, type ICharacter } from "@magista/shared";

import type { Character } from "@/generated/prisma/client";

/**
 * Maps a database character row to the character DTO.
 */
export function toCharacter(row: Character): ICharacter {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    sheet: characterSheetSchema.parse(row.sheet ?? {}),
    sheetVersion: row.sheetVersion,
  };
}
