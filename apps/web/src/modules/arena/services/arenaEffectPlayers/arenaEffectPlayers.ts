import { ShockwaveFilter } from "pixi-filters";
import { Rectangle, type Application, type Container } from "pixi.js";

import type { ArenaEffectStyle } from "@magista/shared";

import {
  ArenaCastEffect,
  CAST_HIT_MS,
  type ArenaCastPalette,
} from "@/modules/arena/services/arenaCastEffect";
import { ArenaBetweenWorldsEffect } from "@/modules/arena/services/arenaBetweenWorldsEffect";
import { ArenaClarityEffect } from "@/modules/arena/services/arenaClarityEffect";
import { ArenaEmberEffect } from "@/modules/arena/services/arenaEmberEffect";
import {
  ArenaEntropiaCastEffect,
  ENTROPIA_CAST_HIT_MS,
} from "@/modules/arena/services/arenaEntropiaCastEffect";
import { ArenaDeathRebirthEffect } from "@/modules/arena/services/arenaDeathRebirthEffect";
import { ArenaDivineCallEffect } from "@/modules/arena/services/arenaDivineCallEffect";
import {
  ArenaDivineInvocationEffect,
  DIVINE_INVOCATION_HIT_MS,
} from "@/modules/arena/services/arenaDivineInvocationEffect";
import { ArenaEntropiaEffect } from "@/modules/arena/services/arenaEntropiaEffect";
import { ArenaFissureEffect } from "@/modules/arena/services/arenaFissureEffect";
import { ArenaFloralEffect } from "@/modules/arena/services/arenaFloralEffect";
import {
  ArenaGeometryCastEffect,
  GEOMETRY_HIT_MS,
} from "@/modules/arena/services/arenaGeometryCastEffect";
import { ArenaGunshotEffect } from "@/modules/arena/services/arenaGunshotEffect";
import {
  ArenaLungeEffect,
  LUNGE_HIT_MS,
  type ArenaLungePalette,
} from "@/modules/arena/services/arenaLungeEffect";
import { ArenaNonEuclideanEffect } from "@/modules/arena/services/arenaNonEuclideanEffect";
import {
  ArenaPassageCastEffect,
  PASSAGE_CALL_HIT_MS,
  PASSAGE_FLOW_HIT_MS,
} from "@/modules/arena/services/arenaPassageCastEffect";
import { ArenaPassingFlowEffect } from "@/modules/arena/services/arenaPassingFlowEffect";
import { ArenaShotEffect, SHOT_HIT_MS } from "@/modules/arena/services/arenaShotEffect";
import {
  ArenaNoxShadowEffect,
  NOX_SHADOW_HIT_MS,
} from "@/modules/arena/services/arenaNoxShadowEffect";
import { ArenaShovelEffect } from "@/modules/arena/services/arenaShovelEffect";
import { ArenaSoulDrainEffect } from "@/modules/arena/services/arenaSoulDrainEffect";
import {
  ArenaSoulSiphonEffect,
  SOUL_SIPHON_HIT_MS,
} from "@/modules/arena/services/arenaSoulSiphonEffect";
import { ArenaStrikeEffect } from "@/modules/arena/services/arenaStrikeEffect";
import { ArenaVoxPopuliEffect } from "@/modules/arena/services/arenaVoxPopuliEffect";
import {
  ArenaVoxSpeechEffect,
  VOX_SPEECH_HIT_MS,
} from "@/modules/arena/services/arenaVoxSpeechEffect";
import {
  ArenaVitaeTouchEffect,
  VITAE_TOUCH_HIT_MS,
} from "@/modules/arena/services/arenaVitaeTouchEffect";
import { ArenaVitaeUniusEffect } from "@/modules/arena/services/arenaVitaeUniusEffect";
import {
  ArenaVoodooCastEffect,
  VOODOO_CAST_HIT_MS,
} from "@/modules/arena/services/arenaVoodooCastEffect";
import { ArenaVoodooFireEffect } from "@/modules/arena/services/arenaVoodooFireEffect";
import {
  ArenaWeaponLungeEffect,
  type ArenaWeapon,
} from "@/modules/arena/services/arenaWeaponLungeEffect";
import {
  ArenaTokenEffect,
  EFFECT_MAX_SHOCKWAVES,
  effectStyle,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaShockwaveStyle,
} from "@/modules/arena/services/arenaTokenEffects";

