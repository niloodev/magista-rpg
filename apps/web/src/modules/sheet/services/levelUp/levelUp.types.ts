import type { ICharacter, IRollResult } from "@magista/shared";

export interface ILevelUpResponse {
  character: ICharacter;
  roll: IRollResult;
}
