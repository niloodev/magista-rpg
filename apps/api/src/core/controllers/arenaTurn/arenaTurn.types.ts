import type {
  ControllerResult,
  IArenaTurnEntry,
  IArenaTurnOrder,
  RandomInt,
} from "@magista/shared";

import type { IArenaSceneModels } from "@/core/models/arenaScene";
import type { IArenaTokenModels } from "@/core/models/arenaToken";
import type { IArenaTurnModels } from "@/core/models/arenaTurn";
import type { ICharacterModels } from "@/core/models/character";

import type { IViewer } from "../controllers.types";
import type { ArenaTurnError } from "./arenaTurn.errors";

export interface IArenaTurnControllerDeps {
  turns: IArenaTurnModels;
  tokens: Pick<IArenaTokenModels, "listByScene">;
  scenes: Pick<IArenaSceneModels, "findActiveSceneId">;
  characters: Pick<ICharacterModels, "findById" | "listAccessibleIds">;
  randomInt: RandomInt;
  now: () => number;
}

/** A turn order to deliver: the GM copy (every entry) and, for the live scene, the players' copy. */
export interface IArenaTurnDelivery {
  gm: IArenaTurnOrder;
  /** Without the hidden tokens; null when the scene is not live (players never see it). */
  table: IArenaTurnOrder | null;
}

/** Tokens whose initiative is being rolled: the GM hears of all, the players of the visible ones (live scene). */
export interface IArenaTurnPendingDelivery {
  sceneId: string;
  gm: string[];
  table: string[] | null;
}

/** Initiatives rolled from the token menu, shown when the dice reveal. */
export interface IArenaTurnRolls {
  sceneId: string;
  /**
   * Values rolled in secret and kept until the reveal (then `recordRolled`): NPCs, and character tokens the table
   * may not see (hidden, nameless or on a scene that is not live).
   */
  secret: IArenaTurnEntry[];
  /** Character tokens the table sees, each rolled as a normal sheet initiative for its own token (in the feed). */
  characters: { tokenId: string; characterId: string }[];
  pending: IArenaTurnPendingDelivery;
}

export interface IArenaTurnCommandResult {
  delivery: IArenaTurnDelivery;
  /** The order changed now (rolls only change it at the reveal). */
  changed: boolean;
  rolls: IArenaTurnRolls | null;
}

export interface IArenaTurnController {
  /** Applies a turn order command (GM: everything; player: end their own turn, roll their own tokens). */
  command: (
    viewer: IViewer,
    input: unknown,
  ) => Promise<ControllerResult<IArenaTurnCommandResult, ArenaTurnError>>;
  /**
   * Puts an initiative rolled on a sheet into the order of the live scene, for every token of the character
   * there; null when nothing changed.
   */
  recordInitiative: (characterId: string, total: number) => Promise<IArenaTurnDelivery | null>;
  /** Puts the initiatives rolled from one token menu command into the order at once, when their dice reveal. */
  recordRolled: (sceneId: string, entries: IArenaTurnEntry[]) => Promise<IArenaTurnDelivery | null>;
  /** The tokens of the live scene a sheet initiative is about to reach (their lines spin until the reveal). */
  initiativePending: (characterId: string) => Promise<IArenaTurnPendingDelivery | null>;
  /**
   * The order of a scene to deliver again (after a token was hidden, shown or removed); null without scene or
   * when the scene has no turn order (nothing to send).
   */
  delivery: (sceneId: string) => Promise<IArenaTurnDelivery | null>;
}