import type {
  IArenaAttackerInput,
  IArenaAttackerPlay,
  IArenaEffectRegistration,
  IArenaShockwave,
} from "./arenaEffectPlayers.types";

const lunge =
  (palette: ArenaLungePalette = "ruby") =>
  (input: IArenaAttackerInput, host: IArenaFxHost): IArenaAttackerPlay => ({
    effect: new ArenaLungeEffect({ ...input, palette }, host),
    hitMs: LUNGE_HIT_MS,
    flies: true,
  });

const weapon =
  (kind: ArenaWeapon, palette: ArenaLungePalette) =>
  (input: IArenaAttackerInput, host: IArenaFxHost): IArenaAttackerPlay => ({
    effect: new ArenaWeaponLungeEffect(input, host, kind, palette),
    hitMs: LUNGE_HIT_MS,
    flies: false,
  });

const shot = (input: IArenaAttackerInput, host: IArenaFxHost): IArenaAttackerPlay => ({
  effect: new ArenaShotEffect(input, host),
  hitMs: SHOT_HIT_MS,
  flies: false,
});

const cast =
  (palette: ArenaCastPalette) =>
  (input: IArenaAttackerInput, host: IArenaFxHost): IArenaAttackerPlay => ({
    effect: new ArenaCastEffect({ ...input, palette }, host),
    hitMs: CAST_HIT_MS,
    flies: false,
  });

/**
 * Players of every effect: what plays on the target and on the attacker. A new effect id in
 * `ARENA_EFFECT_STYLES` must be registered here (the record type refuses a missing one), next to its entry in
 * `ARENA_EFFECT_CATALOG`.
 */
export const ARENA_EFFECT_PLAYERS: Record<ArenaEffectStyle, IArenaEffectRegistration> = {
  strike: { target: (options, host) => new ArenaStrikeEffect(options, host), attacker: lunge() },
  fissure: {
    target: (options, host) => new ArenaFissureEffect(options, host),
    attacker: cast("fissure"),
  },
  ember: {
    target: (options, host) => new ArenaEmberEffect(options, host),
    attacker: cast("ember"),
  },
  clarity: {
    target: (options, host) => new ArenaClarityEffect(options, host),
    attacker: cast("clarity"),
  },
  voxPopuli: {
    target: (options, host) => new ArenaVoxPopuliEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaVoxSpeechEffect(input, host),
      hitMs: VOX_SPEECH_HIT_MS,
      flies: false,
    }),
  },
  vitaeUnius: {
    target: (options, host) => new ArenaVitaeUniusEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaVitaeTouchEffect(input, host),
      hitMs: VITAE_TOUCH_HIT_MS,
      flies: false,
    }),
  },
  entropiaPoema: {
    target: (options, host) => new ArenaEntropiaEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaEntropiaCastEffect(input, host),
      hitMs: ENTROPIA_CAST_HIT_MS,
      flies: false,
    }),
  },
  shovel: {
    target: (options, host) => new ArenaShovelEffect(options, host),
    attacker: weapon("shovel", "earth"),
  },
  soulDrain: {
    target: (options, host) => new ArenaSoulDrainEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaSoulSiphonEffect(input, host),
      hitMs: SOUL_SIPHON_HIT_MS,
      flies: false,
    }),
  },
  deathRebirth: {
    target: (options, host) => new ArenaDeathRebirthEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaNoxShadowEffect(input, host),
      hitMs: NOX_SHADOW_HIT_MS,
      flies: false,
    }),
  },
  divineCall: {
    target: (options, host) => new ArenaDivineCallEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaDivineInvocationEffect(input, host),
      hitMs: DIVINE_INVOCATION_HIT_MS,
      flies: false,
    }),
  },
  betweenWorlds: {
    target: (options, host) => new ArenaBetweenWorldsEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaPassageCastEffect(input, host, "call"),
      hitMs: PASSAGE_CALL_HIT_MS,
      flies: false,
    }),
  },
  gunshot: {
    target: (options, host) => new ArenaGunshotEffect(options, host),
    attacker: shot,
  },
  floralStrike: {
    target: (options, host) => new ArenaFloralEffect(options, host, "strike"),
    attacker: lunge("floral"),
  },
  floralCast: {
    target: (options, host) => new ArenaFloralEffect(options, host, "cast"),
    attacker: cast("floral"),
  },
  voodooAxe: {
    target: (options, host) => new ArenaVoodooFireEffect(options, host, "axe"),
    attacker: weapon("axe", "voodoo"),
  },
  voodooFire: {
    target: (options, host) => new ArenaVoodooFireEffect(options, host, "fireball"),
    attacker: (input, host) => ({
      effect: new ArenaVoodooCastEffect(input, host),
      hitMs: VOODOO_CAST_HIT_MS,
      flies: false,
    }),
  },
  nonEuclidean: {
    target: (options, host) => new ArenaNonEuclideanEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaGeometryCastEffect(input, host),
      hitMs: GEOMETRY_HIT_MS,
      flies: false,
    }),
  },
  passingFlow: {
    target: (options, host) => new ArenaPassingFlowEffect(options, host),
    attacker: (input, host) => ({
      effect: new ArenaPassageCastEffect(input, host, "flow"),
      hitMs: PASSAGE_FLOW_HIT_MS,
      flies: false,
    }),
  },
};

