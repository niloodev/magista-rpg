import { z } from "zod";

export const roll20AttributeSchema = z.object({
  name: z.string(),
  current: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export const roll20ExportSchema = z
  .object({
    name: z.string().min(1),
    attributes: z.array(roll20AttributeSchema),
  })
  .loose();
