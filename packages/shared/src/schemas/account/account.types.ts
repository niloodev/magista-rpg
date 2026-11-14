import type { z } from "zod";

import type {
  accountRoleSchema,
  accountSchema,
  createAccountInputSchema,
  createdAccountSchema,
} from "./account.schemas";

export type AccountRole = z.infer<typeof accountRoleSchema>;

export type IAccount = z.infer<typeof accountSchema>;

export type ICreateAccountInput = z.infer<typeof createAccountInputSchema>;

export type ICreatedAccount = z.infer<typeof createdAccountSchema>;
