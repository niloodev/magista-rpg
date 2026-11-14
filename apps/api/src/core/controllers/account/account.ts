import { createAccountInputSchema } from "@magista/shared";
import { z } from "zod";

import { accountModels } from "@/core/models/account";
import { generatePassword, hashPassword, PASSWORD_MIN_LENGTH } from "@/core/services/auth";

import { accountErrors } from "./account.errors";
import type { IAccountController, IAccountControllerDeps } from "./account.types";

const setPasswordSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(PASSWORD_MIN_LENGTH).optional(),
});

/**
 * Builds the account controller used by GM tooling: password resets (CLI), listing and creating
 * player accounts (library screen).
 */
export function createAccountController(deps: IAccountControllerDeps): IAccountController {
  const setPassword: IAccountController["setPassword"] = async (input) => {
    const parsed = setPasswordSchema.safeParse(input);
    if (!parsed.success) return { error: accountErrors.invalidInput };
    try {
      const found = await deps.accounts.findCredentialsByLogin(parsed.data.login);
      if (!found) return { error: accountErrors.notFound };
      const password = parsed.data.password ?? deps.generatePassword();
      await deps.accounts.updatePassword(found.account.id, await deps.hashPassword(password));
      return { message: "Senha alterada", payload: { login: found.account.login, password } };
    } catch (error) {
      console.error("setPassword failed:", error);
      return { error: accountErrors.unexpected };
    }
  };

  const listAccounts: IAccountController["listAccounts"] = async (viewer) => {
    if (viewer.role !== "GM") return { error: accountErrors.gmOnly };
    try {
      return { message: "Contas carregadas", payload: await deps.accounts.listAccounts() };
    } catch (error) {
      console.error("listAccounts failed:", error);
      return { error: accountErrors.unexpected };
    }
  };

  const createAccount: IAccountController["createAccount"] = async (viewer, input) => {
    if (viewer.role !== "GM") return { error: accountErrors.gmOnly };
    const parsed = createAccountInputSchema.safeParse(input);
    if (!parsed.success) return { error: accountErrors.invalidNewAccount };
    try {
      if (await deps.accounts.findCredentialsByLogin(parsed.data.login))
        return { error: accountErrors.loginTaken };
      const password = parsed.data.password ?? deps.generatePassword();
      const account = await deps.accounts.createAccount({
        login: parsed.data.login,
        passwordHash: await deps.hashPassword(password),
        role: "PLAYER",
      });
      if (!account) return { error: accountErrors.loginTaken };
      return { message: "Conta criada", payload: { account, password } };
    } catch (error) {
      console.error("createAccount failed:", error);
      return { error: accountErrors.unexpected };
    }
  };

  return { setPassword, listAccounts, createAccount };
}

export const accountController = createAccountController({
  accounts: accountModels,
  hashPassword,
  generatePassword,
});
