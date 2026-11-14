import type { z } from "zod";

import type { loginInputSchema, quickLoginInputSchema, sessionSchema } from "./auth.schemas";

export type ILoginInput = z.infer<typeof loginInputSchema>;

export type IQuickLoginInput = z.infer<typeof quickLoginInputSchema>;

export type ISession = z.infer<typeof sessionSchema>;
