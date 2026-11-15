import { z } from "zod";

import { DEV_S3_ACCESS_KEY, DEV_S3_SECRET_KEY } from "./env.constants";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    COOKIE_SECURE: z.stringbool().default(false),
    S3_ENDPOINT: z.url().default("http://127.0.0.1:8333"),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
      .default("magista-media"),
    S3_ACCESS_KEY: z.string().min(1).default(DEV_S3_ACCESS_KEY),
    S3_SECRET_KEY: z.string().min(8).default(DEV_S3_SECRET_KEY),
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
  .refine((env) => env.NODE_ENV !== "production" || env.S3_SECRET_KEY !== DEV_S3_SECRET_KEY, {
    message: "Troque S3_SECRET_KEY (e a do container de storage) antes de rodar em produção.",
    path: ["S3_SECRET_KEY"],
  })
  .refine((env) => env.NODE_ENV !== "production" || !env.DEV_QUICK_LOGIN, {
    message: "DEV_QUICK_LOGIN não pode ficar ligado em produção.",
    path: ["DEV_QUICK_LOGIN"],
  });
