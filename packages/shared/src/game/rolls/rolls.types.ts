import type { z } from "zod";

import type { IRollOutcome } from "../dice/dice.types";
import type { BLOCK_KEYS, OPENING_ACTIONS } from "./rolls.constants";
import type {
  levelUpInputSchema,
  pingEntrySchema,
  pingRequestSchema,
  rollKindSchema,
  rollRequestSchema,
} from "./rolls.schemas";

export type BlockKey = (typeof BLOCK_KEYS)[number];

export type IOpeningAction = (typeof OPENING_ACTIONS)[number];

export type IRollKind = z.infer<typeof rollKindSchema>;

export type IRollRequest = z.infer<typeof rollRequestSchema>;

export type ILevelUpInput = z.infer<typeof levelUpInputSchema>;

export type IPingEntry = z.infer<typeof pingEntrySchema>;

export type IPingRequest = z.infer<typeof pingRequestSchema>;

export type RollRowRole = "attack" | "damage";

export interface IRollSpecRow {
  label: string;
  expression: string;
  role?: RollRowRole;
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
  maximized?: boolean;
}

export interface IRolledSpec {
  rows: IRollResultRow[];
  notes: string[];
}

export type RollResultKind = IRollKind["kind"] | "levelUp" | IPingEntry["kind"];

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
