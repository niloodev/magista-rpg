import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  crackPath,
  mixColor,
  phase,
  seededRandom,
  shake,
  starPolygon,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  SHOVEL_COLORS,
  SHOVEL_CRACKS,
  SHOVEL_DURATION_MS,
  SHOVEL_DUST,
  SHOVEL_DUST_RING,
  SHOVEL_PEBBLES,
  SHOVEL_SHOCKWAVE,
  SHOVEL_SPARKS,
} from "./arenaShovelEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

const DEFAULT_INCOMING: IArenaPoint2 = { x: 1, y: 0 };

/**
 * "Pazada" on the target: the attacker's shovel lands flat with a metallic CLANG. A white impact star bursts and
 * thin rings of sound race out, the ground cracks under the target, sparks of metal fly back along the blow, dust
 * is thrown up and rolls out in a ring on the ground, pebbles bounce away and the board ripples; the target is
 * flattened and wobbles back like jelly.
 */
export class ArenaShovelEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.45,
    bloomScale: 1.1,
    blur: 4,
    quality: 3,
  });
  private readonly cracks = new Graphics();
  private readonly clang = new Graphics();
  private readonly dust: ArenaFxParticles;
  private readonly sparks: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly heading: number;
  private readonly direction: IArenaPoint2;
  private start: number | null = null;
  private rippled = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const incoming = options.incoming ?? DEFAULT_INCOMING;
    const length = Math.hypot(incoming.x, incoming.y) || 1;
    this.direction = { x: incoming.x / length, y: incoming.y / length };
    this.heading = Math.atan2(this.direction.y, this.direction.x);
    const random = seededRandom(options.seed);
    this.drawCracks(r, random);
    this.dust = new ArenaFxParticles(r * 6, "normal");
    this.sparks = new ArenaFxParticles(r * 6, "add");
    this.plan(host, r, random);
    this.amount = new ArenaAmountText(
      "shovel",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.clang.blendMode = "add";
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(
      this.cracks,
      this.dust.container,
      this.clang,
      this.sparks.container,
      this.amount.text,
    );
    this.container.filters = [this.bloom];
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / SHOVEL_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    if (!this.rippled) {
      this.rippled = true;
      this.host.shockwave(
        this.container,
        r * scale * SHOVEL_SHOCKWAVE.radii,
        SHOVEL_SHOCKWAVE.durationMs,
        {
          amplitude: SHOVEL_SHOCKWAVE.amplitude,
          wavelength: SHOVEL_SHOCKWAVE.wavelength,
        },
      );
    }
    this.cracks.alpha = Math.min(t * 20, 1) * (1 - phase(t, 0.6, 1));
    this.cracks.scale.set(0.6 + 0.4 * Math.min(t * 8, 1));
    this.drawClang(t, r, scale);
    this.dust.update(elapsed / 1000);
    this.sparks.update(elapsed / 1000);
    return { done: false, frame: this.flatten(t, r) };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** Flattened by the blow, then wobbling back like jelly, pushed a little along the swing. */
  private flatten(t: number, r: number): IArenaEffectFrame {
    const squash = 0.45 * Math.exp(-t * 6) * Math.cos(t * 30);
    const jolt = r * 0.18 * Math.exp(-t * 14);
    return {
      dx: this.direction.x * jolt + shake(t, r * 0.05, 12, 0.3),
      dy: this.direction.y * jolt + r * 0.2 * Math.max(squash, 0),
      scaleX: 1 + squash * 0.75,
      scaleY: 1 - squash,
    };
  }

  /** The cracks in the ground under the target, drawn once: dark jagged lines with a light edge. */
  private drawCracks(r: number, random: () => number): void {
    const g = this.cracks;
    for (let index = 0; index < SHOVEL_CRACKS; index += 1) {
      const angle = (index / SHOVEL_CRACKS) * Math.PI * 2 + (random() - 0.5) * 0.6;
      const length = r * (1.1 + random() * 0.8);
      const points = crackPath(angle, 6, random).flatMap((point) => [
        point.x * length,
        point.y * length * 0.55 + r * 0.35,
      ]);
      g.poly(points, false).stroke({
        width: r * 0.09,
        color: SHOVEL_COLORS.crack,
        alpha: 0.85,
        cap: "round",
        join: "round",
      });
      g.poly(points, false).stroke({
        width: r * 0.025,
        color: SHOVEL_COLORS.crackEdge,
        alpha: 0.7,
        cap: "round",
        join: "round",
      });
    }
  }

  /**
   * The CLANG: a white impact star and flash on the target, then thin rings of metal sound racing out, one after
   * the other.
   */
  private drawClang(t: number, r: number, scale: number): void {
    const g = this.clang.clear();
    const since = phase(t, 0, 0.4);
    if (since >= 1) return;
    const flash = 1 - phase(since, 0, 0.22);
    if (flash > 0) {
      g.poly(
        starPolygon({ x: 0, y: 0 }, r * (1.2 + 0.6 * (1 - flash)), r * 0.45, 8, this.heading),
      ).fill({
        color: SHOVEL_COLORS.white,
        alpha: 0.85 * flash,
      });
      g.circle(0, 0, r * 0.7).fill({ color: SHOVEL_COLORS.spark, alpha: 0.7 * flash });
    }
    for (const delay of [0, 0.12, 0.24, 0.36]) {
      const life = phase(since, delay, delay + 0.55);
      if (life <= 0 || life >= 1) continue;
      g.circle(0, 0, r * (0.8 + 3 * life ** 0.7)).stroke({
        width: Math.max(r * 0.06 * (1 - life), 1 / scale),
        color: mixColor(SHOVEL_COLORS.white, SHOVEL_COLORS.steel, life),
        alpha: 1 - life,
      });
    }
  }

  /**
   * Sparks of metal thrown back along the blow, dust thrown up and rolling out in a ring on the ground, and
   * pebbles bouncing away.
   */
  private plan(host: IArenaFxHost, r: number, random: () => number): void {
    for (let index = 0; index < SHOVEL_SPARKS; index += 1) {
      const angle = this.heading + Math.PI + (random() - 0.5) * 2.8;
      const speed = r * (4 + random() * 7);
      const size = r * (0.1 + random() * 0.08);
      this.sparks.add({
        texture: host.textures.streak,
        anchorX: 1,
        spawn: {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 2,
          drag: 3,
          gravity: r * 9,
          born: 0,
          life: 0.35 + random() * 0.3,
        },
        look: {
          size: (l) => size * 3 * (1 - l * 0.6),
          height: () => size * 0.5,
          alpha: (l) => 1 - l,
          tint: (l) => mixColor(SHOVEL_COLORS.spark, SHOVEL_COLORS.steel, l),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    for (let index = 0; index < SHOVEL_DUST; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (1.2 + random() * 1.8);
      const size = r * (0.5 + random() * 0.4);
      const spin = (random() - 0.5) * 2;
      this.dust.add({
        texture: host.textures.smoke,
        spawn: {
          x: Math.cos(angle) * r * 0.5,
          y: r * 0.45 + Math.sin(angle) * r * 0.15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.35 - r * 0.9,
          drag: 3,
          gravity: 0,
          born: random() * 0.05,
          life: 0.8 + random() * 0.4,
        },
        look: {
          size: (l) => size * (0.6 + l),
          alpha: (l) => 0.6 * (1 - l),
          tint: (l) => mixColor(SHOVEL_COLORS.dust, SHOVEL_COLORS.dirt, l * 0.5),
          rotation: (age) => age * spin,
        },
      });
    }
    for (let index = 0; index < SHOVEL_DUST_RING; index += 1) {
      const angle = (index / SHOVEL_DUST_RING) * Math.PI * 2;
      const speed = r * (3.5 + random() * 1.5);
      const size = r * (0.35 + random() * 0.25);
      this.dust.add({
        texture: host.textures.smoke,
        spawn: {
          x: Math.cos(angle) * r * 0.6,
          y: r * 0.45 + Math.sin(angle) * r * 0.25,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.4,
          drag: 4,
          gravity: 0,
          born: 0.02,
          life: 0.7 + random() * 0.3,
        },
        look: {
          size: (l) => size * (0.7 + l * 0.8),
          alpha: (l) => 0.5 * (1 - l),
          tint: () => SHOVEL_COLORS.dust,
        },
      });
    }
    for (let index = 0; index < SHOVEL_PEBBLES; index += 1) {
      const angle = -Math.PI / 2 + (random() - 0.5) * 2.6;
      const speed = r * (3 + random() * 4);
      const size = r * (0.08 + random() * 0.09);
      const spin = (random() - 0.5) * 18;
      this.dust.add({
        texture: host.textures.shard,
        spawn: {
          x: (random() - 0.5) * r,
          y: r * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 0.6,
          gravity: r * 14,
          born: 0,
          life: 0.55 + random() * 0.3,
        },
        look: {
          size: () => size,
          alpha: (l) => 1 - phase(l, 0.7, 1),
          tint: () => SHOVEL_COLORS.dirt,
          rotation: (age) => age * spin,
        },
      });
    }
  }
}
