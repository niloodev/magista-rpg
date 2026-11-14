import type { ControllerResult, ICreateAccountInput, ICreatedAccount } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Creates a player account; the password (typed or generated) comes back only in this response.
 */
export function createAccount(
  input: ICreateAccountInput,
): Promise<ControllerResult<ICreatedAccount>> {
  return apiRequest<ICreatedAccount>("/accounts", { method: "POST", body: input });
}
