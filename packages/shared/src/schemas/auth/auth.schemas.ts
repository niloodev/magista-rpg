import { z } from "zod";

import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  accountRoleSchema,
  accountSchema,
} from "../account/account.schemas";

export const LOGIN_MAX_LENGTH = 64;

export const loginInputSchema = z.object({
  login: z.string().trim().min(1).max(LOGIN_MAX_LENGTH),
  password: z.string().min(1).max(256),
});

export const quickLoginInputSchema = z.object({ role: accountRoleSchema });

export const sessionSchema = z.object({ account: accountSchema });

export const PASSWORD_MAX_LENGTH = 256;

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    newPassword: z.string().min(ACCOUNT_PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  })
  .refine((input) => input.newPassword !== input.currentPassword, { path: ["newPassword"] });
