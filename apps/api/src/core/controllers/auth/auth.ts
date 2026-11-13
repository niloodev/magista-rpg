import { loginInputSchema } from "@magista/shared";

import { accountModels } from "@/core/models/account";
import { signSessionToken, verifyPassword } from "@/core/services/auth";

import { authErrors } from "./auth.errors";
import type { IAuthController, IAuthControllerDeps } from "./auth.types";

/**
 * Builds the auth controller over injectable dependencies (models and crypto).
 */
export function createAuthController(deps: IAuthControllerDeps): IAuthController {
  const login: IAuthController["login"] = async (input) => {
    const parsed = loginInputSchema.safeParse(input);
    if (!parsed.success) return { error: authErrors.invalidInput };
    try {
      const credentials = await deps.accounts.findCredentialsByLogin(parsed.data.login);
      if (!credentials) return { error: authErrors.invalidCredentials };
      const valid = await deps.verifyPassword(credentials.passwordHash, parsed.data.password);
      if (!valid) return { error: authErrors.invalidCredentials };
      const { account, character } = credentials;
      const token = deps.signToken({ sub: account.id, role: account.role });
      return {
        message: "Bem-vindo à Mesa Magista",
        payload: { session: { account, character }, token },
      };
    } catch (error) {
      console.error("login failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  const getSession: IAuthController["getSession"] = async (accountId) => {
    try {
      const found = await deps.accounts.findById(accountId);
      if (!found) return { error: authErrors.sessionNotFound };
      return { message: "Sessão ativa", payload: found };
    } catch (error) {
      console.error("getSession failed:", error);
      return { error: authErrors.unexpected };
    }
  };

  return { login, getSession };
}

export const authController = createAuthController({
  accounts: accountModels,
  verifyPassword,
  signToken: signSessionToken,
});

export const { login, getSession } = authController;
