import { envSchema } from "./env.schemas";
import type { IEnv } from "./env.types";

let cachedEnv: IEnv | null = null;

/**
 * Returns the validated process environment, failing fast on invalid configuration.
 */
export function getEnv(): IEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Variáveis de ambiente inválidas: ${parsed.error.message}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}
