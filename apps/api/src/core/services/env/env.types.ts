import type { z } from "zod";

import type { envSchema } from "./env.schemas";

export type IEnv = z.infer<typeof envSchema>;
