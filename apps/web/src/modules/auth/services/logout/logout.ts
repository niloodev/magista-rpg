import { apiRequest } from "@/core/services/http";

import type { LogoutDeps } from "./logout.types";

/**
 * Ends the session on the API and clears it locally.
 */
export async function logout({ setSession }: LogoutDeps): Promise<void> {
  await apiRequest<null>("/auth/logout", { method: "POST" });
  setSession(null);
}
