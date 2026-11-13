import type { AccountRole, IAccount, ICharacterSummary } from "@magista/shared";

export interface IAccountWithCharacter {
  account: IAccount;
  character: ICharacterSummary | null;
}

export interface IAccountCredentials extends IAccountWithCharacter {
  passwordHash: string;
}

export interface ICreateAccountInput {
  login: string;
  passwordHash: string;
  role: AccountRole;
}

export interface IAccountModels {
  findCredentialsByLogin: (login: string) => Promise<IAccountCredentials | null>;
  findById: (id: string) => Promise<IAccountWithCharacter | null>;
  upsertAccount: (input: ICreateAccountInput) => Promise<IAccount>;
}
