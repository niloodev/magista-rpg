import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  easeOutBack,
  mixColor,
  mixStops,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  FLORAL_BURST_PETALS,
  FLORAL_COLORS,
  FLORAL_DURATION_MS,
  FLORAL_LAYERS,
  FLORAL_PETAL_STOPS,
  FLORAL_PHASES,
  FLORAL_POLLEN,
  FLORAL_RAIN_PETALS,
  FLORAL_RING_BLOSSOMS,
  FLORAL_SWEEP_PETALS,
} from "./arenaFloralEffect.constants";
import type { FloralVariant } from "./arenaFloralEffect.types";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Where the blow comes from when there is no attacker (the example without one). */
const DEFAULT_INCOMING: IArenaPoint2 = { x: 1, y: 0.2 };

/**
 * Pink flowers on the target (made for Helena). A big rose-pink flower blooms over the token, ring after ring
 * of petals unfolding in a spiral around a golden heart, holds a beat and bursts into a storm of turning petals
 * and pollen. The strike variant (Golpe Floral) opens fast with a sweep of petals across the token along the
 * blow; the cast variant (Conjuração Floral) opens bigger and slower, petals rain from above and little flowers
 * pop in a ring on the floor.
 */
export class ArenaFloralEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.35,
    bloomScale: 1.2,
    blur: 5,
    quality: 3,
  });
  private readonly glow: ArenaFxParticles;
  private readonly ring = new Graphics();
  private readonly flower = new Graphics();
  private readonly petals: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly direction: IArenaPoint2;
  private readonly duration: number;
  private readonly phases: (typeof FLORAL_PHASES)[FloralVariant];
  private readonly turn: number;
  private start: number | null = null;
  private rippled = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
    private readonly variant: FloralVariant,
  ) {
    const r = options.size / 2;
    const incoming = options.incoming ?? DEFAULT_INCOMING;
    const length = Math.hypot(incoming.x, incoming.y) || 1;
    this.direction = { x: incoming.x / length, y: incoming.y / length };
    this.duration = FLORAL_DURATION_MS[variant];
    this.phases = FLORAL_PHASES[variant];
    const random = seededRandom(options.seed);
    this.turn = random() * Math.PI * 2;
    this.glow = new ArenaFxParticles(r * 6, "add");
    this.petals = new ArenaFxParticles(r * 6, "normal");
    this.bloom.resolution = 1;
    this.amount = new ArenaAmountText(
      variant === "strike" ? "floralStrike" : "floralCast",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.glow.container,
      this.ring,
      this.flower,
      this.petals.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
    this.plan(host, r, random);
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / this.duration, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    if (!this.rippled && t >= this.phases.burst) {
      this.rippled = true;
      this.host.shockwave(this.container, r * scale * 3, 520, { amplitude: 16, wavelength: 90 });
    }
    const seconds = elapsed / 1000;
    this.drawFlower(t, seconds, r);
    if (this.variant === "cast") this.drawRing(t, r, scale);
    this.glow.update(seconds);
    this.petals.update(seconds);
    return { done: false, frame: this.sway(t, seconds, r) };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** The strike pushes the token along the blow; both swell when the flower bursts and sway softly after. */
  private sway(t: number, seconds: number, r: number): IArenaEffectFrame {
    const hit = this.variant === "strike" ? r * 0.2 * Math.exp(-seconds * 10) : 0;
    const burst =
      0.08 *
      easeOutBack(phase(t, this.phases.burst, this.phases.burst + 0.1)) *
      (1 - phase(t, this.phases.burst + 0.1, 0.8));
    const drift = phase(t, this.phases.burst, 1);
    const swing = r * 0.04 * Math.sin(seconds * 9) * drift * (1 - drift);
    return {
      dx: this.direction.x * hit + swing,
      dy: this.direction.y * hit,
      scaleX: 1 + burst,
      scaleY: 1 + burst,
    };
  }

  /**
   * The big flower: rings of petals unfolding one after the other in a spiral (outer deep pink, inner blush),
   * a golden heart with pollen dots; it holds, then dissolves as the petal burst flies off.
   */
  private drawFlower(t: number, seconds: number, r: number): void {
    const g = this.flower.clear();
    const fade = 1 - phase(t, this.phases.burst, this.phases.burst + 0.06);
    if (fade <= 0) return;
    const size = r * (this.variant === "cast" ? 2.1 : 1.6);
    const twist = this.turn + seconds * 0.5;
    FLORAL_LAYERS.forEach((layer, index) => {
      const open = easeOutBack(phase(t, index * 0.04, this.phases.open + index * 0.03));
      if (open <= 0) return;
      const length = size * layer.length * open;
      const width = size * layer.width * open;
      const color =
        [FLORAL_COLORS.deep, FLORAL_COLORS.pink, FLORAL_COLORS.light][index] ?? FLORAL_COLORS.pink;
      const rim = mixColor(color, FLORAL_COLORS.white, 0.35);
      const spin = twist * (index % 2 === 0 ? 1 : -1) + (1 - open) * 1.4 + index * 0.35;
      for (let petal = 0; petal < layer.petals; petal += 1) {
        const a = spin + (petal / layer.petals) * Math.PI * 2;
        const along = { x: Math.cos(a), y: Math.sin(a) };
        const across = { x: -along.y, y: along.x };
        const at = (u: number, v: number): [number, number] => [
          along.x * u + across.x * v,
          along.y * u + across.y * v,
        ];
        g.moveTo(...at(size * 0.04, 0))
          .bezierCurveTo(
            ...at(length * 0.35, width * 0.75),
            ...at(length * 0.95, width * 0.55),
            ...at(length, 0),
          )
          .bezierCurveTo(
            ...at(length * 0.95, -width * 0.55),
            ...at(length * 0.35, -width * 0.75),
            ...at(size * 0.04, 0),
          )
          .fill({ color, alpha: 0.92 * fade })
          .stroke({ width: Math.max(size * 0.012, 0.6), color: rim, alpha: 0.7 * fade });
        g.moveTo(...at(size * 0.08, 0))
          .lineTo(...at(length * 0.75, 0))
          .stroke({
            width: Math.max(size * 0.008, 0.5),
            color: FLORAL_COLORS.rose,
            alpha: 0.35 * fade,
          });
      }
    });
    const heart = easeOutBack(phase(t, 0.08, this.phases.open));
    if (heart > 0) {
      g.circle(0, 0, size * 0.16 * heart).fill({ color: FLORAL_COLORS.pollen, alpha: fade });
      g.circle(0, 0, size * 0.1 * heart).fill({ color: FLORAL_COLORS.gold, alpha: fade });
      for (let dot = 0; dot < 10; dot += 1) {
        const a = twist * 2 + (dot / 10) * Math.PI * 2;
        g.circle(
          Math.cos(a) * size * 0.2 * heart,
          Math.sin(a) * size * 0.2 * heart,
          size * 0.025,
        ).fill({
          color: FLORAL_COLORS.gold,
          alpha: fade,
        });
      }
    }
  }

  /** The cast's ring of light on the floor that the little flowers pop along. */
  private drawRing(t: number, r: number, scale: number): void {
    const g = this.ring.clear();
    const grow = easeOutBack(phase(t, 0.05, 0.3));
    const fade = 1 - phase(t, 0.7, 1);
    if (grow <= 0 || fade <= 0) return;
    g.ellipse(0, r * 0.55, r * 1.9 * grow, r * 0.75 * grow).stroke({
      width: Math.max(r * 0.05, 1 / scale),
      color: FLORAL_COLORS.light,
      alpha: 0.7 * fade,
    });
  }

  private plan(host: IArenaFxHost, r: number, random: () => number): void {
    const frames = host.textures;
    const seconds = this.duration / 1000;
    const burst = this.phases.burst * seconds;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.glow.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: burst + 0.4 },
      look: {
        size: (life) => r * (2.6 + 1.2 * life),
        alpha: (life) => 0.6 * Math.sin(Math.PI * life),
        tint: (life) => mixColor(FLORAL_COLORS.light, FLORAL_COLORS.deep, life),
      },
    });
    for (let index = 0; index < FLORAL_BURST_PETALS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (3 + random() * 5);
      const size = r * (0.22 + random() * 0.22);
      const spin = (random() - 0.5) * 12;
      const sway = random() * 6;
      const tone = random();
      this.petals.add({
        texture: index % 7 === 0 ? frames.blossom : frames.petal,
        spawn: {
          x: Math.cos(angle) * r * 0.5,
          y: Math.sin(angle) * r * 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r,
          drag: 2.6,
          gravity: r * 1.8,
          born: burst,
          life: 0.8 + random() * 0.5,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.7 + 0.3 * Math.cos(l * 16 + sway)),
          alpha: (l) => 1 - l * l,
          tint: () => mixStops(FLORAL_PETAL_STOPS, tone),
          rotation: (age) => angle + Math.PI / 2 + age * spin,
          drift: (age) => ({ x: Math.sin(age * 5 + sway) * r * 0.18, y: 0 }),
        },
      });
    }
    for (let index = 0; index < FLORAL_POLLEN; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (1 + random() * 3);
      const size = r * (0.05 + random() * 0.06);
      const flicker = random() * 10;
      this.glow.add({
        texture: frames.spark,
        spawn: {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 0.8,
          drag: 2,
          gravity: -r * 0.3,
          born: burst + random() * 0.1,
          life: 0.6 + random() * 0.5,
        },
        look: {
          size: () => size,
          alpha: (l) => (1 - l) * (0.6 + 0.4 * Math.sin(l * 30 + flicker)),
          tint: (l) => mixColor(FLORAL_COLORS.gold, FLORAL_COLORS.light, l),
        },
      });
    }
    if (this.variant === "strike") this.planSweep(frames, r, random);
    else this.planRain(frames, r, random, seconds);
  }

  /** The strike: a gust of petals swept across the token along the blow as the flower opens. */
  private planSweep(frames: IArenaFxHost["textures"], r: number, random: () => number): void {
    const normal = { x: -this.direction.y, y: this.direction.x };
    for (let index = 0; index < FLORAL_SWEEP_PETALS; index += 1) {
      const side = (random() - 0.5) * r * 2;
      const speed = r * (5 + random() * 4);
      const size = r * (0.2 + random() * 0.18);
      const spin = (random() - 0.5) * 16;
      const tone = random();
      this.petals.add({
        texture: frames.petal,
        spawn: {
          x: -this.direction.x * r * 1.4 + normal.x * side,
          y: -this.direction.y * r * 1.4 + normal.y * side,
          vx: this.direction.x * speed,
          vy: this.direction.y * speed - r * 0.6,
          drag: 2.4,
          gravity: r * 1.4,
          born: random() * 0.06,
          life: 0.7 + random() * 0.3,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.7 + 0.3 * Math.cos(l * 18)),
          alpha: (l) => Math.min(l * 10, 1) * (1 - l * l),
          tint: () => mixStops(FLORAL_PETAL_STOPS, tone),
          rotation: (age) => Math.atan2(this.direction.y, this.direction.x) + age * spin,
        },
      });
    }
  }

  /** The cast: petals raining softly from above and little flowers popping one by one in a ring on the floor. */
  private planRain(
    frames: IArenaFxHost["textures"],
    r: number,
    random: () => number,
    seconds: number,
  ): void {
    for (let index = 0; index < FLORAL_RAIN_PETALS; index += 1) {
      const size = r * (0.18 + random() * 0.16);
      const spin = (random() - 0.5) * 8;
      const sway = random() * 6;
      const tone = random();
      this.petals.add({
        texture: frames.petal,
        spawn: {
          x: (random() - 0.5) * r * 4,
          y: -r * (2.2 + random()),
          vx: 0,
          vy: r * (0.6 + random() * 0.6),
          drag: 0.3,
          gravity: r * 0.5,
          born: random() * seconds * 0.6,
          life: 1 + random() * 0.4,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.65 + 0.35 * Math.cos(l * 14 + sway)),
          alpha: (l) => Math.sin(Math.PI * l),
          tint: () => mixStops(FLORAL_PETAL_STOPS, tone),
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 3 + sway) * r * 0.35, y: 0 }),
        },
      });
    }
    for (let index = 0; index < FLORAL_RING_BLOSSOMS; index += 1) {
      const a = (index / FLORAL_RING_BLOSSOMS) * Math.PI * 2;
      const size = r * (0.4 + random() * 0.15);
      const tone = random();
      this.petals.add({
        texture: frames.blossom,
        spawn: {
          x: Math.cos(a) * r * 1.9,
          y: r * 0.55 + Math.sin(a) * r * 0.75,
          vx: 0,
          vy: 0,
          drag: 0,
          gravity: 0,
          born: 0.15 + (index / FLORAL_RING_BLOSSOMS) * 0.35,
          life: seconds * 0.6,
        },
        look: {
          size: (l) => size * easeOutBack(Math.min(l * 6, 1)) * (1 - phase(l, 0.8, 1)),
          alpha: (l) => 1 - phase(l, 0.8, 1),
          tint: () => mixStops(FLORAL_PETAL_STOPS, 0.2 + tone * 0.6),
          rotation: (age) => age * 1.5 + a,
        },
      });
    }
  }
}
