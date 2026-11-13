import type { ICharacter } from "@magista/shared";

export interface IUpsertCharacterInput {
  accountId: string;
  name: string;
}

export interface ICharacterModels {
  findByAccountId: (accountId: string) => Promise<ICharacter | null>;
  upsertCharacter: (input: IUpsertCharacterInput) => Promise<ICharacter>;
}
