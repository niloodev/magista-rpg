import type { IArenaToken } from "@magista/shared";

import type { ArenaAudience } from "./arena.types";

/**
 * A visible token of the live scene reaches the whole table; anything else (hidden, or a scene the GM is
 * preparing) only the GM.
 */
export function tokenAudience(
  token: Pick<IArenaToken, "sceneId" | "hidden">,
  activeSceneId: string | null,
): ArenaAudience {
  return token.sceneId === activeSceneId && !token.hidden ? "table" : "gm";
}

/**
 * Changes to the live scene reach the whole table; changes to other scenes only the GM.
 */
export function sceneAudience(sceneId: string, activeSceneId: string | null): ArenaAudience {
  return sceneId === activeSceneId ? "table" : "gm";
}
