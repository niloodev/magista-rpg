import type { AccountRole, IAccount } from "@magista/shared";

export interface IAccountSession {
  account: IAccount;
  sessionVersion: number;
}

export interface IAccountCredentials extends IAccountSession {
  passwordHash: string;
}

export interface ICreateAccountInput {
  login: string;
  passwordHash: string;
  role: AccountRole;
}

export interface IAccountModels {
  findCredentialsByLogin: (login: string) => Promise<IAccountCredentials | null>;
  findById: (id: string) => Promise<IAccountSession | null>;
  listAccounts: () => Promise<IAccount[]>;
  countPlayersByIds: (ids: string[]) => Promise<number>;
  createAccount: (input: ICreateAccountInput) => Promise<IAccount | null>;
  upsertAccount: (input: ICreateAccountInput) => Promise<IAccount>;
  updatePassword: (id: string, passwordHash: string) => Promise<void>;
  revokeSessions: (id: string) => Promise<void>;
}
