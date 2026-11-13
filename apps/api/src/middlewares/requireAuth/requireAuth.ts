import type { NextFunction, Request, Response } from "express";

import { authErrors } from "@/core/controllers/auth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/core/services/auth";

import type { IAuthLocals } from "./requireAuth.types";

/**
 * Rejects requests without a valid session cookie and exposes the token payload on res.locals.auth.
 */
export function requireAuth(
  req: Request,
  res: Response<unknown, IAuthLocals>,
  next: NextFunction,
): void {
  const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = typeof token === "string" ? verifySessionToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: authErrors.sessionNotFound });
    return;
  }
  res.locals.auth = payload;
  next();
}
