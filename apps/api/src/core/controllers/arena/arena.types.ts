import type {
  ArenaEffectStyle,
  ArenaChangeKind,
  ArenaResourceKey,
  ControllerResult,
  IArenaChangeResult,
  IArenaTokenStatus,
  IArenaTokenStatusAccess,
  ICharacter,
  IArenaFolder,
  IArenaLibrary,
  IArenaScene,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
} from "@magista/shared";

import type { IArenaSceneModels } from "@/core/models/arenaScene";
import type { IArenaSceneFolderModels } from "@/core/models/arenaSceneFolder";
import type { IArenaTokenModels } from "@/core/models/arenaToken";
import type { IArenaTurnModels } from "@/core/models/arenaTurn";
import type { ICharacterModels } from "@/core/models/character";
import type { IAccountModels } from "@/core/models/account";
import type { IImageAssets } from "@/core/controllers/mediaAsset";
import type { IArenaWorldModels } from "@/core/models/arenaWorld";
import type { IArenaImageStore } from "@/core/services/media";

import type { IViewer } from "../controllers.types";
import type { ArenaError } from "./arena.errors";

export interface IArenaControllerDeps {
  scenes: IArenaSceneModels;
  folders: IArenaSceneFolderModels;
  tokens: IArenaTokenModels;
  turns: Pick<IArenaTurnModels, "findOrder" | "change">;
  characters: Pick<
    ICharacterModels,
    "exists" | "findSheetEffects" | "listAccessibleIds" | "changeResource"
  >;
  accounts: Pick<IAccountModels, "countPlayersByIds">;
  images: IArenaImageStore;
  assets: Pick<IImageAssets, "ingest" | "release">;
  worlds: Pick<IArenaWorldModels, "findWorld">;
}

/** Who may see a change: the whole table (visible token of the live scene) or only the GM. */
export type ArenaAudience = "table" | "gm";

export interface IArenaUpload {
  file: Buffer | undefined;
}

export interface IArenaSceneChange {
  scene: IArenaScene;
  audience: ArenaAudience;
}

export interface IArenaSceneRemoval {
  sceneId: string;
  audience: ArenaAudience;
}

export interface IArenaActiveChange {
  activeSceneId: string | null;
}

export interface IArenaTokenChange {
  token: IArenaToken;
  audience: ArenaAudience;
  /** Audience before the change, when it may have shrunk (hiding a token removes it from the players). */
  previousAudience: ArenaAudience;
  /** New status to deliver, when the change touched the status, its permissions or made the token visible. */
  status?: IArenaStatusDelivery;
}

/** A token status to deliver: the GM always gets it (with the permissions), the allowed players when visible. */
export interface IArenaStatusDelivery {
  tokenId: string;
  sceneId: string;
  characterId: string | null;
  status: IArenaTokenStatus;
  access: IArenaTokenStatusAccess;
  /** The token is visible to the table (live scene, not hidden). */
  table: boolean;
  /** The token was public and no longer is: players outside the allowed rooms must drop the status. */
  revokedPublic: boolean;
  /** Accounts that lost the permission (they drop the status unless they reach it another way). */
  revokedAccountIds: string[];
}

/** New status of a character for the accounts that see it only through token permissions. */
export interface IArenaCharacterStatusDelivery {
  characterId: string;
  status: IArenaTokenStatus;
  public: boolean;
  accountIds: string[];
}

export interface IArenaEffectDelivery {
  sceneId: string;
  tokenId: string;
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  amount: number;
  audience: ArenaAudience;
  attackerTokenId?: string;
  effect?: ArenaEffectStyle;
}

export interface IArenaChangeOutcome {
  result: IArenaChangeResult;
  effects: IArenaEffectDelivery[];
  statuses: IArenaStatusDelivery[];
  /** Sheets that changed (their tokens follow them). */
  characters: ICharacter[];
}

export interface IArenaTokenRemoval {
  event: IArenaTokenRemovedEvent;
  audience: ArenaAudience;
}

export interface IArenaMoveChanges {
  changes: IArenaTokenChange[];
  refused: string[];
}

type Result<T> = Promise<ControllerResult<T, ArenaError>>;

export interface IArenaController {
  /**
   * The Arena as the viewer sees it: the live scene (or, for the GM, a previewed one with `sceneId`) or the world map
   * (live, or a GM preview with `world` = "1").
   */
  getView: (viewer: IViewer, sceneId?: unknown, world?: unknown) => Result<IArenaView>;
  listScenes: (viewer: IViewer) => Result<IArenaScene[]>;
  /**
   * The map of every scene, only their URLs (no names), for any account: the table caches them all before the
   * session so switching maps is smooth (seeing the maps ahead is accepted by the table).
   */
  listMapUrls: (viewer: IViewer) => Result<string[]>;
  listLibrary: (viewer: IViewer) => Result<IArenaLibrary>;
  createFolder: (viewer: IViewer, input: unknown) => Result<IArenaFolder>;
  renameFolder: (viewer: IViewer, id: string, input: unknown) => Result<IArenaFolder>;
  deleteFolder: (viewer: IViewer, id: string) => Result<{ id: string }>;
  moveLibraryItem: (viewer: IViewer, input: unknown) => Result<null>;
  createScene: (viewer: IViewer, input: unknown) => Result<IArenaScene>;
  renameScene: (viewer: IViewer, id: string, input: unknown) => Result<IArenaSceneChange>;
  deleteScene: (viewer: IViewer, id: string) => Result<IArenaSceneRemoval>;
  setSceneMap: (viewer: IViewer, id: string, upload: IArenaUpload) => Result<IArenaSceneChange>;
  setSceneBoard: (viewer: IViewer, id: string, input: unknown) => Result<IArenaSceneChange>;
  setActiveScene: (viewer: IViewer, input: unknown) => Result<IArenaActiveChange>;
  createToken: (viewer: IViewer, sceneId: string, input: unknown) => Result<IArenaTokenChange>;
  updateToken: (viewer: IViewer, id: string, input: unknown) => Result<IArenaTokenChange>;
  deleteToken: (viewer: IViewer, id: string) => Result<IArenaTokenRemoval>;
  setTokenImage: (viewer: IViewer, id: string, upload: IArenaUpload) => Result<IArenaTokenChange>;
  /** Takes the own image off an NPC token (it shows its initial again, as a round token). */
  removeTokenImage: (viewer: IViewer, id: string) => Result<IArenaTokenChange>;
  move: (viewer: IViewer, input: unknown) => Result<IArenaMoveChanges>;
  updateTokens: (viewer: IViewer, input: unknown) => Result<IArenaTokenChange[]>;
  /** Pastes copies of tokens (from any scene) into a scene (GM only). */
  copyTokens: (viewer: IViewer, sceneId: string, input: unknown) => Result<IArenaTokenChange[]>;
  deleteTokens: (viewer: IViewer, input: unknown) => Result<IArenaTokenRemoval[]>;
  /** Damage or healing from anyone who sees the tokens ("Aplicar mudança"). */
  applyChange: (viewer: IViewer, input: unknown) => Result<IArenaChangeOutcome>;
  /** Who sees a character status only through token permissions on the live scene (null: nobody extra). */
  /**
   * Who sees each character status only through token permissions on the live scene, in one query; characters
   * nobody extra sees are left out.
   */
  characterStatusDeliveries: (characterIds: string[]) => Promise<IArenaCharacterStatusDelivery[]>;
}
