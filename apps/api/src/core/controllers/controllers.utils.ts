import type { ICharacterModels } from "@/core/models/character";

import type { IViewer } from "./controllers.types";

/**
 * The GM can access every character; a player only the ones the GM granted to their account.
 */
export async function canAccessCharacter(
  viewer: IViewer,
  characterId: string,
  characters: Pick<ICharacterModels, "hasAccess">,
): Promise<boolean> {
  return viewer.role === "GM" || characters.hasAccess(characterId, viewer.accountId);
}
