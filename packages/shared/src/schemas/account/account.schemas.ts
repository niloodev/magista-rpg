import { z } from "zod";

export const ACCOUNT_ROLES = ["PLAYER", "GM"] as const;

export const accountRoleSchema = z.enum(ACCOUNT_ROLES);

export const accountSchema = z.object({
  id: z.string(),
  login: z.string(),
  role: accountRoleSchema,
});

export const ACCOUNT_LOGIN_MAX_LENGTH = 64;

export const ACCOUNT_PASSWORD_MIN_LENGTH = 10;

export const createAccountInputSchema = z.object({
  login: z.string().trim().min(2).max(ACCOUNT_LOGIN_MAX_LENGTH),
  password: z.string().min(ACCOUNT_PASSWORD_MIN_LENGTH).max(256).optional(),
});

export const createdAccountSchema = z.object({
  account: accountSchema,
  password: z.string(),
});
