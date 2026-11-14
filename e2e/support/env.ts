import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const apiEnv = fileURLToPath(new URL("../../apps/api/.env", import.meta.url));
if (existsSync(apiEnv)) process.loadEnvFile(apiEnv);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina ${name} (apps/api/.env) para rodar os testes e2e.`);
  return value;
}

export const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:3000";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3333";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

if (!LOCAL_HOSTS.includes(new URL(API_URL).hostname) && process.env.E2E_ALLOW_REMOTE !== "1") {
  throw new Error(
    `O e2e reseta a ficha do personagem de teste e só roda contra uma API local (${API_URL}). Use E2E_ALLOW_REMOTE=1 apenas em ambiente de teste.`,
  );
}

export const GM = { login: required("SEED_GM_LOGIN"), password: required("SEED_GM_PASSWORD") };

export const PLAYER = {
  login: required("SEED_PLAYER_LOGIN"),
  password: required("SEED_PLAYER_PASSWORD"),
};
