import { isErrorResult, type AccountRole, type ISession } from "@magista/shared";

import { apiRequest } from "@/core/services/http";
import type { LoginDeps } from "@/modules/auth/services/login";
import type { ServiceResult } from "@/shared/types";

/**
 * Development shortcut: signs in as the seed GM or player without a password (only when the API enables it).
 */
export async function quickLogin(
  role: AccountRole,
  { setSession }: LoginDeps,
): Promise<ServiceResult> {
  const result = await apiRequest<ISession>("/auth/quick-login", {
    method: "POST",
    body: { role },
  });
  if (isErrorResult(result)) return { ok: false, error: result.error };
  setSession(result.payload);
  return { ok: true };
}
