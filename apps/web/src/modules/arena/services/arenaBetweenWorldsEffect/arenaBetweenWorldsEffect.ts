import { ColorMatrixFilter, Container, type Filter } from "pixi.js";

import {
  ArenaAmountText,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  BETWEEN_DURATION_MS,
  BETWEEN_HELD_MATRIX,
  BETWEEN_IDENTITY_MATRIX,
  BETWEEN_PHASES,
  BETWEEN_SCREEN_KEY,
  BETWEEN_SHOCKWAVE,
  BETWEEN_SURFACED_MATRIX,
} from "./arenaBetweenWorldsEffect.constants";
import type { IBetweenScreen } from "./arenaBetweenWorldsEffect.types";
import { PassageScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Entre os mundos", the ultimate of Antropozohl, god of passages: the world sinks into deep water and his swarm
 * of butterflies comes for the target. It whirls around it, the wings of the god unfold above it out of the
 * swarm and the eyes on them open; the water under it becomes a whirlpool, the passage between the worlds. The
 * wings clap shut, the target is dragged through (it sinks, dimmed and blue) and spat back in a column of water,
 * lit pale, before it falls and bobs while the swarm scatters.
 */
export class ArenaBetweenWorldsEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = BETWEEN_PHASES.hit * BETWEEN_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly tone = new ColorMatrixFilter();
  private readonly amount: ArenaAmountText;
  private readonly screen: IBetweenScreen | null;
  private start: number | null = null;
  private struck = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    this.amount = new ArenaAmountText(
      "betweenWorlds",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(this.amount.text);
    this.tokenFilters = [this.tone];
    this.screen = host.screen.claim(BETWEEN_SCREEN_KEY, BETWEEN_DURATION_MS)
      ? new PassageScreen(host, seededRandom(options.seed * 29 + 5), options.group)
      : null;
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / BETWEEN_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < BETWEEN_PHASES.hit) this.amount.text.visible = false;
    else this.amount.place(phase(t, BETWEEN_PHASES.hit, 1), scale, r + lift, false);
    if (t >= 1) {
      this.tone.enabled = false;
      if (this.screen?.linger(this.container, r * scale, elapsed - BETWEEN_DURATION_MS))
        return { done: false, frame: REST };
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= BETWEEN_PHASES.hit) {
      this.struck = true;
      this.host.shockwave(
        this.container,
        r * scale * BETWEEN_SHOCKWAVE.radii,
        BETWEEN_SHOCKWAVE.durationMs,
        { amplitude: BETWEEN_SHOCKWAVE.amplitude, wavelength: BETWEEN_SHOCKWAVE.wavelength },
      );
    }
    this.toneTarget(t);
    this.screen?.step(t, this.container, r * scale);
    return { done: false, frame: this.fate(t, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.tone.destroy();
    this.container.destroy({ children: true });
  }

  /** Dimmed and blue while the water holds it, lit pale blue and white when it is spat back, then itself again. */
  private toneTarget(t: number): void {
    const { drown, pull, hit, surge, settle } = BETWEEN_PHASES;
    const held = phase(t, drown, pull) * (1 - phase(t, hit, surge));
    const surfaced = phase(t, hit, surge) * (1 - phase(t, settle - 0.06, 1));
    const target = surfaced > 0 ? BETWEEN_SURFACED_MATRIX : BETWEEN_HELD_MATRIX;
    const amount = surfaced > 0 ? surfaced : held;
    this.tone.enabled = amount > 0;
    this.tone.matrix = BETWEEN_IDENTITY_MATRIX.map(
      (value, index) => value + ((target[index] ?? 0) - value) * amount,
    ) as ColorMatrixFilter["matrix"];
  }

  /**
   * The target's fate: it floats as if under water, is pulled down trembling into the whirlpool, sinks through
   * the passage when the wings clap, shoots up with the column of water, falls back and bobs.
   */
  private fate(t: number, r: number): IArenaEffectFrame {
    const { drown, pull, hit, surge, settle } = BETWEEN_PHASES;
    if (t < pull) {
      const float = phase(t, drown, pull);
      return { dx: 0, dy: -r * 0.06 * float * Math.sin(t * 40), scaleX: 1, scaleY: 1 };
    }
    if (t < hit) {
      const drag = phase(t, pull, hit) ** 1.5;
      return {
        dx: shake(drag, r * 0.04 * drag, 26, 1),
        dy: r * 0.22 * drag,
        scaleX: 1 - 0.1 * drag,
        scaleY: 1 - 0.22 * drag,
      };
    }
    if (t < surge) {
      const sink = phase(t, hit, surge);
      return {
        dx: 0,
        dy: r * (0.22 + 0.35 * sink),
        scaleX: 0.9 - 0.3 * sink,
        scaleY: 0.78 - 0.38 * sink,
      };
    }
    const rise = Math.sin(Math.PI * phase(t, surge, settle));
    const back = phase(t, surge, surge + 0.04);
    const drop = phase(t, settle - 0.02, 1);
    const bob = drop > 0 ? 0.1 * Math.exp(-drop * 7) * Math.sin(drop * 28) : 0;
    return {
      dx: 0,
      dy: r * 0.57 * (1 - back) - r * 0.6 * rise,
      scaleX: 0.6 + 0.4 * back - 0.06 * rise + bob,
      scaleY: 0.4 + 0.6 * back + 0.2 * rise - bob,
    };
  }
}
