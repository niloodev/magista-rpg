import { isErrorResult } from "@magista/shared";
import type { NextFunction, Request, Response } from "express";

import { authErrors, authenticate } from "@/core/controllers/auth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/core/services/auth";

import type { IAuthLocals } from "./requireAuth.types";

/**
 * Rejects requests without a valid, non-revoked session and exposes the viewer (role read from the database).
 */
export async function requireAuth(
  req: Request,
  res: Response<unknown, IAuthLocals>,
  next: NextFunction,
): Promise<void> {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = typeof token === "string" ? verifySessionToken(token) : null;
  const result = payload ? await authenticate(payload) : null;
  if (!result || isErrorResult(result)) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.status(401).json({ error: authErrors.sessionNotFound });
    return;
  }
  res.locals.auth = result.payload;
  next();
}
