import { isErrorResult } from "@magista/shared";
import { Router, type CookieOptions, type Response } from "express";

import { isQuickLoginEnabled, login, logout, quickLogin } from "@/core/controllers/auth";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/core/services/auth";
import { getEnv } from "@/core/services/env";
import { loginIpRateLimit, loginRateLimit, requireAuth, type IAuthLocals } from "@/middlewares";
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

authRoutes.post("/login", loginIpRateLimit, loginRateLimit, async (req, res) => {
  const result = await login(req.body);
  if (isErrorResult(result)) {
    res.status(AUTH_ERROR_STATUS[result.error]).json(result);
    return;
  }
  res.cookie(SESSION_COOKIE_NAME, result.payload.token, sessionCookieOptions());
  res.json({ message: result.message, payload: result.payload.session });
});

if (isQuickLoginEnabled()) {
  authRoutes.post("/quick-login", loginIpRateLimit, async (req, res) => {
    const result = await quickLogin(req.body, req.socket.remoteAddress);
    if (isErrorResult(result)) {
      res.status(AUTH_ERROR_STATUS[result.error]).json(result);
      return;
    }
    res.cookie(SESSION_COOKIE_NAME, result.payload.token, sessionCookieOptions());
    res.json({ message: result.message, payload: result.payload.session });
  });
}

authRoutes.get("/me", requireAuth, (_req, res: AuthedResponse) => {
  res.json({ message: "Sessão ativa", payload: res.locals.auth.session });
});

authRoutes.post("/logout", requireAuth, async (_req, res: AuthedResponse) => {
  const { accountId } = res.locals.auth;
  const result = await logout(accountId);
  disconnectAccount(accountId);
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  if (isErrorResult(result)) {
    res.status(AUTH_ERROR_STATUS[result.error]).json(result);
    return;
  }
  res.json(result);
});
