import { request, type APIRequestContext } from "@playwright/test";

import { API_URL, WEB_URL } from "./env";

interface Envelope<T> {
  message?: string;
  payload?: T;
  error?: string;
}

export interface CharacterSummary {
  id: string;
  name: string;
}

/**
 * Logged-in API client (cookie kept in the request context).
 */
export async function apiAs(credentials: {
  login: string;
  password: string;
}): Promise<APIRequestContext> {
  const context = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Origin: WEB_URL },
  });
  const response = await context.post("/auth/login", { data: credentials });
  if (!response.ok()) throw new Error(`Login de ${credentials.login} falhou: ${response.status()}`);
  return context;
}

/**
 * Reads the payload of an API envelope, failing loudly on errors.
 */
export async function payloadOf<T>(
  response: Awaited<ReturnType<APIRequestContext["get"]>>,
): Promise<T> {
  const body = (await response.json()) as Envelope<T>;
  if (body.error || body.payload === undefined)
    throw new Error(body.error ?? "Resposta sem payload");
  return body.payload;
}
