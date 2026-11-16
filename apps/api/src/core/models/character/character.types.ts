import type {
  ArenaResourceKey,
  ISheetResource,
  CharacterImageKind,
  FeatureKey,
  ICharacter,
  ICharacterImages,
  ICharacterSheet,
  ICharacterSummary,
  TokenStyle,
} from "@magista/shared";

export interface IUpsertCharacterInput {
  id?: string;
  accountIds: string[];
  name: string;
  sheet?: ICharacterSheet;
  legacy?: unknown;
  avatarKey?: string | null;
  artKey?: string | null;
}

export interface ICharacterImageKeys {
  avatarKey: string | null;
  artKey: string | null;
  figureKey: string | null;
}

export interface ICreateCharacterRow {
  name: string;
  folderId: string | null;
  sheet: ICharacterSheet;
}

export interface ICharacterPortrait {
  id: string;
  name: string;
  portraitUrl: string | null;
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
  findImageKeys: (id: string) => Promise<ICharacterImageKeys | null>;
  /** Swaps the key of one image under a row lock and returns the new URLs plus the key it replaced. */
  setImageKey: (
    id: string,
    kind: CharacterImageKind,
    key: string | null,
  ) => Promise<{ images: ICharacterImages; previousKey: string | null }>;
  /**
   * Token defaults of a sheet (style, name on the map; the name is applied to its tokens on the board too),
   * without touching `updatedAt`; returns the new images.
   */
  setTokenSettings: (
    id: string,
    settings: { style?: TokenStyle; showName?: boolean },
  ) => Promise<ICharacterImages>;
  upsertCharacter: (input: IUpsertCharacterInput) => Promise<ICharacter>;
  /** Replaces the special feature tags without touching `updatedAt` (no autosave conflict). */
  setFeatures: (
    id: string,
    features: FeatureKey[],
  ) => Promise<{ features: FeatureKey[]; previous: FeatureKey[]; accountIds: string[] }>;
  /**
   * Changes one resource of several sheets under a row lock (damage or healing from the Arena) and returns the
   * characters that changed; `updatedAt` moves, so no autosave from an older draft overwrites it.
   */
  changeResource: (
    ids: string[],
    resource: ArenaResourceKey,
    change: (resource: ISheetResource) => ISheetResource | null,
  ) => Promise<ICharacter[]>;
  /** Characters carrying a feature tag, ordered by name, with the portrait used by the table. */
  listByFeature: (feature: FeatureKey) => Promise<ICharacterPortrait[]>;
}
