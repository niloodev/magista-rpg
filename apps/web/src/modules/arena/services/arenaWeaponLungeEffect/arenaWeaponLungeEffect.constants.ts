import { LUNGE_PHASES } from "@/modules/arena/services/arenaLungeEffect";

/**
 * The swing of the weapon (shares of the lunge): it is raised high while the attacker winds up and dashes, comes
 * down hard right before the arrival, stays on the target through the hold (shivering), and is lowered and fades
 * on the way back.
 */
export const WEAPON_SWING = {
  raised: LUNGE_PHASES.windup,
  strike: LUNGE_PHASES.hit - 0.13,
  hit: LUNGE_PHASES.hit,
  lower: LUNGE_PHASES.hold + 0.06,
  gone: 0.78,
} as const;

/** How far behind the blow the weapon is raised, and where it rests at the start, in radians. */
export const WEAPON_RAISE_ARC = 2.3;

export const WEAPON_REST_ARC = 1.1;

/** Colors of the shovel and of the voodoo axe. */
export const WEAPON_COLORS = {
  white: 0xffffff,
  steel: 0x9ca3af,
  shine: 0xe5e7eb,
  dark: 0x374151,
  ink: 0x111827,
  wood: 0x8b5a2b,
  woodLight: 0xb7834e,
  axeWood: 0x5a3a24,
  iron: 0x3a3f45,
  violet: 0x8b5cf6,
  green: 0x22c94a,
  lime: 0x7dff3a,
  bright: 0xc8ff5a,
  core: 0xf4ffe0,
  gold: 0xfde047,
} as const;

/** How long the flames of the voodoo axe keep rising and fade after the lunge, in milliseconds. */
export const WEAPON_FIRE_LINGER_MS = 900;
