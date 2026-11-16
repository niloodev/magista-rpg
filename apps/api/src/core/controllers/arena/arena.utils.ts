import type { IArenaToken, IArenaTokenStatusAccess, IUpdateArenaTokenInput } from "@magista/shared";

import type { IArenaTokenStatusRow, IUpdateArenaTokenRow } from "@/core/models/arenaToken";

import type { ArenaAudience, IArenaStatusDelivery } from "./arena.types";

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

/**
 * A token status to deliver after a change; with the permissions it had before, also who lost them.
 */
export function statusDelivery(
  row: IArenaTokenStatusRow,
  activeSceneId: string | null,
  before?: IArenaTokenStatusAccess,
): IArenaStatusDelivery {
  return {
    tokenId: row.id,
    sceneId: row.sceneId,
    characterId: row.characterId,
    status: row.status,
    access: row.access,
    table: row.sceneId === activeSceneId && !row.hidden,
    revokedPublic: Boolean(before?.public) && !row.access.public,
    revokedAccountIds: before
      ? before.accountIds.filter((id) => !row.access.accountIds.includes(id))
      : [],
  };
}

/**
 * The stored patch of a token edit: name and own status only for NPC tokens (a character token takes both from
 * its sheet).
 */
export function tokenRowPatch(
  token: Pick<IArenaToken, "characterId">,
  input: IUpdateArenaTokenInput,
): IUpdateArenaTokenRow {
  const { name, size, hidden, style, showName, status, statusPublic, statusViewerIds } = input;
  const npc = token.characterId === null;
  return {
    ...(size === undefined ? {} : { size }),
    ...(hidden === undefined ? {} : { hidden }),
    ...(showName === undefined ? {} : { showName }),
    ...(statusPublic === undefined ? {} : { statusPublic }),
    ...(statusViewerIds === undefined ? {} : { statusViewerIds }),
    ...(npc && name !== undefined ? { name } : {}),
    ...(npc && style !== undefined ? { tokenStyle: style } : {}),
    ...(npc && status?.health
      ? { healthCurrent: status.health.current, healthMax: status.health.max }
      : {}),
    ...(npc && status?.sanity
      ? { sanityCurrent: status.sanity.current, sanityMax: status.sanity.max }
      : {}),
  };
}

/** Whether a patch changes what the status deliveries depend on. */
export function touchesStatus(patch: IUpdateArenaTokenRow): boolean {
  return [
    patch.hidden,
    patch.statusPublic,
    patch.statusViewerIds,
    patch.healthCurrent,
    patch.healthMax,
    patch.sanityCurrent,
    patch.sanityMax,
  ].some((value) => value !== undefined);
}
