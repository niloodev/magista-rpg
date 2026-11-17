import type { ArenaTurnAction } from "@magista/shared";

/** Actions a player may send (always on the live scene, only for tokens they control). */
export const PLAYER_TURN_ACTIONS: ReadonlySet<ArenaTurnAction> = new Set(["endTurn", "roll"]);

/** A token rolled from its menu is not rolled again until its dice reveal (and a little after). */
export const TURN_ROLL_GUARD_MS = 4500;
