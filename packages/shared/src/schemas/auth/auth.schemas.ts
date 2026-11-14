import { z } from "zod";

import { accountRoleSchema, accountSchema } from "../account/account.schemas";

export const LOGIN_MAX_LENGTH = 64;

export const loginInputSchema = z.object({
  login: z.string().trim().min(1).max(LOGIN_MAX_LENGTH),
  password: z.string().min(1).max(256),
});

export const quickLoginInputSchema = z.object({ role: accountRoleSchema });

export const sessionSchema = z.object({ account: accountSchema });
