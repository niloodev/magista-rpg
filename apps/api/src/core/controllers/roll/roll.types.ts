import type { ControllerResult, ICharacter, IRollResult, RandomInt } from "@magista/shared";

import type { ICharacterModels } from "@/core/models/character";

import type { IViewer } from "../controllers.types";
import type { RollError } from "./roll.errors";

export interface IRollControllerDeps {
  characters: Pick<ICharacterModels, "findById" | "updateSheet" | "hasAccess">;
  randomInt: RandomInt;
  createId: () => string;
  now: () => Date;
}

export interface ILevelUpPayload {
  character: ICharacter;
  roll: IRollResult;
}

export interface IRollController {
  roll: (viewer: IViewer, input: unknown) => Promise<ControllerResult<IRollResult, RollError>>;
  /**
   * Rolls the sheet initiative of a character once per token (each its own roll, for that token), reading the
   * sheet once; nothing when the viewer has no access.
   */
  rollInitiatives: (
    viewer: IViewer,
    characterId: string,
    tokenIds: string[],
  ) => Promise<IRollResult[]>;
  ping: (viewer: IViewer, input: unknown) => Promise<ControllerResult<IRollResult, RollError>>;
  levelUp: (
    viewer: IViewer,
    characterId: string,
    input: unknown,
  ) => Promise<ControllerResult<ILevelUpPayload, RollError>>;
}
