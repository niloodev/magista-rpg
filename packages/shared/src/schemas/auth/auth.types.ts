import type { z } from "zod";

import type { loginInputSchema, sessionSchema } from "./auth.schemas";

export type ILoginInput = z.infer<typeof loginInputSchema>;

export type ISession = z.infer<typeof sessionSchema>;
