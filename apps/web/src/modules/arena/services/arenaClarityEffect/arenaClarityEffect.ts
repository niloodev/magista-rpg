import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  bump,
  mixColor,
  phase,
  RUNE_STROKES,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  CLARITY_COLORS,
  CLARITY_DURATION_MS,
  CLARITY_MOTES,
  CLARITY_RUNES,
  CLARITY_SHAFTS,
  CLARITY_WAVE_MS,
  CLARITY_WAVE_RADII,
} from "./arenaClarityEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Clareza (healing sanity): calm. A slow wave runs over the board like water, teal ripples open around the token,
 * soft shafts of light rise behind it, motes of light float up swaying, runes rise and fade, and the token
 * breathes with a brief teal glow on its ring.
 */
export class ArenaClarityEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.15,
    blur: 6,
    quality: 3,
  });
  private readonly ripples = new Graphics();
  private readonly runes = new Graphics();
  private readonly back: ArenaFxParticles;
  private readonly light: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly runeSpots: { x: number; delay: number; stroke: number }[];
  private start: number | null = null;
  private waved = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed);
    this.bloom.resolution = 1;
    this.ripples.blendMode = "add";
    this.runes.blendMode = "add";
    this.back = new ArenaFxParticles(r * 4, "add");
    this.light = new ArenaFxParticles(r * 4, "add");
    this.amount = new ArenaAmountText(
      "clarity",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.back.container,
      this.ripples,
      this.runes,
      this.light.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
    this.runeSpots = Array.from({ length: CLARITY_RUNES }, (_, index) => ({
      x: (index / (CLARITY_RUNES - 1) - 0.5) * 1.5 + (random() - 0.5) * 0.2,
      delay: 0.15 + random() * 0.25,
      stroke: index % RUNE_STROKES.length,
    }));
    this.plan(random, r);
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / CLARITY_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    if (!this.waved) {
      this.waved = true;
      this.host.shockwave(this.container, r * scale * CLARITY_WAVE_RADII, CLARITY_WAVE_MS, {
        amplitude: 9,
        wavelength: 120,
        brightness: 1.08,
      });
    }
    this.drawRipples(t, r, scale);
    this.drawRunes(t, r, scale);
    this.back.update(elapsed / 1000);
    this.light.update(elapsed / 1000);
    const breath = 0.04 * bump(t, 0, 0.9);
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + breath, scaleY: 1 + breath } };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  private plan(random: () => number, r: number): void {
    const frames = this.host.textures;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    for (let index = 0; index < CLARITY_SHAFTS; index += 1) {
      const x = (index / (CLARITY_SHAFTS - 1) - 0.5) * r * 1.4;
      const width = r * (0.18 + random() * 0.14);
      const height = r * (2.4 + random() * 1.2);
      this.back.add({
        texture: frames.streak,
        anchorX: 0.5,
        spawn: { x, y: -r * 0.6, ...still, born: 0.1 + random() * 0.3, life: 0.9 + random() * 0.3 },
        look: {
          size: () => height,
          height: () => width,
          alpha: (life) => 0.45 * bump(life, 0, 1),
          tint: () => CLARITY_COLORS.tealLight,
          rotation: () => -Math.PI / 2,
        },
      });
    }
    this.back.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0.05, life: 1.1 },
      look: {
        size: (life) => r * (2.4 + life * 0.8),
        alpha: (life) => 0.45 * bump(life, 0, 1),
        tint: () => CLARITY_COLORS.teal,
      },
    });
    for (let index = 0; index < CLARITY_MOTES; index += 1) {
      const sway = random() * Math.PI * 2;
      const size = r * (0.07 + random() * 0.09);
      this.light.add({
        texture: index % 3 === 0 ? frames.spark : frames.glow,
        spawn: {
          x: (random() - 0.5) * r * 2,
          y: r * (0.2 + random() * 0.8),
          vx: 0,
          vy: -r * (0.7 + random() * 0.7),
          drag: 0.3,
          gravity: 0,
          born: 0.05 + random() * 0.6,
          life: 0.8 + random() * 0.5,
        },
        look: {
          size: (life) => size * (1 - life * 0.4),
          alpha: (life, age) => bump(life, 0, 1) * (0.7 + 0.3 * Math.sin(age * 12 + sway)),
          tint: (life) => mixColor(CLARITY_COLORS.pale, CLARITY_COLORS.tealLight, life),
          drift: (age) => ({ x: Math.sin(age * 3.2 + sway) * r * 0.18, y: 0 }),
        },
      });
    }
  }

  private drawRipples(t: number, r: number, scale: number): void {
    const g = this.ripples.clear();
    for (let wave = 0; wave < 3; wave += 1) {
      const p = phase(t, wave * 0.16, wave * 0.16 + 0.6);
      if (p <= 0 || p >= 1) continue;
      g.ellipse(0, r * 0.35, r * (0.8 + p * 1.2), r * (0.8 + p * 1.2) * 0.42).stroke({
        width: Math.max(r * 0.04 * (1 - p * 0.5), 1.2 / scale),
        color: CLARITY_COLORS.tealLight,
        alpha: 0.7 * (1 - p),
      });
    }
    const glow = bump(t, 0.1, 0.8);
    if (glow > 0)
      g.circle(0, 0, r * 1.02).stroke({
        width: Math.max(r * 0.08, 2 / scale),
        color: CLARITY_COLORS.teal,
        alpha: 0.55 * glow,
      });
  }

  private drawRunes(t: number, r: number, scale: number): void {
    const g = this.runes.clear();
    for (const spot of this.runeSpots) {
      const local = phase(t, spot.delay, spot.delay + 0.55);
      if (local <= 0 || local >= 1) continue;
      const x = spot.x * r;
      const y = r * 0.4 - local * r * 1.9;
      const size = r * 0.12;
      for (const stroke of RUNE_STROKES[spot.stroke] ?? []) {
        const [first, ...rest] = stroke;
        if (!first) continue;
        g.moveTo(x + first.x * size, y + first.y * size);
        for (const point of rest) g.lineTo(x + point.x * size, y + point.y * size);
        g.stroke({
          width: Math.max(r * 0.03, 1.2 / scale),
          color: CLARITY_COLORS.pale,
          alpha: bump(local, 0, 1),
          cap: "round",
        });
      }
    }
  }
}
