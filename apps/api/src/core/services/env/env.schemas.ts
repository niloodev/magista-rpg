import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    COOKIE_SECURE: z.stringbool().default(false),
    MEDIA_DIR: z.string().min(1).default("storage/media"),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    DEV_FORCED_D20: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().int().min(1).max(20).optional(),
    ),
    DEV_QUICK_LOGIN: z.stringbool().default(false),
    SEED_GM_LOGIN: z.string().trim().min(1).default("Mestre"),
    SEED_PLAYER_LOGIN: z.string().trim().min(1).default("Zarkov"),
  })
  .refine((env) => env.NODE_ENV !== "production" || env.COOKIE_SECURE, {
    message: "COOKIE_SECURE precisa ser true em produção (cookie só via HTTPS).",
    path: ["COOKIE_SECURE"],
  })
  .refine((env) => env.NODE_ENV !== "production" || !env.DEV_QUICK_LOGIN, {
    message: "DEV_QUICK_LOGIN não pode ficar ligado em produção.",
    path: ["DEV_QUICK_LOGIN"],
  });
