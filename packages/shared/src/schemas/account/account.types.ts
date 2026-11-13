import type { z } from "zod";

import type { accountRoleSchema, accountSchema } from "./account.schemas";

export type AccountRole = z.infer<typeof accountRoleSchema>;

export type IAccount = z.infer<typeof accountSchema>;
