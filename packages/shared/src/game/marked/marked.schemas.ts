import { z } from "zod";

export const markedProposeSchema = z.object({
  characterId: z.uuid(),
  traitId: z.string().min(1).max(64),
});

export const markedAnswerSchema = z.object({
  proposalId: z.uuid(),
  characterId: z.uuid(),
  accept: z.boolean(),
});

export const markedCancelSchema = z.object({ proposalId: z.uuid() });

export const markedStopSchema = z.object({ shareId: z.uuid() });
