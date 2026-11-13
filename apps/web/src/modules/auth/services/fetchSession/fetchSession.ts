import { isErrorResult, type ISession } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

import type { FetchSessionDeps } from "./fetchSession.types";

/**
 * Loads the current session from the API into the store (null when logged out).
 */
export async function fetchSession({
  setSession,
  setSessionStatus,
}: FetchSessionDeps): Promise<void> {
  setSessionStatus("loading");
  const result = await apiRequest<ISession>("/auth/me");
  setSession(isErrorResult(result) ? null : result.payload);
}
