import type { ControllerResult, ICharacterSummary, ICreateCharacterInput } from "@magista/shared";

import { apiRequest } from "@/core/services/http";

/**
 * Creates a blank character sheet inside a folder (GM only).
 */
export function createCharacter(
  input: ICreateCharacterInput,
): Promise<ControllerResult<ICharacterSummary>> {
  return apiRequest<ICharacterSummary>("/characters", { method: "POST", body: input });
}
