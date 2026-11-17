import type { ArenaChangeKind, ArenaEffectStyle, ArenaResourceKey } from "@magista/shared";
import type { Container, Filter, Matrix, RenderTexture } from "pixi.js";

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
  /** Unit direction the blow comes from (attacker toward this token), when there is an attacker. */
  incoming?: IArenaPoint2;
  /**
   * Every target of the same change, when there are several, as offsets from this token in its own radii (itself
   * at 0, 0): the big spells play one centerpiece over the whole group.
   */
  group?: IArenaPoint2[];
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
  /** The whole screen, for the spells that take over the board. */
  screen: IArenaFxScreen;
}

/** Screen-wide effects: a layer in screen pixels over the board and filters on the world under it. */
export interface IArenaFxScreen {
  /** Drawn in screen pixels, above the map and the tokens. */
  readonly layer: Container;
  size: () => { width: number; height: number };
  /** Where a container (a token) is on the screen right now. */
  toScreen: (container: Container) => IArenaPoint2;
  /** Puts a filter on the map and the tokens until it is removed. */
  addWorldFilter: (filter: Filter) => void;
  removeWorldFilter: (filter: Filter) => void;
  /**
   * Draws `container` into `target` (a texture), cleared to transparent first, through `transform` when given:
   * how an effect renders off screen (the sources of a fluid, its simulation steps).
   */
  renderTo: (container: Container, target: RenderTexture, transform?: Matrix) => void;
  /** Keeps the world filters on the visible screen (call every frame while they play: the camera moves). */
  fitWorldFilters: () => void;
  /** The part of the screen a spell takes: the whole screen and a margin past its edges, so they never show. */
  field: () => IArenaFxField;
  /** True for the first caller of `key` in `durationMs` (an area spell plays its screen part once). */
  claim: (key: string, durationMs: number) => boolean;
  /**
   * True while fewer than `limit` reservations of `key` are alive; a granted one lives `durationMs` (caps how
   * many costly pieces of one kind play at once, like a fluid per target in an area spell).
   */
  reserve: (key: string, limit: number, durationMs: number) => boolean;
}

/** The part of the screen a spell takes, in screen pixels. */
export interface IArenaFxField {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Its diagonal, the reach of anything that crosses it. */
  diagonal: number;
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
  /**
   * When the blow lands in the animation, in milliseconds from its start (the status bars change then); absent,
   * it lands as the animation starts.
   */
  readonly impactMs?: number;
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
