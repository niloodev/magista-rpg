import {
  MAX_LOGIN_LENGTH,
  HINTS_COOKIE,
  HINTS_COOKIE_MAX_AGE,
  HINTS_COOKIE_MAX_LENGTH,
} from "./SkeletonHintsProvider.constants";
import type { SkeletonHints } from "./SkeletonHintsProvider.types";

/**
 * Reads the hints cookie value (base64url of an ASCII JSON object). Anything malformed becomes an empty
 * record, and so does a value longer than the cookie limit: every module still validates its own part.
 */
export function parseHints(raw: string | null | undefined): SkeletonHints {
  if (!raw || raw.length > HINTS_COOKIE_MAX_LENGTH) return {};
  try {
    const value: unknown = JSON.parse(atob(raw.replaceAll("-", "+").replaceAll("_", "/")));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as SkeletonHints)
      : {};
  } catch {
    return {};
  }
}

/**
 * Cookie value for a hints record (base64url, cookie-safe), or null when it would not fit or is not ASCII.
 */
export function serializeHints(hints: SkeletonHints): string | null {
  try {
    const value = btoa(JSON.stringify(hints))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
    return value.length <= HINTS_COOKIE_MAX_LENGTH ? value : null;
  } catch {
    return null;
  }
}

/**
 * Writes (or with null expires) the hints cookie. Not httpOnly on purpose: it only describes layout,
 * is read by the server to render the right skeleton, and holds no ids, names or secrets.
 */
export function writeHintsCookie(value: string | null): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const body = value === null ? "; Max-Age=0" : `; Max-Age=${HINTS_COOKIE_MAX_AGE}`;
  document.cookie = `${HINTS_COOKIE}=${value ?? ""}; Path=/; SameSite=Lax${body}${secure}`;
}

/**
 * Serializes `hints` so the record always fits the cookie: a part (`key`) that cannot fit even alone is dropped;
 * otherwise the largest other parts go first, so one big hint never freezes the others.
 */
export function fitHints(
  hints: SkeletonHints,
  key: string,
): { hints: SkeletonHints; value: string | null } {
  const next: SkeletonHints = { ...hints };
  if (key in next && serializeHints({ [key]: next[key] }) === null) delete next[key];
  let value = serializeHints(next);
  while (value === null) {
    const largest = Object.keys(next)
      .filter((name) => name !== key)
      .sort((a, b) => JSON.stringify(next[b]).length - JSON.stringify(next[a]).length)[0];
    if (largest === undefined) break;
    delete next[largest];
    value = serializeHints(next);
  }
  return { hints: next, value };
}

/**
 * Session part of the hints: `{ r: role, l: login length }` (never the login itself).
 */
export function sessionHint(role: string, login: string): { r: string; l: number } {
  return { r: role, l: Math.min(login.length, MAX_LOGIN_LENGTH) };
}
