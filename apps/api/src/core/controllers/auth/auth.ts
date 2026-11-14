import { loginInputSchema, quickLoginInputSchema } from "@magista/shared";

import { accountModels } from "@/core/models/account";
import { signSessionToken, verifyAgainstDummy, verifyPassword } from "@/core/services/auth";
import { getEnv } from "@/core/services/env";

import { authErrors } from "./auth.errors";
import type { IAuthController, IAuthControllerDeps } from "./auth.types";
import { isLoopbackAddress } from "./auth.utils";

/**
 * Builds the auth controller over injectable dependencies (models and crypto).
 * Sessions carry the account's sessionVersion: logout and password changes bump it, revoking every issued token.
 * `quickLogin` signs in as a seed account by role without a password; it only works when `quickLogins` returns
 * the logins (DEV_QUICK_LOGIN on, never in production) and the request comes from this machine (loopback).
 */
export function createAuthController(deps: IAuthControllerDeps): IAuthController {
  const login: IAuthController["login"] = async (input) => {
    const parsed = loginInputSchema.safeParse(input);
    if (!parsed.success) return { error: authErrors.invalidInput };
    try {
      const credentials = await deps.accounts.findCredentialsByLogin(parsed.data.login);
      const valid = credentials
        ? await deps.verifyPassword(credentials.passwordHash, parsed.data.password)
        : await deps.verifyAgainstDummy(parsed.data.password);
      if (!credentials || !valid) return { error: authErrors.invalidCredentials };
      const { account, sessionVersion } = credentials;
      const token = deps.signToken({ sub: account.id, ver: sessionVersion });
      return {
        message: "Bem-vindo à Mesa Magista",
        payload: { session: { account }, token },
      };
    } catch (error) {
      console.error("login failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  const quickLogin: IAuthController["quickLogin"] = async (input, clientIp) => {
    const logins = deps.quickLogins();
    if (!logins || !isLoopbackAddress(clientIp)) return { error: authErrors.quickLoginDisabled };
    const parsed = quickLoginInputSchema.safeParse(input);
    if (!parsed.success) return { error: authErrors.invalidInput };
    try {
      const credentials = await deps.accounts.findCredentialsByLogin(logins[parsed.data.role]);
      if (!credentials || credentials.account.role !== parsed.data.role)
        return { error: authErrors.quickLoginMissing };
      const { account, sessionVersion } = credentials;
      const token = deps.signToken({ sub: account.id, ver: sessionVersion });
      return {
        message: "Acesso rápido de teste",
        payload: { session: { account }, token },
      };
    } catch (error) {
      console.error("quick login failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  const authenticate: IAuthController["authenticate"] = async (token) => {
    try {
      const found = await deps.accounts.findById(token.sub);
      if (!found || found.sessionVersion !== token.ver)
        return { error: authErrors.sessionNotFound };
      const { account } = found;
      return {
        message: "Sessão ativa",
        payload: { accountId: account.id, role: account.role, session: { account } },
      };
    } catch (error) {
      console.error("authenticate failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  const logout: IAuthController["logout"] = async (accountId) => {
    try {
      await deps.accounts.revokeSessions(accountId);
      return { message: "Sessão encerrada", payload: null };
    } catch (error) {
      console.error("logout failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  return { login, quickLogin, authenticate, logout };
}

/**
 * Whether the development quick login is configured on (DEV_QUICK_LOGIN outside production).
 */
export function isQuickLoginEnabled(): boolean {
  const env = getEnv();
  return env.DEV_QUICK_LOGIN && env.NODE_ENV !== "production";
}

export const authController = createAuthController({
  accounts: accountModels,
  verifyPassword,
  verifyAgainstDummy,
  signToken: signSessionToken,
  quickLogins: () => {
    if (!isQuickLoginEnabled()) return null;
    const env = getEnv();
    return { GM: env.SEED_GM_LOGIN, PLAYER: env.SEED_PLAYER_LOGIN };
  },
});

export const { login, quickLogin, authenticate, logout } = authController;