/**
 * The animation of the token that takes a change: the chosen (or automatic) rich one, or the light flash in the
 * performance mode.
 */
export function createTargetEffect(
  options: IArenaEffectOptions,
  host: IArenaFxHost,
): IArenaEffectPlayer {
  if (options.lite) return new ArenaTokenEffect(options);
  return ARENA_EFFECT_PLAYERS[effectStyle(options.kind, options.resource, options.style)].target(
    options,
    host,
  );
}

/**
 * The attacker's animation of an effect (flying strike or cast orb, as registered).
 */
export function createAttackerEffect(
  input: IArenaAttackerInput,
  host: IArenaFxHost,
): IArenaAttackerPlay {
  return ARENA_EFFECT_PLAYERS[input.style].attacker(input, host);
}

/**
 * Board ripples of the effects, run on the whole stage (no camera transform, so the filter area and the wave
 * center are plain screen pixels, as the filter input is measured). Only alive while a wave plays, at most
 * `EFFECT_MAX_SHOCKWAVES` at once and at resolution 1 (each is a full screen pass).
 */
export class ArenaShockwaves {
  private waves: IArenaShockwave[] = [];
  private readonly area = new Rectangle();

  constructor(private readonly app: Application) {}

  add = (origin: Container, radius: number, duration: number, style: IArenaShockwaveStyle = {}) => {
    const filter = new ShockwaveFilter({
      center: { x: 0, y: 0 },
      amplitude: style.amplitude ?? Math.min(radius * 0.18, 26),
      wavelength: style.wavelength ?? Math.min(radius * 0.55, 90),
      brightness: style.brightness ?? 1.12,
      radius,
      speed: radius / (duration / 1000),
      time: 0,
    });
    filter.resolution = 1;
    this.waves.push({ filter, origin, start: performance.now(), duration });
    while (this.waves.length > EFFECT_MAX_SHOCKWAVES) this.waves.shift()?.filter.destroy();
    this.apply();
  };

  /** Moves the ripples with their tokens and drops the finished ones; true while some still play. */
  step(now: number): boolean {
    if (this.waves.length === 0) return false;
    const alive = this.waves.filter((wave) => {
      const elapsed = now - wave.start;
      if (elapsed >= wave.duration || wave.origin.destroyed) {
        wave.filter.destroy();
        return false;
      }
      const center = wave.origin.toGlobal({ x: 0, y: 0 });
      wave.filter.center = { x: center.x, y: center.y };
      wave.filter.time = elapsed / 1000;
      return true;
    });
    if (alive.length !== this.waves.length) {
      this.waves = alive;
      this.apply();
    }
    return alive.length > 0;
  }

  /** Ends every wave and takes their filters off the stage (the stage keeps rendering without them). */
  destroy(): void {
    for (const wave of this.waves) wave.filter.destroy();
    this.waves = [];
    if (!this.app.stage.destroyed) this.apply();
  }

  private apply(): void {
    const filters = this.waves.map((wave) => wave.filter);
    this.area.width = this.app.screen.width;
    this.area.height = this.app.screen.height;
    this.app.stage.filterArea = filters.length > 0 ? this.area : undefined;
    this.app.stage.filters = filters;
  }
}
