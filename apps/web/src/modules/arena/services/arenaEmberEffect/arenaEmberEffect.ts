import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  bump,
  easeOutBack,
  mixColor,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  EMBER_COLORS,
  EMBER_DURATION_MS,
  EMBER_PETALS,
  EMBER_SPARKS,
} from "./arenaEmberEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Brasa viva (healing health): a warm rose aura blooms under the token, a ring of light rises from its edge,
 * embers spiral up flickering from white to rose, petals drift and turn, and a four-pointed sparkle shines above
 * at the peak while the token swells. A soft bloom makes the warmth glow.
 */
export class ArenaEmberEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.25,
    blur: 6,
    quality: 3,
  });
  private readonly rings = new Graphics();
  private readonly back: ArenaFxParticles;
  private readonly light: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaEffectOptions,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.bloom.resolution = 1;
    this.rings.blendMode = "add";
    this.back = new ArenaFxParticles(r * 4, "add");
    this.light = new ArenaFxParticles(r * 4, "add");
    this.amount = new ArenaAmountText(
      "ember",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.back.container,
      this.rings,
      this.light.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
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
    const t = Math.min(elapsed / EMBER_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    this.drawRings(t, r, scale);
    this.back.update(elapsed / 1000);
    this.light.update(elapsed / 1000);
    const swell = 0.07 * easeOutBack(phase(t, 0, 0.3)) * (1 - phase(t, 0.3, 0.75));
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + swell, scaleY: 1 + swell } };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const frames = host.textures;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.back.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: 1.1 },
      look: {
        size: (life) => r * (2.2 + 1.2 * easeOutBack(Math.min(life * 2, 1))),
        alpha: (life) => 0.75 * bump(life, 0, 1),
        tint: (life) => mixColor(EMBER_COLORS.rose, EMBER_COLORS.ruby, life),
      },
    });
    for (let index = 0; index < EMBER_SPARKS; index += 1) {
      const angle = random() * Math.PI * 2;
      const spread = r * (0.4 + random() * 0.65);
      const turn = (random() > 0.5 ? 1 : -1) * (2 + random() * 2);
      const size = r * (0.1 + random() * 0.14);
      const flicker = random() * 10;
      const hot = index % 4 === 0;
      this.light.add({
        texture: hot ? frames.spark : frames.glow,
        spawn: {
          x: 0,
          y: r * 0.55,
          vx: 0,
          vy: -r * (1.6 + random() * 1.2),
          drag: 0.6,
          gravity: -r * 0.6,
          born: 0.05 + random() * 0.45,
          life: 0.7 + random() * 0.45,
        },
        look: {
          size: (life) => size * (1 - life * 0.55),
          alpha: (life, age) =>
            Math.sin(Math.PI * Math.min(life * 1.3, 1)) *
            (0.65 + 0.35 * Math.sin(age * 38 + flicker)),
          tint: (life) =>
            life < 0.4
              ? mixColor(EMBER_COLORS.warm, EMBER_COLORS.rose, life / 0.4)
              : mixColor(EMBER_COLORS.rose, EMBER_COLORS.rubyLight, (life - 0.4) / 0.6),
          drift: (age) => ({
            x: Math.cos(angle + age * turn) * spread * (1 - Math.min(age, 1) * 0.35),
            y: Math.sin(angle + age * turn) * spread * 0.3,
          }),
        },
      });
    }
    for (let index = 0; index < EMBER_PETALS; index += 1) {
      const angle = (index / EMBER_PETALS) * Math.PI * 2 + random() * 0.5;
      const spin = (random() - 0.5) * 9;
      const size = r * (0.16 + random() * 0.1);
      const sway = random() * Math.PI * 2;
      this.back.add({
        texture: frames.shard,
        spawn: {
          x: Math.cos(angle) * r * 0.9,
          y: Math.sin(angle) * r * 0.9,
          vx: Math.cos(angle) * r * 0.9,
          vy: -r * (0.9 + random() * 0.8),
          drag: 1.6,
          gravity: -r * 0.2,
          born: 0.12 + random() * 0.25,
          life: 0.8 + random() * 0.3,
        },
        look: {
          size: (life) => size * (1 - life * 0.3),
          height: (life) => size * 0.6 * (1 - life * 0.3) * Math.abs(Math.cos(life * 6 + sway)),
          alpha: (life) => 0.85 * Math.sin(Math.PI * Math.min(life * 1.2, 1)),
          tint: (life) => mixColor(EMBER_COLORS.rose, EMBER_COLORS.rubyLight, life),
          rotation: (age) => spin * age,
          drift: (age) => ({ x: Math.sin(age * 5 + sway) * r * 0.12, y: 0 }),
        },
      });
    }
    const top = -r * 1.25;
    for (const rotation of [0, Math.PI / 2]) {
      this.light.add({
        texture: frames.streak,
        anchorX: 0.5,
        spawn: { x: 0, y: top, ...still, born: 0.32, life: 0.5 },
        look: {
          size: (life) => r * (0.4 + 1.3 * bump(life, 0, 1)),
          height: () => r * 0.16,
          alpha: (life) => bump(life, 0, 1),
          tint: () => EMBER_COLORS.warm,
          rotation: () => rotation,
        },
      });
    }
    this.light.add({
      texture: frames.spark,
      spawn: { x: 0, y: top, ...still, born: 0.32, life: 0.5 },
      look: {
        size: (life) => r * 0.5 * bump(life, 0, 1),
        alpha: (life) => bump(life, 0, 1),
        tint: () => EMBER_COLORS.white,
      },
    });
  }

  private drawRings(t: number, r: number, scale: number): void {
    const g = this.rings.clear();
    for (let wave = 0; wave < 2; wave += 1) {
      const p = phase(t, wave * 0.14, wave * 0.14 + 0.55);
      if (p <= 0 || p >= 1) continue;
      g.circle(0, 0, r * (1 + p * 0.75)).stroke({
        width: Math.max(r * 0.09 * (1 - p), 1.5 / scale),
        color: wave === 0 ? EMBER_COLORS.rose : EMBER_COLORS.rubyLight,
        alpha: 0.9 * (1 - p),
      });
    }
    const halo = bump(t, 0.05, 0.6);
    if (halo > 0)
      g.circle(0, 0, r * 1.02).stroke({
        width: Math.max(r * 0.06, 2 / scale),
        color: EMBER_COLORS.warm,
        alpha: 0.6 * halo,
      });
  }
}
