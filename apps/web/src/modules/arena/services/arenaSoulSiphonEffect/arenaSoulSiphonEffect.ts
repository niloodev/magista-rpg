import { Container, Graphics, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import { NOX_COLORS } from "@/modules/arena/services/arenaSoulDrainEffect";
import {
  easeOutBack,
  mixStops,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  SOUL_SIPHON_DURATION_MS,
  SOUL_SIPHON_FANGS,
  SOUL_SIPHON_PHASES,
  SOUL_SIPHON_SOULS,
  SOUL_SIPHON_STEPS,
} from "./arenaSoulSiphonEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Talis's part of "Sugada Espiritual": beside him Lorcan's spectral mouth opens (a black maw ringed with violet
 * fangs, his two deep eyes glowing above it) and a ribbon of soul, violet with a white-hot core, is pulled out of
 * the target and flows into it, rippling, with souls riding it; when the tail is swallowed the mouth closes in a
 * gulp and Talis glows as he takes back the life.
 */
export class ArenaSoulSiphonEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly mouth = new Container();
  private readonly maw = new Graphics();
  private readonly glow: Sprite;
  private readonly eyes: Sprite[] = [];
  private readonly stream = new Graphics();
  private readonly absorb = new Graphics();
  private readonly souls: ArenaFxParticles;
  private readonly from: IArenaPoint2;
  private readonly control: IArenaPoint2;
  private readonly to: IArenaPoint2;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    const direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    const across = { x: -direction.y, y: direction.x };
    this.to = {
      x: across.x * r * 1.25 + direction.x * r * 0.5,
      y: across.y * r * 1.25 + direction.y * r * 0.5 - r * 0.4,
    };
    this.from = { x: options.toward.x, y: options.toward.y };
    this.control = {
      x: (this.from.x + this.to.x) / 2 + across.x * distance * 0.22,
      y: (this.from.y + this.to.y) / 2 + across.y * distance * 0.22 - distance * 0.08,
    };
    this.glow = new Sprite(host.textures.glow);
    this.glow.anchor.set(0.5);
    this.glow.tint = NOX_COLORS.purple;
    this.glow.blendMode = "add";
    this.drawMaw(r);
    for (const side of [-1, 1]) {
      const eye = new Sprite(host.textures.glow);
      eye.anchor.set(0.5);
      eye.tint = NOX_COLORS.soul;
      eye.blendMode = "add";
      eye.position.set(side * r * 0.32, -r * 0.62);
      eye.width = eye.height = r * 0.28;
      this.eyes.push(eye);
    }
    this.mouth.addChild(this.glow, this.maw, ...this.eyes);
    this.mouth.position.set(this.to.x, this.to.y);
    this.mouth.scale.set(0);
    this.souls = new ArenaFxParticles(distance + r * 4, "add");
    this.plan(host, r);
    this.stream.blendMode = "add";
    this.absorb.blendMode = "add";
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.absorb, this.stream, this.souls.container, this.mouth);
    this.container.filters = [this.bloom];
  }

  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / SOUL_SIPHON_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    const r = this.options.size / 2;
    const scale = cameraScale > 0 ? cameraScale : 1;
    const seconds = elapsed / 1000;
    const open = easeOutBack(phase(t, 0, SOUL_SIPHON_PHASES.open));
    const close = phase(t, SOUL_SIPHON_PHASES.swallow + 0.06, SOUL_SIPHON_PHASES.gulp);
    this.mouth.scale.set(Math.max(open, 0) * (1 + 0.15 * close), Math.max(open, 0) * (1 - close));
    this.mouth.rotation = Math.sin(seconds * 3) * 0.08;
    this.maw.rotation = seconds * 1.5;
    this.glow.width = this.glow.height = r * (2.6 + 0.4 * Math.sin(seconds * 8));
    for (const eye of this.eyes) eye.alpha = 0.6 + 0.4 * Math.sin(seconds * 5);
    this.drawStream(t, seconds, r, scale);
    this.drawAbsorb(t, r, scale);
    this.souls.update(seconds);
    const gulp = phase(t, SOUL_SIPHON_PHASES.gulp, 1);
    const swell = 0.1 * Math.sin(Math.PI * gulp);
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + swell, scaleY: 1 + swell } };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** The maw, drawn once: a black throat inside a violet ring with fangs pointing in. */
  private drawMaw(r: number): void {
    const g = this.maw;
    const radius = r * 0.55;
    g.circle(0, 0, radius).fill({ color: NOX_COLORS.black });
    g.circle(0, 0, radius * 0.6).fill({ color: NOX_COLORS.void });
    g.circle(0, 0, radius).stroke({ width: r * 0.07, color: NOX_COLORS.violet });
    g.circle(0, 0, radius * 1.08).stroke({
      width: r * 0.025,
      color: NOX_COLORS.lavender,
      alpha: 0.8,
    });
    for (let index = 0; index < SOUL_SIPHON_FANGS; index += 1) {
      const angle = (index / SOUL_SIPHON_FANGS) * Math.PI * 2;
      const spread = 0.16;
      const long = index % 2 === 0 ? 0.42 : 0.3;
      g.poly([
        Math.cos(angle - spread) * radius,
        Math.sin(angle - spread) * radius,
        Math.cos(angle) * radius * (1 - long),
        Math.sin(angle) * radius * (1 - long),
        Math.cos(angle + spread) * radius,
        Math.sin(angle + spread) * radius,
      ]).fill({ color: NOX_COLORS.pale, alpha: 0.9 });
    }
  }

  /** Point at `s` (0 at the target, 1 at the mouth) along the stream. */
  private along(s: number): IArenaPoint2 {
    const u = 1 - s;
    return {
      x: u * u * this.from.x + 2 * u * s * this.control.x + s * s * this.to.x,
      y: u * u * this.from.y + 2 * u * s * this.control.y + s * s * this.to.y,
    };
  }

  /**
   * The ribbon of soul: it is pulled out of the target and reaches the mouth, ripples as it flows (layers of
   * violet, lavender and a white core), and its tail is swallowed at the end.
   */
  private drawStream(t: number, seconds: number, r: number, scale: number): void {
    const g = this.stream.clear();
    const head = phase(t, SOUL_SIPHON_PHASES.open * 0.6, SOUL_SIPHON_PHASES.reach);
    const tail = phase(t, SOUL_SIPHON_PHASES.swallow, SOUL_SIPHON_PHASES.gulp);
    if (head <= 0 || tail >= 1) return;
    const points: IArenaPoint2[] = [];
    for (let step = 0; step <= SOUL_SIPHON_STEPS; step += 1) {
      const s = tail + ((head - tail) * step) / SOUL_SIPHON_STEPS;
      const point = this.along(s);
      const next = this.along(Math.min(s + 0.01, 1));
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const length = Math.hypot(dx, dy) || 1;
      const ripple = Math.sin(s * 14 - seconds * 22) * r * 0.12 * Math.sin(Math.PI * s);
      points.push({ x: point.x - (dy / length) * ripple, y: point.y + (dx / length) * ripple });
    }
    const flat = points.flatMap((point) => [point.x, point.y]);
    for (const [width, color, alpha] of [
      [0.42, NOX_COLORS.deep, 0.5],
      [0.26, NOX_COLORS.violet, 0.75],
      [0.12, NOX_COLORS.lavender, 0.9],
      [0.05, NOX_COLORS.white, 1],
    ] as const) {
      g.poly(flat, false).stroke({
        width: Math.max(r * width, 1 / scale),
        color,
        alpha,
        cap: "round",
        join: "round",
      });
    }
  }

  /** Talis takes the life back: a violet ring closing on him and a glow when the mouth gulps. */
  private drawAbsorb(t: number, r: number, scale: number): void {
    const g = this.absorb.clear();
    const gulp = phase(t, SOUL_SIPHON_PHASES.gulp - 0.04, 1);
    if (gulp <= 0 || gulp >= 1) return;
    g.circle(0, 0, r * (2 - 1.1 * gulp)).stroke({
      width: Math.max(r * 0.08 * (1 - gulp), 1 / scale),
      color: NOX_COLORS.lavender,
      alpha: 1 - gulp,
    });
    g.circle(0, 0, r * 1.05).fill({
      color: NOX_COLORS.violet,
      alpha: 0.35 * Math.sin(Math.PI * gulp),
    });
  }

  /** Souls riding the stream from the target into the mouth, faster as they near it. */
  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed * 13 + 5);
    const seconds = SOUL_SIPHON_DURATION_MS / 1000;
    const from = SOUL_SIPHON_PHASES.reach * 0.7 * seconds;
    const until = SOUL_SIPHON_PHASES.swallow * seconds;
    for (let index = 0; index < SOUL_SIPHON_SOULS; index += 1) {
      const life = 0.35 + random() * 0.25;
      const size = r * (0.16 + random() * 0.16);
      const sway = random() * Math.PI * 2;
      this.souls.add({
        texture: host.textures.glow,
        spawn: {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          drag: 0,
          gravity: 0,
          born: from + random() * Math.max(until - from - life, 0.1),
          life,
        },
        look: {
          size: (l) => size * (1 - l * 0.5),
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.85, 1)),
          tint: (l) => mixStops([NOX_COLORS.white, NOX_COLORS.soul, NOX_COLORS.lavender], l),
          drift: (age) => {
            const point = this.along(Math.min((age / life) ** 1.4, 1));
            return { x: point.x + Math.sin(age * 20 + sway) * r * 0.08, y: point.y };
          },
        },
      });
    }
  }
}
