import type { ArenaChangeKind, ArenaEffectStyle, ArenaResourceKey } from "@magista/shared";
import type { Container, Filter } from "pixi.js";

import type { IArenaFxTextureSet } from "@/modules/arena/services/arenaFxTextures";

export type { ArenaEffectStyle };

export interface IArenaEffectOptions {
  kind: ArenaChangeKind;
  resource: ArenaResourceKey;
  amount: number;
  /** Token diameter in map pixels. */
  size: number;
  fontFamily: string;
  lite: boolean;
  seed: number;
  /** Waits this long before playing (the hit of an attacker that is still on its way). */
  delayMs?: number;
  /** Animation chosen by hand (absent: the automatic one of the kind and resource). */
  style?: ArenaEffectStyle;
}

/** How the token itself moves this frame (shake, squash, swell). */
export interface IArenaEffectFrame {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
}

export interface IArenaParticle {
  angle: number;
  speed: number;
  size: number;
  spin: number;
}

export interface IArenaPoint2 {
  x: number;
  y: number;
}

/** What the board lends to the effects: the particle atlas and a shockwave on the map around a token. */
export interface IArenaFxHost {
  textures: IArenaFxTextureSet;
  /** Ripples the board around `origin` (screen-sized radius, in CSS pixels). */
  shockwave: (
    origin: Container,
    radius: number,
    durationMs: number,
    style?: IArenaShockwaveStyle,
  ) => void;
}

/** Strength of a board ripple (screen pixels); stronger for a hit, softer for a calm wave. */
export interface IArenaShockwaveStyle {
  amplitude?: number;
  wavelength?: number;
  brightness?: number;
}

/** One animation playing on a token. */
export interface IArenaEffectPlayer {
  readonly container: Container;
  /** Filters the animation puts on the whole token while it plays (a glitch, for one). */
  readonly tokenFilters?: readonly Filter[];
  step: (
    now: number,
    cameraScale: number,
    lift?: number,
  ) => { done: boolean; frame: IArenaEffectFrame };
  destroy: () => void;
}

/** A particle launched at `born` (ms into the animation), moving with drag and gravity (map px per second). */
export interface IFxParticleSpawn {
  x: number;
  y: number;
  vx: number;
  vy: number;
  drag: number;
  gravity: number;
  born: number;
  life: number;
}
