import type { z } from "zod";

import type {
  characterSchema,
  characterSheetSchema,
  characterSummarySchema,
} from "./character.schemas";

export type ICharacterSheet = z.infer<typeof characterSheetSchema>;

export type ICharacterSummary = z.infer<typeof characterSummarySchema>;

export type ICharacter = z.infer<typeof characterSchema>;
