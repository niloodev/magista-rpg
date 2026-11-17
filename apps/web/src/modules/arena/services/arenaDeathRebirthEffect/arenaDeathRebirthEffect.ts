import { ColorMatrixFilter, Container, Graphics, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  NOX_COLORS,
  NOX_DRAINED_MATRIX,
  NOX_IDENTITY_MATRIX,
} from "@/modules/arena/services/arenaSoulDrainEffect";
import {
  ArenaAmountText,
  crackPath,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  DEATH_CRACKS,
  DEATH_DURATION_MS,
  DEATH_PHASES,
  DEATH_REBORN_MATRIX,
  DEATH_SCREEN_KEY,
  DEATH_SHOCKWAVE,
} from "./arenaDeathRebirthEffect.constants";
import type { IDeathScreen } from "./arenaDeathRebirthEffect.types";
import { DeathScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Reencarnação da Morte", Talis's ultimate: Death comes and the target is reborn. Night falls in violet under a
 * waning moon, shadows climb out of the ground and coil onto the target over a seal of Nox, draining its
 * color; the Eye of the End sees its soul and it cracks white; the spectral shovel of Death slams it, and it rises in a
 * pillar of violet fire, lit from within, before it falls back while the released souls rise.
 */
export class ArenaDeathRebirthEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = DEATH_PHASES.hit * DEATH_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly tone = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly cracks = new Graphics();
  private readonly amount: ArenaAmountText;
  private readonly screen: IDeathScreen | null;
  private start: number | null = null;
  private struck = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.drawCracks(r, seededRandom(options.seed));
    this.amount = new ArenaAmountText(
      "deathRebirth",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.cracks.blendMode = "add";
    this.cracks.alpha = 0;
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.cracks, this.amount.text);
    this.container.filters = [this.bloom];
    this.tokenFilters = [this.tone];
    this.screen = host.screen.claim(DEATH_SCREEN_KEY, DEATH_DURATION_MS)
      ? new DeathScreen(host, seededRandom(options.seed * 17 + 3), options.group)
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
    const t = Math.min(elapsed / DEATH_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < DEATH_PHASES.hit) this.amount.text.visible = false;
    else this.amount.place(phase(t, DEATH_PHASES.hit, 1), scale, r + lift, false);
    if (t >= 1) {
      this.tone.matrix = NOX_IDENTITY_MATRIX as ColorMatrixFilter["matrix"];
      this.cracks.alpha = 0;
      if (this.screen?.linger(this.container, r * scale, elapsed - DEATH_DURATION_MS))
        return { done: false, frame: REST };
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= DEATH_PHASES.hit) {
      this.struck = true;
      this.host.shockwave(
        this.container,
        r * scale * DEATH_SHOCKWAVE.radii,
        DEATH_SHOCKWAVE.durationMs,
        {
          amplitude: DEATH_SHOCKWAVE.amplitude,
          wavelength: DEATH_SHOCKWAVE.wavelength,
        },
      );
    }
    this.toneTarget(t);
    const seen = phase(t, DEATH_PHASES.cracks, DEATH_PHASES.cracks + 0.06);
    const gone = phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth + 0.04);
    this.cracks.alpha = seen * (1 - gone) * (0.7 + 0.3 * Math.sin(elapsed / 35));
    this.screen?.step(t, this.container, r * scale);
    return { done: false, frame: this.fate(t, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.container.filters = [];
    this.bloom.destroy();
    this.tone.destroy();
    this.container.destroy({ children: true });
  }

  /** Drained while the shadows hold it, lit from within in violet and white when it is reborn, then itself again. */
  private toneTarget(t: number): void {
    const drained =
      phase(t, DEATH_PHASES.shadows, DEATH_PHASES.cracks) *
      (1 - phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth));
    const reborn =
      phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth) *
      (1 - phase(t, DEATH_PHASES.settle - 0.05, 1));
    const target = reborn > 0 ? DEATH_REBORN_MATRIX : NOX_DRAINED_MATRIX;
    const amount = reborn > 0 ? reborn : drained;
    this.tone.matrix = NOX_IDENTITY_MATRIX.map(
      (value, index) => value + ((target[index] ?? 0) - value) * amount,
    ) as ColorMatrixFilter["matrix"];
  }

  /**
   * The target's fate: pulled down and trembling in the grip of the shadows, slammed by the shovel, lifted in the
   * pillar, stretched by it, and dropped back.
   */
  private fate(t: number, r: number): IArenaEffectFrame {
    if (t < DEATH_PHASES.hit) {
      const grip = phase(t, DEATH_PHASES.seal, DEATH_PHASES.reap);
      return {
        dx: shake(grip, r * 0.03 * grip, 30, 1),
        dy: r * 0.08 * grip,
        scaleX: 1 + 0.05 * grip,
        scaleY: 1 - 0.1 * grip,
      };
    }
    if (t < DEATH_PHASES.rebirth) {
      const since = phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth);
      return {
        dx: shake(since, r * 0.15, 8, 0.5),
        dy: r * 0.15 * (1 - since),
        scaleX: 1.15 - 0.15 * since,
        scaleY: 0.82 + 0.18 * since,
      };
    }
    const rise = Math.sin(Math.PI * phase(t, DEATH_PHASES.rebirth, DEATH_PHASES.settle + 0.06));
    const drop = phase(t, DEATH_PHASES.settle + 0.06, 1);
    const bounce = drop > 0 ? 0.1 * Math.exp(-drop * 8) * Math.sin(drop * 30) : 0;
    return {
      dx: 0,
      dy: -r * 0.45 * rise,
      scaleX: 1 - 0.06 * rise + bounce,
      scaleY: 1 + 0.18 * rise - bounce,
    };
  }

  /** The soul as the Eye of the End sees it: white cracks spreading from the center, drawn once. */
  private drawCracks(r: number, random: () => number): void {
    const g = this.cracks;
    for (let index = 0; index < DEATH_CRACKS; index += 1) {
      const angle = (index / DEATH_CRACKS) * Math.PI * 2 + (random() - 0.5) * 0.5;
      const length = r * (0.65 + random() * 0.3);
      const points = crackPath(angle, 5, random).flatMap((point) => [
        point.x * length,
        point.y * length,
      ]);
      g.poly(points, false).stroke({
        width: r * 0.08,
        color: NOX_COLORS.violet,
        alpha: 0.5,
        cap: "round",
        join: "round",
      });
      g.poly(points, false).stroke({
        width: r * 0.025,
        color: NOX_COLORS.white,
        cap: "round",
        join: "round",
      });
    }
  }
}
