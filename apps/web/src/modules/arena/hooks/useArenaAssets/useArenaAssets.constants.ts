import { ARENA_EFFECT_STYLES } from "@magista/shared";

/** How many animation parts the warm-up plays (each effect on the target and on the attacker). */
export const ARENA_EFFECTS_TOTAL = ARENA_EFFECT_STYLES.length * 2;

/** How often the loading screen looks for the board while waiting for it (ms). */
export const ARENA_STAGE_POLL_MS = 100;
