import { isErrorResult, type ISession } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Whether this browser still has a valid session (used after the server dropped the table connection).
 */
export async function hasActiveSession(): Promise<boolean> {
  return !isErrorResult(await apiRequest<ISession>("/auth/me"));
}
