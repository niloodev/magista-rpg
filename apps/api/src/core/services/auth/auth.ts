import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { getEnv } from "@/core/services/env";

import { SESSION_TTL_SECONDS } from "./auth.constants";
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
  return jwt.sign(payload, getEnv().JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

/**
 * Verifies a session token and returns its payload, or null when invalid or expired.
 */
export function verifySessionToken(token: string): ISessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET);
    if (typeof decoded === "string" || typeof decoded.sub !== "string") return null;
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}
