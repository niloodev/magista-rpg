import type { IAccount } from "@magista/shared";

import type { Account } from "@/generated/prisma/client";

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
 * True for the database error raised when a unique column (the login) already has the value.
 */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
