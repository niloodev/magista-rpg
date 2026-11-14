import type { ICharacter, ICharacterSheet, ICharacterSummary } from "@magista/shared";

export interface IUpsertCharacterInput {
  id?: string;
  accountIds: string[];
  name: string;
  sheet?: ICharacterSheet;
  legacy?: unknown;
  avatarUrl?: string | null;
  tokenUrl?: string | null;
}

export interface ICreateCharacterRow {
  name: string;
  folderId: string | null;
  sheet: ICharacterSheet;
}

export interface ICharacterModels {
  findById: (id: string) => Promise<ICharacter | null>;
  exists: (id: string) => Promise<boolean>;
  hasAccess: (characterId: string, accountId: string) => Promise<boolean>;
  listAccessibleIds: (accountId: string) => Promise<string[]>;
  listAccountIds: (characterId: string) => Promise<string[]>;
  findByAccountAndName: (accountId: string, name: string) => Promise<ICharacter | null>;
  listSummaries: () => Promise<ICharacterSummary[]>;
  listSummariesForAccount: (accountId: string) => Promise<ICharacterSummary[]>;
  findSummary: (id: string) => Promise<ICharacterSummary | null>;
  create: (input: ICreateCharacterRow) => Promise<ICharacterSummary>;
  rename: (id: string, name: string) => Promise<ICharacterSummary>;
  remove: (id: string) => Promise<void>;
  setAccess: (
    id: string,
    accountIds: string[],
  ) => Promise<{ character: ICharacterSummary; previousAccountIds: string[] }>;
  updateSheet: (
    id: string,
    sheet: ICharacterSheet,
    expectedUpdatedAt: string,
  ) => Promise<ICharacter | null>;
  updateMedia: (
    id: string,
    media: { avatarUrl?: string; tokenUrl?: string },
  ) => Promise<ICharacter>;
  upsertCharacter: (input: IUpsertCharacterInput) => Promise<ICharacter>;
}
