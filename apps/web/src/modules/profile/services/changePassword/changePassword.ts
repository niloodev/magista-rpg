import type { ControllerResult, IChangePasswordInput, ISession } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Changes the signed-in account password. The server ends every other session and renews this tab's cookie.
 */
export function changePassword(input: IChangePasswordInput): Promise<ControllerResult<ISession>> {
  return apiRequest<ISession>("/auth/password", { method: "PUT", body: input });
}
