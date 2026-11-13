import { isErrorResult } from "@magista/shared";
import { Router, type CookieOptions, type Response } from "express";

import { getSession, login } from "@/core/controllers/auth";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/core/services/auth";
import { getEnv } from "@/core/services/env";
import { requireAuth, type IAuthLocals } from "@/middlewares";
import { disconnectAccount } from "@/realtime";

import { AUTH_ERROR_STATUS } from "./auth.routes.constants";

type AuthedResponse = Response<unknown, IAuthLocals>;

function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

export const authRoutes = Router();

authRoutes.post("/login", async (req, res) => {
  const result = await login(req.body);
  if (isErrorResult(result)) {
    res.status(AUTH_ERROR_STATUS[result.error]).json(result);
    return;
  }
  res.cookie(SESSION_COOKIE_NAME, result.payload.token, sessionCookieOptions());
  res.json({ message: result.message, payload: result.payload.session });
});

authRoutes.get("/me", requireAuth, async (_req, res: AuthedResponse) => {
  const result = await getSession(res.locals.auth.sub);
  if (isErrorResult(result)) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.status(AUTH_ERROR_STATUS[result.error]).json(result);
    return;
  }
  res.json(result);
});

authRoutes.post("/logout", requireAuth, (_req, res: AuthedResponse) => {
  disconnectAccount(res.locals.auth.sub);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ message: "Sessão encerrada", payload: null });
});
