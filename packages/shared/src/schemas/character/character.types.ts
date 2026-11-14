import type { z } from "zod";

import type {
  abilitySchema,
  characterSchema,
  characterSheetSchema,
  characterSummarySchema,
  createCharacterInputSchema,
  inventoryItemSchema,
  renameCharacterInputSchema,
  resourceSchema,
  setCharacterAccessInputSchema,
  traitSchema,
  updateSheetInputSchema,
} from "./character.schemas";

export type ICharacterSheet = z.infer<typeof characterSheetSchema>;

export type ISheetAbility = z.infer<typeof abilitySchema>;

export type ISheetInventoryItem = z.infer<typeof inventoryItemSchema>;

export type ISheetTrait = z.infer<typeof traitSchema>;

export type ISheetResource = z.infer<typeof resourceSchema>;

export type ICharacterSummary = z.infer<typeof characterSummarySchema>;

export type ICharacter = z.infer<typeof characterSchema>;

export type IUpdateSheetInput = z.infer<typeof updateSheetInputSchema>;

export type ICreateCharacterInput = z.infer<typeof createCharacterInputSchema>;

export type IRenameCharacterInput = z.infer<typeof renameCharacterInputSchema>;

export type ISetCharacterAccessInput = z.infer<typeof setCharacterAccessInputSchema>;
