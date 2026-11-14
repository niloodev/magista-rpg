import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import {
  API_MAX_REQUESTS,
  API_WINDOW_MS,
  LOGIN_MAX_FAILURES,
  LOGIN_MAX_FAILURES_PER_IP,
  LOGIN_WINDOW_MS,
  RATE_LIMIT_ERROR,
} from "./rateLimit.constants";

function loginKey(req: Request): string {
  const body: unknown = req.body;
  const login =
    typeof body === "object" && body !== null && "login" in body && typeof body.login === "string"
      ? body.login.trim().toLowerCase()
      : "";
  return `${ipKeyGenerator(req.ip ?? "")}:${login}`;
}

/**
 * Brute force guard: failed logins per IP + login inside the window (successful logins do not count).
 */
export const loginRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_FAILURES,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: loginKey,
  message: { error: RATE_LIMIT_ERROR },
});

/**
 * Password spraying guard: failed logins per IP across every login.
 */
export const loginIpRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_FAILURES_PER_IP,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: RATE_LIMIT_ERROR },
});

/**
 * Coarse per-IP ceiling for the whole API.
 */
export const apiRateLimit = rateLimit({
  windowMs: API_WINDOW_MS,
  limit: API_MAX_REQUESTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: RATE_LIMIT_ERROR },
});
