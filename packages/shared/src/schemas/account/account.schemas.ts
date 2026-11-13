import { z } from "zod";

export const ACCOUNT_ROLES = ["PLAYER", "GM"] as const;

export const accountRoleSchema = z.enum(ACCOUNT_ROLES);

export const accountSchema = z.object({
  id: z.string(),
  login: z.string(),
  role: accountRoleSchema,
});
