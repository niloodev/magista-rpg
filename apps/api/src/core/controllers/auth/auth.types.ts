import type { AccountRole, ControllerResult, ISession } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";
import type { ISessionTokenPayload } from "@/core/services/auth";

import type { AuthError } from "./auth.errors";

export interface ILoginPayload {
  session: ISession;
  token: string;
}

export interface IChangePasswordPayload {
  token: string;
}

export interface IAuthenticatedViewer {
  accountId: string;
  role: AccountRole;
  session: ISession;
}

export interface IAuthControllerDeps {
  accounts: Pick<
    IAccountModels,
    | "findCredentialsByLogin"
    | "findById"
    | "findCredentialsById"
    | "revokeSessions"
    | "updatePassword"
  >;
  verifyPassword: (hash: string, password: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
  verifyAgainstDummy: (password: string) => Promise<false>;
  signToken: (payload: ISessionTokenPayload) => string;
  quickLogins: () => Record<AccountRole, string> | null;
}

export interface IAuthController {
  login: (input: unknown) => Promise<ControllerResult<ILoginPayload, AuthError>>;
  authenticate: (
    token: ISessionTokenPayload,
  ) => Promise<ControllerResult<IAuthenticatedViewer, AuthError>>;
  quickLogin: (
    input: unknown,
    clientIp: string | undefined,
  ) => Promise<ControllerResult<ILoginPayload, AuthError>>;
  logout: (accountId: string) => Promise<ControllerResult<null, AuthError>>;
  changePassword: (
    accountId: string,
    input: unknown,
  ) => Promise<ControllerResult<IChangePasswordPayload, AuthError>>;
}
