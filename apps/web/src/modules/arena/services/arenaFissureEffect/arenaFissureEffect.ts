import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter, GlitchFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  bump,
  crackPath,
  mixColor,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  FISSURE_COLORS,
  FISSURE_CRACKS,
  FISSURE_DURATION_MS,
  FISSURE_DUST_PER_RUNE,
  FISSURE_GLITCH_EVERY_MS,
  FISSURE_RUNES,
  FISSURE_SMOKE,
} from "./arenaFissureEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Fissura (damage to sanity): the mind cracks. A teal ring closes in on the token, which darkens and glitches
 * (sliced and with split colors) while branching cracks race out from its center with a pale core; dark teal
 * smoke curls out, and the runes that circled it shatter into glowing dust. Light parts glow with a soft bloom.
 */
export class ArenaFissureEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly tokenFilters: readonly GlitchFilter[];
  private readonly glitch = new GlitchFilter({
    slices: 8,
    offset: 0,
    direction: 0,
    fillMode: 2,
    red: [0, 0],
    green: [0, 0],
    blue: [0, 0],
  });
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.25,
    bloomScale: 1.1,
    blur: 5,
    quality: 3,
  });
  private readonly shade = new Graphics();
  private readonly cracks = new Graphics();
  private readonly smoke: ArenaFxParticles;
  private readonly light: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly crackPaths: IArenaPoint2[][];
  private readonly runeAngles: number[];
  private start: number | null = null;
  private lastGlitch = 0;
  private random: () => number;

  constructor(
    private readonly options: IArenaEffectOptions,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.random = seededRandom(options.seed);
    const random = this.random;
    this.tokenFilters = [this.glitch];
    this.glitch.resolution = 1;
    this.bloom.resolution = 1;
    this.cracks.blendMode = "add";
    this.smoke = new ArenaFxParticles(r * 4, "normal");
    this.light = new ArenaFxParticles(r * 4, "add");
    this.amount = new ArenaAmountText(
      "fissure",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.smoke.container,
      this.shade,
      this.cracks,
      this.light.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
    this.crackPaths = [];
    for (let index = 0; index < FISSURE_CRACKS; index += 1) {
      const angle = (index / FISSURE_CRACKS) * Math.PI * 2 + random() * 0.6;
      const main = crackPath(angle, 5, random);
      this.crackPaths.push(main);
      const fork = main[2 + Math.floor(random() * 2)];
      if (fork) {
        const branch = crackPath(angle + (random() > 0.5 ? 0.7 : -0.7), 3, random).map((point) => ({
          x: fork.x + point.x * 0.45,
          y: fork.y + point.y * 0.45,
        }));
        this.crackPaths.push(branch);
      }
    }
    this.runeAngles = Array.from(
      { length: FISSURE_RUNES },
      (_, index) => (index / FISSURE_RUNES) * Math.PI * 2,
    );
    this.plan(host, r);
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / FISSURE_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    this.drawShade(t, r, scale);
    this.drawCracks(t, r, scale);
    this.updateGlitch(now, t, r, scale);
    this.smoke.update(elapsed / 1000);
    this.light.update(elapsed / 1000);
    const wobble = Math.sin(t * Math.PI * 7) * 0.05 * (1 - t);
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + wobble, scaleY: 1 - wobble } };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.glitch.destroy();
    this.container.destroy({ children: true });
  }

  /** Plans the smoke, the orbiting runes and the dust they break into. */
  private plan(host: IArenaFxHost, r: number): void {
    const random = this.random;
    const duration = FISSURE_DURATION_MS / 1000;
    const frames = host.textures;
    for (let index = 0; index < FISSURE_SMOKE; index += 1) {
      const angle = random() * Math.PI * 2;
      const spin = (random() - 0.5) * 2;
      const size = r * (1 + random() * 0.8);
      this.smoke.add({
        texture: frames.smoke,
        spawn: {
          x: Math.cos(angle) * r * 0.3,
          y: Math.sin(angle) * r * 0.3,
          vx: Math.cos(angle) * r * 1.4,
          vy: Math.sin(angle) * r * 1.4 - r * 0.3,
          drag: 1.8,
          gravity: -r * 0.4,
          born: 0.05 * duration + random() * 0.15,
          life: 0.75 + random() * 0.3,
        },
        look: {
          size: (life) => size * (0.6 + life),
          alpha: (life) => 0.7 * Math.sin(Math.PI * Math.min(life * 1.5, 1)) * (1 - life * 0.6),
          tint: (life) => mixColor(FISSURE_COLORS.deep, FISSURE_COLORS.void, life),
          rotation: (age) => spin * age,
        },
      });
    }
    this.runeAngles.forEach((base, index) => {
      const orbit = r * 1.25;
      const breakAt = 0.45 + random() * 0.15;
      const rune = (age: number) => {
        const angle = base + age * 3.2;
        return { x: Math.cos(angle) * orbit, y: Math.sin(angle) * orbit };
      };
      this.light.add({
        texture: frames.shard,
        spawn: {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          drag: 0,
          gravity: 0,
          born: 0.04 * duration,
          life: breakAt * duration,
        },
        look: {
          size: (life) => r * 0.22 * (1 - life * 0.3),
          alpha: (life) => (life < 0.15 ? life / 0.15 : 1),
          tint: () => FISSURE_COLORS.tealLight,
          rotation: (age) => base + age * 3.2 + Math.PI / 2,
          drift: rune,
        },
      });
      const breakSeconds = (0.04 + breakAt) * duration;
      const point = rune(breakSeconds - 0.04 * duration);
      for (let dust = 0; dust < FISSURE_DUST_PER_RUNE; dust += 1) {
        const angle = random() * Math.PI * 2;
        const speed = r * (0.6 + random() * 1.4);
        const size = r * (0.08 + random() * 0.08);
        this.light.add({
          texture: frames.spark,
          spawn: {
            x: point.x,
            y: point.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: 2.5,
            gravity: -r * 0.8,
            born: breakSeconds,
            life: 0.35 + random() * 0.3,
          },
          look: {
            size: (life) => size * (1 - life * 0.6),
            alpha: (life, age) => (1 - life) * (0.7 + 0.3 * Math.sin(age * 50 + index)),
            tint: (life) => mixColor(FISSURE_COLORS.pale, FISSURE_COLORS.teal, life),
          },
        });
      }
    });
  }

  private drawShade(t: number, r: number, scale: number): void {
    const g = this.shade.clear();
    const dark = bump(t, 0, 0.85);
    if (dark > 0) g.circle(0, 0, r).fill({ color: FISSURE_COLORS.void, alpha: 0.5 * dark });
    const close = phase(t, 0, 0.3);
    if (close < 1) {
      g.circle(0, 0, r * (1.9 - close * 0.9)).stroke({
        width: Math.max(r * 0.07 * (1 - close * 0.5), 2 / scale),
        color: FISSURE_COLORS.tealLight,
        alpha: 0.85 * close + 0.15,
      });
    }
  }

  private drawCracks(t: number, r: number, scale: number): void {
    const g = this.cracks.clear();
    const grow = phase(t, 0.22, 0.42);
    const fade = 1 - phase(t, 0.6, 1);
    if (grow <= 0 || fade <= 0) return;
    this.crackPaths.forEach((path, index) => {
      const visible = Math.max(1, Math.ceil(grow * (path.length - 1)));
      const points = path.slice(0, visible + 1);
      const [first, ...rest] = points;
      if (!first) return;
      const wide = index % 2 === 0 ? 1 : 0.6;
      const stroke = (width: number, color: number, alpha: number) => {
        g.moveTo(first.x * r, first.y * r);
        for (const point of rest) g.lineTo(point.x * r, point.y * r);
        g.stroke({ width: Math.max(width, 1 / scale), color, alpha, cap: "round", join: "round" });
      };
      stroke(r * 0.09 * wide, FISSURE_COLORS.tealDeep, 0.8 * fade);
      stroke(r * 0.035 * wide, FISSURE_COLORS.tealLight, fade);
      stroke(r * 0.012 * wide, FISSURE_COLORS.pale, fade);
    });
  }

  /** Slices and splits the token colors, strongest when the cracks open, then calms down. */
  private updateGlitch(now: number, t: number, r: number, scale: number): void {
    const strength = bump(t, 0.18, 0.75);
    const shift = r * scale * 0.12 * strength;
    this.glitch.offset = shift * 1.4;
    this.glitch.red = [shift, 0];
    this.glitch.blue = [-shift, 0];
    this.glitch.green = [0, 0];
    if (strength > 0 && now - this.lastGlitch >= FISSURE_GLITCH_EVERY_MS) {
      this.lastGlitch = now;
      this.glitch.seed = this.random();
      this.glitch.refresh();
    }
    this.glitch.enabled = strength > 0.02;
  }
}
