import type {
  ControllerResult,
  IArenaDragEvent,
  IArenaScene,
  IArenaToken,
  IArenaTokenRemovedEvent,
  IArenaView,
} from "@magista/shared";

import type { IArenaSceneModels } from "@/core/models/arenaScene";
import type { IArenaTokenModels } from "@/core/models/arenaToken";
import type { ICharacterModels } from "@/core/models/character";
import type { IArenaImageStore } from "@/core/services/media";

import type { IViewer } from "../controllers.types";
import type { ArenaError } from "./arena.errors";

export interface IArenaControllerDeps {
  scenes: IArenaSceneModels;
  tokens: IArenaTokenModels;
  characters: Pick<ICharacterModels, "exists" | "listAccessibleIds">;
  images: IArenaImageStore;
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
}

export interface IArenaTokenRemoval {
  event: IArenaTokenRemovedEvent;
  audience: ArenaAudience;
}

export interface IArenaMoveChanges {
  changes: IArenaTokenChange[];
  refused: string[];
}

export interface IArenaDragGroup {
  event: IArenaDragEvent;
  audience: ArenaAudience;
}

export interface IArenaDragRelay {
  groups: IArenaDragGroup[];
}

type Result<T> = Promise<ControllerResult<T, ArenaError>>;

export interface IArenaController {
  getView: (viewer: IViewer, sceneId?: unknown) => Result<IArenaView>;
  listScenes: (viewer: IViewer) => Result<IArenaScene[]>;
  createScene: (viewer: IViewer, input: unknown) => Result<IArenaScene>;
  renameScene: (viewer: IViewer, id: string, input: unknown) => Result<IArenaSceneChange>;
  deleteScene: (viewer: IViewer, id: string) => Result<IArenaSceneRemoval>;
  setSceneMap: (viewer: IViewer, id: string, upload: IArenaUpload) => Result<IArenaSceneChange>;
  setActiveScene: (viewer: IViewer, input: unknown) => Result<IArenaActiveChange>;
  createToken: (viewer: IViewer, sceneId: string, input: unknown) => Result<IArenaTokenChange>;
  updateToken: (viewer: IViewer, id: string, input: unknown) => Result<IArenaTokenChange>;
  deleteToken: (viewer: IViewer, id: string) => Result<IArenaTokenRemoval>;
  setTokenImage: (viewer: IViewer, id: string, upload: IArenaUpload) => Result<IArenaTokenChange>;
  move: (viewer: IViewer, input: unknown) => Result<IArenaMoveChanges>;
  updateTokens: (viewer: IViewer, input: unknown) => Result<IArenaTokenChange[]>;
  deleteTokens: (viewer: IViewer, input: unknown) => Result<IArenaTokenRemoval[]>;
  drag: (viewer: IViewer, input: unknown) => Result<IArenaDragRelay>;
}
