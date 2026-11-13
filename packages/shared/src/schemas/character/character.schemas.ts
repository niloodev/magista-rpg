import { z } from "zod";

export const CHARACTER_SHEET_VERSION = 0;

export const characterSheetSchema = z.object({}).loose();

export const characterSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const characterSchema = characterSummarySchema.extend({
  accountId: z.string(),
  sheet: characterSheetSchema,
  sheetVersion: z.number().int().nonnegative(),
});
