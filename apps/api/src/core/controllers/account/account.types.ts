import type { ControllerResult, IAccount, ICreatedAccount } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";

import type { IViewer } from "../controllers.types";
import type { AccountError } from "./account.errors";

export interface IAccountControllerDeps {
  accounts: Pick<
    IAccountModels,
    "findCredentialsByLogin" | "updatePassword" | "listAccounts" | "createAccount"
  >;
  hashPassword: (password: string) => Promise<string>;
  generatePassword: () => string;
}

export interface IAccountController {
  setPassword: (input: {
    login: string;
    password?: string;
  }) => Promise<ControllerResult<{ login: string; password: string }, AccountError>>;
  listAccounts: (viewer: IViewer) => Promise<ControllerResult<IAccount[], AccountError>>;
  createAccount: (
    viewer: IViewer,
    input: unknown,
  ) => Promise<ControllerResult<ICreatedAccount, AccountError>>;
}
