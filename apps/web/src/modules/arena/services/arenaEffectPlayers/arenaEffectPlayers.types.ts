import type { ArenaEffectStyle } from "@magista/shared";
import type { Container, Filter } from "pixi.js";

import type {
  IArenaEffectOptions,
  IArenaEffectPlayer,
  IArenaFxHost,
  IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

/** The attacker's side of a change: what to play on it and when the target is hit. */
export interface IArenaAttackerPlay {
  effect: IArenaEffectPlayer;
  hitMs: number;
  /** It flies over the others (lunge), so it goes on top. */
  flies: boolean;
  /**
   * The target animation starts this long before the hit, so its own wind-up (the axe coming down) lands
   * exactly when the attacker arrives; the status still changes at the hit.
   */
  leadMs?: number;
}

export interface IArenaAttackerInput {
  style: ArenaEffectStyle;
  size: number;
  toward: IArenaPoint2;
  targetRadius: number;
  seed: number;
}

export interface IArenaShockwave {
  filter: Filter & { center: { x: number; y: number }; time: number };
  origin: Container;
  start: number;
  duration: number;
}

/** How one effect plays: on the token that takes it, and on the attacker. */
export interface IArenaEffectRegistration {
  target: (options: IArenaEffectOptions, host: IArenaFxHost) => IArenaEffectPlayer;
  attacker: (input: IArenaAttackerInput, host: IArenaFxHost) => IArenaAttackerPlay;
}
