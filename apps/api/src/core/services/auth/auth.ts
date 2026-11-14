import { randomInt } from "node:crypto";

import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { getEnv } from "@/core/services/env";

import {
  DUMMY_PASSWORD_HASH,
  JWT_ALGORITHM,
  PASSWORD_ALPHABET,
  PASSWORD_LENGTH,
  SESSION_TTL_SECONDS,
} from "./auth.constants";
import type { ISessionTokenPayload } from "./auth.types";

/**
 * Hashes a plain password with argon2id.
 */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/**
 * Checks a plain password against an argon2 hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Signs a session token for the given account.
 */
export function signSessionToken(payload: ISessionTokenPayload): string {
  return jwt.sign(payload, getEnv().JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: SESSION_TTL_SECONDS,
  });
}

/**
 * Verifies a session token and returns its payload, or null when invalid or expired.
 */
export function verifySessionToken(token: string): ISessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (typeof decoded === "string" || typeof decoded.sub !== "string") return null;
    return { sub: decoded.sub, ver: typeof decoded.ver === "number" ? decoded.ver : -1 };
  } catch {
    return null;
  }
}

/**
 * Generates a readable random password (no ambiguous characters).
 */
export function generatePassword(): string {
  return Array.from(
    { length: PASSWORD_LENGTH },
    () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
  ).join("");
}

/**
 * Spends the same argon2 time as a real check when the login does not exist, so response time does not reveal accounts.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  await verifyPassword(DUMMY_PASSWORD_HASH, password);
  return false;
}
