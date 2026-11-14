import type { ICharacterSheet } from "@magista/shared";
import type { z } from "zod";

import type { REPEATING_FIELDS } from "./roll20.constants";
import type { roll20ExportSchema } from "./roll20.schemas";

export type Roll20Export = z.infer<typeof roll20ExportSchema>;

export type Roll20Section = keyof typeof REPEATING_FIELDS;

export type Roll20Row = { id: string; fields: Record<string, string> };

export interface IRoll20Character {
  name: string;
  sheet: ICharacterSheet;
}
