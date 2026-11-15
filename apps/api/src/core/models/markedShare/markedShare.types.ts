import type { IMarkedShare, IMarkedTrait } from "@magista/shared";

export interface IStartMarkedShareInput {
  sourceCharacterId: string;
  trait: IMarkedTrait;
}

export interface IMarkedShareModels {
  findActive: () => Promise<IMarkedShare | null>;
  /** Starts the group share; returns null when another share is already active. */
  start: (input: IStartMarkedShareInput) => Promise<IMarkedShare | null>;
  /** Ends the share with this id; returns whether a row was removed. */
  stop: (id: string) => Promise<boolean>;
  /** Ends the share started by this character, if any; returns whether a row was removed. */
  stopBySource: (characterId: string) => Promise<boolean>;
}
