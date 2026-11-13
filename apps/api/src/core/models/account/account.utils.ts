import type { IAccount, ICharacterSummary } from "@magista/shared";

import type { Account, Character } from "@/generated/prisma/client";

/**
 * Normalizes a login so lookups ignore case and surrounding spaces.
 */
export function toLoginKey(login: string): string {
  return login.trim().toLocaleLowerCase("pt-BR");
}

/**
 * Maps a database account row to the public account DTO.
 */
export function toAccount(row: Account): IAccount {
  return { id: row.id, login: row.login, role: row.role };
}

/**
 * Maps an optional database character row to its summary DTO.
 */
export function toCharacterSummary(row: Character | null): ICharacterSummary | null {
  return row ? { id: row.id, name: row.name } : null;
}
