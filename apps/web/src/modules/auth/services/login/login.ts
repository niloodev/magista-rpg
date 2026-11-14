import { isErrorResult, loginInputSchema, type ILoginInput, type ISession } from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { ServiceResult } from "@/shared/types";

import { LOGIN_EMPTY_FIELDS } from "./login.constants";
import type { LoginDeps } from "./login.types";

/**
 * Authenticates a player or GM and stores the resulting session.
 */
export async function login(input: ILoginInput, { setSession }: LoginDeps): Promise<ServiceResult> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: LOGIN_EMPTY_FIELDS };
  const result = await apiRequest<ISession>("/auth/login", { method: "POST", body: parsed.data });
  if (isErrorResult(result)) return { ok: false, error: result.error };
  setSession(result.payload);
  return { ok: true };
}
