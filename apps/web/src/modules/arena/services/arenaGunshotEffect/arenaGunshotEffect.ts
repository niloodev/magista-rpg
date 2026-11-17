import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  bladeOutline,
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
  GUNSHOT_COLORS,
  GUNSHOT_DURATION_MS,
  GUNSHOT_DUST,
  GUNSHOT_ENTRY_SPARKS,
  GUNSHOT_EXIT_SPARKS,
  GUNSHOT_SHARDS,
  GUNSHOT_SHOCKWAVE,
  GUNSHOT_WISPS,
} from "./arenaGunshotEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Where a shot comes from when there is no shooter (the example without an attacker). */
const DEFAULT_INCOMING: IArenaPoint2 = { x: 0.8, y: 0.6 };

/**
 * Impact of "Magia completamente normal mágica", a brutal gunshot: a blinding white punch on the side facing
 * the shooter, the bullet tearing out the far side in a jet of sparks, fire and debris, two hard shock rings,
 * the board shaking, the token slammed back along the shot and settling slowly, a dust cloud and a smoking
 * hole that lingers before fading.
 */
export class ArenaGunshotEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.4,
    blur: 5,
    quality: 3,
  });
  private readonly back: ArenaFxParticles;
  private readonly marks = new Graphics();
  private readonly blast = new Graphics();
  private readonly rings = new Graphics();
  private readonly light: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly direction: IArenaPoint2;
  private readonly entry: IArenaPoint2;
  private readonly exit: IArenaPoint2;
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
    this.entry = { x: -this.direction.x * r * 0.55, y: -this.direction.y * r * 0.55 };
    this.exit = { x: this.direction.x * r * 0.75, y: this.direction.y * r * 0.75 };
    this.back = new ArenaFxParticles(r * 6, "normal");
    this.light = new ArenaFxParticles(r * 6, "add");
    this.bloom.resolution = 1;
    this.blast.blendMode = "add";
    this.rings.blendMode = "add";
    this.amount = new ArenaAmountText(
      "gunshot",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.marks,
      this.back.container,
      this.rings,
      this.blast,
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
    const t = Math.min(elapsed / GUNSHOT_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    if (!this.rippled) {
      this.rippled = true;
      this.host.shockwave(
        this.container,
        r * scale * GUNSHOT_SHOCKWAVE.radii,
        GUNSHOT_SHOCKWAVE.durationMs,
        { amplitude: GUNSHOT_SHOCKWAVE.amplitude, wavelength: GUNSHOT_SHOCKWAVE.wavelength },
      );
    }
    const seconds = elapsed / 1000;
    this.drawBlast(seconds, r);
    this.drawRings(seconds, r, scale);
    this.drawHole(t, r);
    this.back.update(seconds);
    this.light.update(seconds);
    return { done: false, frame: this.knockback(seconds, r) };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** Slammed back along the shot at once and flattened by it, then settling home slowly, without a bounce. */
  private knockback(seconds: number, r: number): IArenaEffectFrame {
    const push = r * 0.5 * (1 - Math.exp(-seconds * 60)) * Math.exp(-seconds * 3.5);
    const squash = 0.16 * Math.exp(-seconds * 9);
    const across = Math.abs(this.direction.x) >= Math.abs(this.direction.y);
    return {
      dx: this.direction.x * push,
      dy: this.direction.y * push,
      scaleX: across ? 1 - squash : 1 + squash * 0.5,
      scaleY: across ? 1 + squash * 0.5 : 1 - squash,
    };
  }

  /**
   * The punch at the entry (a blinding white flash) and the jet out of the far side: long fire spikes along the
   * shot, white at the core, gone in ~200 ms.
   */
  private drawBlast(seconds: number, r: number): void {
    const g = this.blast.clear();
    if (seconds > 0.2) return;
    const fade = 1 - seconds / 0.2;
    const grow = 0.5 + 0.5 * Math.min(seconds / 0.03, 1);
    g.circle(this.entry.x, this.entry.y, r * 0.6 * grow).fill({
      color: GUNSHOT_COLORS.core,
      alpha: fade,
    });
    const heading = Math.atan2(this.direction.y, this.direction.x);
    const jets = [
      { a: 0, len: 3.2, w: 0.7 },
      { a: 0.3, len: 1.8, w: 0.4 },
      { a: -0.3, len: 1.8, w: 0.4 },
      { a: 0.65, len: 1.1, w: 0.3 },
      { a: -0.65, len: 1.1, w: 0.3 },
    ];
    for (const jet of jets) {
      const a = heading + jet.a;
      const tip = {
        x: this.exit.x + Math.cos(a) * r * jet.len * grow,
        y: this.exit.y + Math.sin(a) * r * jet.len * grow,
      };
      g.poly(bladeOutline(this.exit, tip, 0, r * jet.w * grow, 0, 1, 6)).fill({
        color: mixColor(GUNSHOT_COLORS.fire, GUNSHOT_COLORS.hot, fade),
        alpha: 0.85 * fade,
      });
      g.poly(bladeOutline(this.exit, tip, 0, r * jet.w * 0.3 * grow, 0, 0.85, 6)).fill({
        color: GUNSHOT_COLORS.core,
        alpha: fade,
      });
    }
  }

  /** Two hard shock rings racing out of the entry, the second one a beat later and wider. */
  private drawRings(seconds: number, r: number, scale: number): void {
    const g = this.rings.clear();
    for (const [delay, reach] of [
      [0, 1.8],
      [0.06, 2.8],
    ] as const) {
      const life = (seconds - delay) / 0.32;
      if (life < 0 || life >= 1) continue;
      const radius = r * (0.2 + reach * (1 - (1 - life) ** 3));
      g.circle(this.entry.x, this.entry.y, radius).stroke({
        width: Math.max(r * 0.09 * (1 - life), 1.5 / scale),
        color: GUNSHOT_COLORS.ring,
        alpha: 0.9 * (1 - life),
      });
    }
  }

  /** The bullet hole: a dark punched dot with a scorched rim and a dying glow, lingering before it fades. */
  private drawHole(t: number, r: number): void {
    const g = this.marks.clear();
    const alpha = phase(t, 0, 0.03) * (1 - phase(t, 0.75, 1));
    if (alpha <= 0) return;
    const { x, y } = this.entry;
    g.circle(x, y, r * 0.22).fill({ color: GUNSHOT_COLORS.holeRim, alpha: 0.6 * alpha });
    g.circle(x, y, r * 0.13).fill({ color: GUNSHOT_COLORS.hole, alpha: 0.95 * alpha });
    const glow = 1 - phase(t, 0.03, 0.35);
    if (glow > 0)
      g.circle(x, y, r * 0.08).fill({
        color: mixColor(GUNSHOT_COLORS.hot, GUNSHOT_COLORS.ember, 1 - glow),
        alpha: glow * alpha,
      });
  }

  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const frames = host.textures;
    const heading = Math.atan2(this.direction.y, this.direction.x);
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.light.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: 0.28 },
      look: {
        size: (life) => r * (4 - life * 1.5),
        alpha: (life) => (1 - life) ** 2,
        tint: (life) => mixColor(GUNSHOT_COLORS.core, GUNSHOT_COLORS.hot, life),
      },
    });
    const spark = (
      from: IArenaPoint2,
      angle: number,
      speed: number,
      length: number,
      born: number,
    ) =>
      this.light.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          ...from,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 3.5,
          gravity: r * 8,
          born,
          life: 0.25 + random() * 0.3,
        },
        look: {
          size: (life) => length * (1 - life * 0.5),
          height: () => r * 0.065,
          alpha: (life) => 1 - life * life,
          tint: (life) => mixColor(GUNSHOT_COLORS.core, GUNSHOT_COLORS.ember, life * 1.2),
          rotation: (_age, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    for (let index = 0; index < GUNSHOT_EXIT_SPARKS; index += 1)
      spark(
        this.exit,
        heading + (random() - 0.5) * 1.2,
        r * (8 + random() * 12),
        r * (0.4 + random() * 0.5),
        random() * 0.03,
      );
    for (let index = 0; index < GUNSHOT_ENTRY_SPARKS; index += 1)
      spark(
        this.entry,
        heading + Math.PI + (random() - 0.5) * 1.8,
        r * (4 + random() * 5),
        r * (0.25 + random() * 0.3),
        random() * 0.02,
      );
    for (let index = 0; index < GUNSHOT_SHARDS; index += 1) {
      const angle = heading + (random() - 0.5) * 1.5;
      const speed = r * (4 + random() * 7);
      const size = r * (0.1 + random() * 0.12);
      const spin = (random() - 0.5) * 30;
      this.back.add({
        texture: frames.shard,
        spawn: {
          ...this.exit,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 1.5,
          drag: 1.6,
          gravity: r * 12,
          born: 0.005,
          life: 0.6 + random() * 0.3,
        },
        look: {
          size: () => size,
          alpha: (life) => 1 - phase(life, 0.6, 1),
          tint: () => GUNSHOT_COLORS.shard,
          rotation: (age) => spin * age,
        },
      });
    }
    for (let index = 0; index < GUNSHOT_DUST; index += 1) {
      const out = index % 2 === 0;
      const angle = (out ? heading : heading + Math.PI) + (random() - 0.5) * 1.8;
      const speed = r * (1.5 + random() * 2.5);
      const base = r * (0.4 + random() * 0.3);
      this.back.add({
        texture: frames.smoke,
        spawn: {
          ...(out ? this.exit : this.entry),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 2.5,
          gravity: -r * 0.5,
          born: 0.01,
          life: 0.75 + random() * 0.3,
        },
        look: {
          size: (life) => base + r * 1.6 * life,
          alpha: (life) => 0.55 * (1 - life) * Math.min(life * 8, 1),
          tint: () => GUNSHOT_COLORS.dust,
        },
      });
    }
    for (let index = 0; index < GUNSHOT_WISPS; index += 1) {
      const sway = random() * 6;
      this.back.add({
        texture: frames.smoke,
        spawn: {
          ...this.entry,
          vx: 0,
          vy: -r * (0.6 + random() * 0.3),
          drag: 0.5,
          gravity: 0,
          born: 0.2 + index * 0.13,
          life: 0.55,
        },
        look: {
          size: (life) => r * (0.15 + 0.45 * life),
          alpha: (life) => 0.45 * Math.sin(Math.PI * life),
          tint: () => GUNSHOT_COLORS.smoke,
          drift: (age) => ({ x: Math.sin(age * 6 + sway) * r * 0.07, y: 0 }),
        },
      });
    }
  }
}
