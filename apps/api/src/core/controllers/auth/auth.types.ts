import type { ControllerResult, ISession } from "@magista/shared";

import type { IAccountModels } from "@/core/models/account";

import type { AuthError } from "./auth.errors";

export interface ILoginPayload {
  session: ISession;
  token: string;
}

export interface IAuthControllerDeps {
  accounts: IAccountModels;
  verifyPassword: (hash: string, password: string) => Promise<boolean>;
  signToken: (payload: { sub: string; role: ISession["account"]["role"] }) => string;
}

export interface IAuthController {
  login: (input: unknown) => Promise<ControllerResult<ILoginPayload, AuthError>>;
  getSession: (accountId: string) => Promise<ControllerResult<ISession, AuthError>>;
}
