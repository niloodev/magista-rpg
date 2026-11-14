import type { z } from "zod";

import type { IRollOutcome } from "../dice/dice.types";
import type { BLOCK_KEYS, OPENING_ACTIONS } from "./rolls.constants";
import type { levelUpInputSchema, rollKindSchema, rollRequestSchema } from "./rolls.schemas";

export type BlockKey = (typeof BLOCK_KEYS)[number];

export type IOpeningAction = (typeof OPENING_ACTIONS)[number];

export type IRollKind = z.infer<typeof rollKindSchema>;

export type IRollRequest = z.infer<typeof rollRequestSchema>;

export type ILevelUpInput = z.infer<typeof levelUpInputSchema>;

export interface IRollSpecRow {
  label: string;
  expression: string;
}

export interface IRollSpec {
  title: string;
  subtitle: string;
  rows: IRollSpecRow[];
  notes: string[];
}

export interface IRollResultRow {
  label: string;
  outcome: IRollOutcome;
}

export type RollResultKind = IRollKind["kind"] | "levelUp";

export interface IRollResult {
  id: string;
  kind: RollResultKind;
  characterId: string;
  characterName: string;
  portraitUrl: string | null;
  rolledByGm: boolean;
  title: string;
  subtitle: string;
  rows: IRollResultRow[];
  notes: string[];
  createdAt: string;
}
