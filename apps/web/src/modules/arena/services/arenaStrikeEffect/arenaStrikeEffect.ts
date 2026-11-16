import { ParticleContainer, Particle, Container, Graphics, Rectangle } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  ArenaAmountText,
  bladeOutline,
  bump,
  mixColor,
  particlePosition,
  particleVelocity,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  STRIKE_COLORS,
  STRIKE_DURATION_MS,
  STRIKE_HOT_SPARKS_PER_SLASH,
  STRIKE_SHARDS,
  STRIKE_SHOCKWAVE_MS,
  STRIKE_SHOCKWAVE_RADII,
  STRIKE_SLASH_FADE,
  STRIKE_SLASH_GAP,
  STRIKE_SLASH_START,
  STRIKE_SLASH_SWEEP,
  STRIKE_SLASHES,
  STRIKE_SMOKE,
  STRIKE_SPARKS_PER_SLASH,
} from "./arenaStrikeEffect.constants";
import type { IStrikeParticle, StrikeParticleKind } from "./arenaStrikeEffect.types";

const FRAME = 64;

/**
 * Golpe (damage to health): three blade cuts sweep across the token one after the other, each throwing white
 * hot sparks that cool down to ruby along the cut; the hit flashes with a ruby glow and a white core, shards
 * fall with gravity, dark smoke spreads, the map ripples around the token and the token shakes. Light particles
 * add up (additive blend) and a soft bloom makes them glow. Only used outside the performance mode.
 */
export class ArenaStrikeEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly back = new ParticleContainer({
    dynamicProperties: { position: true, rotation: true, vertex: true, color: true },
  });
  private readonly blades = new Graphics();
  private readonly flash = new Graphics();
  private readonly light = new ParticleContainer({
    dynamicProperties: { position: true, rotation: true, vertex: true, color: true },
  });
  private readonly amount: ArenaAmountText;
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    brightness: 1.05,
    blur: 5,
    quality: 3,
  });
  private readonly particles: IStrikeParticle[] = [];
  private start: number | null = null;
  private waved = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    this.container.eventMode = "none";
    this.blades.blendMode = "add";
    this.flash.blendMode = "add";
    this.light.blendMode = "add";
    this.bloom.resolution = 1;
    this.amount = new ArenaAmountText(
      "strike",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.addChild(this.back, this.flash, this.blades, this.light, this.amount.text);
    const reach = this.radius * 4;
    const area = new Rectangle(-reach, -reach, reach * 2, reach * 2);
    this.back.boundsArea = area;
    this.light.boundsArea = area;
    this.container.filters = [this.bloom];
    this.launch();
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 } };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / STRIKE_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.radius;
    this.amount.place(t, scale, r + lift, false);
    if (t >= 1) return { done: true, frame: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 } };
    if (!this.waved && t >= 0.04) {
      this.waved = true;
      this.host.shockwave(this.container, r * scale * STRIKE_SHOCKWAVE_RADII, STRIKE_SHOCKWAVE_MS);
    }
    this.drawFlash(t);
    this.drawBlades(t, scale);
    this.moveParticles(elapsed / 1000);
    const squash = 0.06 * bump(t, 0.02, 0.16);
    return {
      done: false,
      frame: { dx: shake(t, r * 0.1, 6, 0.45), dy: 0, scaleX: 1 + squash, scaleY: 1 - squash },
    };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  private get radius(): number {
    return this.options.size / 2;
  }

  private slashLine(index: number) {
    const slash = STRIKE_SLASHES[index] ?? STRIKE_SLASHES[0];
    const r = this.radius;
    const dir = { x: Math.cos(slash.angle), y: Math.sin(slash.angle) };
    const normal = { x: -dir.y, y: dir.x };
    const half = r * 1.2;
    const cx = normal.x * slash.offset * r;
    const cy = normal.y * slash.offset * r;
    const sign = index % 2 === 0 ? 1 : -1;
    return {
      from: { x: cx - dir.x * half * sign, y: cy - dir.y * half * sign },
      to: { x: cx + dir.x * half * sign, y: cy + dir.y * half * sign },
      dir: { x: dir.x * sign, y: dir.y * sign },
      bend: slash.bend,
    };
  }

  private add(
    container: ParticleContainer,
    kind: StrikeParticleKind,
    spawn: IStrikeParticle["spawn"],
    size: number,
    tint: number,
    spin = 0,
  ): void {
    const frames = this.host.textures;
    const texture =
      kind === "spark"
        ? frames.streak
        : kind === "shard"
          ? frames.shard
          : kind === "smoke"
            ? frames.smoke
            : kind === "hot"
              ? frames.spark
              : frames.glow;
    const particle = new Particle({
      texture,
      x: spawn.x,
      y: spawn.y,
      anchorX: kind === "spark" ? 1 : 0.5,
      anchorY: 0.5,
      tint,
      alpha: 0,
    });
    container.addParticle(particle);
    this.particles.push({ kind, spawn, particle, size, spin, tint });
  }

  /** Every particle is planned at once (seeded), then only moved frame by frame. */
  private launch(): void {
    const random = seededRandom(this.options.seed);
    const r = this.radius;
    const duration = STRIKE_DURATION_MS / 1000;
    STRIKE_SLASHES.forEach((_, index) => {
      const line = this.slashLine(index);
      const born =
        (STRIKE_SLASH_START + index * STRIKE_SLASH_GAP + STRIKE_SLASH_SWEEP * 0.5) * duration;
      const heading = Math.atan2(line.dir.y, line.dir.x);
      for (
        let spark = 0;
        spark < STRIKE_SPARKS_PER_SLASH + STRIKE_HOT_SPARKS_PER_SLASH;
        spark += 1
      ) {
        const hot = spark >= STRIKE_SPARKS_PER_SLASH;
        const along = 0.2 + random() * 0.6;
        const angle = heading + (random() - 0.5) * (hot ? 2.4 : 1.2);
        const speed = r * (hot ? 2 + random() * 3 : 4.5 + random() * 5);
        this.add(
          this.light,
          hot ? "hot" : "spark",
          {
            x: line.from.x + (line.to.x - line.from.x) * along,
            y: line.from.y + (line.to.y - line.from.y) * along,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - r * (hot ? 1.5 : 0.5),
            drag: hot ? 2.5 : 4,
            gravity: r * (hot ? 5 : 7),
            born: born + random() * 0.03,
            life: hot ? 0.45 + random() * 0.35 : 0.3 + random() * 0.3,
          },
          hot ? r * (0.1 + random() * 0.12) : r * (0.55 + random() * 0.5),
          hot ? STRIKE_COLORS.hot : STRIKE_COLORS.white,
        );
      }
    });
    const impact = (STRIKE_SLASH_START + STRIKE_SLASH_SWEEP) * duration;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.add(
      this.light,
      "glow",
      { x: 0, y: 0, ...still, born: impact, life: 0.42 },
      r * 2,
      STRIKE_COLORS.ruby,
    );
    this.add(
      this.light,
      "core",
      { x: 0, y: 0, ...still, born: impact, life: 0.2 },
      r * 1.1,
      STRIKE_COLORS.white,
    );
    for (let index = 0; index < STRIKE_SHARDS; index += 1) {
      const angle = (index / STRIKE_SHARDS) * Math.PI * 2 + (random() - 0.5) * 0.6;
      const speed = r * (2 + random() * 3.5);
      this.add(
        this.back,
        "shard",
        {
          x: Math.cos(angle) * r * 0.3,
          y: Math.sin(angle) * r * 0.3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r * 2,
          drag: 1.4,
          gravity: r * 8,
          born: impact + random() * 0.05,
          life: 0.55 + random() * 0.3,
        },
        r * (0.12 + random() * 0.12),
        index % 3 === 0 ? STRIKE_COLORS.ruby : STRIKE_COLORS.rubyDeep,
        (random() - 0.5) * 14,
      );
    }
    for (let index = 0; index < STRIKE_SMOKE; index += 1) {
      const angle = random() * Math.PI * 2;
      this.add(
        this.back,
        "smoke",
        {
          x: Math.cos(angle) * r * 0.35,
          y: Math.sin(angle) * r * 0.35,
          vx: Math.cos(angle) * r * 0.9,
          vy: Math.sin(angle) * r * 0.9 - r * 0.4,
          drag: 2.2,
          gravity: 0,
          born: impact + random() * 0.08,
          life: 0.7 + random() * 0.15,
        },
        r * (1 + random() * 0.6),
        STRIKE_COLORS.rubyDark,
        (random() - 0.5) * 1.5,
      );
    }
  }

  private moveParticles(seconds: number): void {
    for (const entry of this.particles) {
      const { spawn, particle, kind, size } = entry;
      const age = seconds - spawn.born;
      const life = age / spawn.life;
      if (age < 0 || life >= 1) {
        particle.alpha = 0;
        continue;
      }
      const { x, y } = particlePosition(spawn, age);
      particle.x = x;
      particle.y = y;
      const fadeOut = life < 0.6 ? 1 : 1 - (life - 0.6) / 0.4;
      if (kind === "spark") {
        const velocity = particleVelocity(spawn, age);
        const speed = Math.hypot(velocity.x, velocity.y);
        particle.rotation = Math.atan2(velocity.y, velocity.x);
        particle.scaleX = (size * Math.min(0.25 + speed / (this.radius * 9), 1.2)) / FRAME;
        particle.scaleY = (this.radius * 0.11) / FRAME;
        particle.tint =
          life < 0.35
            ? mixColor(STRIKE_COLORS.white, STRIKE_COLORS.rubyLight, life / 0.35)
            : mixColor(STRIKE_COLORS.rubyLight, STRIKE_COLORS.ruby, (life - 0.35) / 0.65);
        particle.alpha = fadeOut;
      } else if (kind === "hot") {
        const flicker = 0.75 + 0.25 * Math.sin(age * 60 + spawn.x);
        particle.scaleX = particle.scaleY = (size * (1 - life * 0.5)) / FRAME;
        particle.tint = mixColor(STRIKE_COLORS.hot, STRIKE_COLORS.ruby, life);
        particle.alpha = fadeOut * flicker;
      } else if (kind === "shard") {
        particle.rotation = entry.spin * age;
        particle.scaleX = particle.scaleY = size / FRAME;
        particle.alpha = fadeOut;
      } else if (kind === "smoke") {
        particle.rotation = entry.spin * age;
        particle.scaleX = particle.scaleY = (size * (0.6 + life * 0.9)) / FRAME;
        particle.alpha = 0.55 * Math.sin(Math.PI * Math.min(life * 1.4, 1)) * (1 - life);
      } else {
        const grow = kind === "glow" ? 0.6 + life * 1.3 : 0.8 + life * 0.6;
        particle.scaleX = particle.scaleY = (size * grow) / FRAME;
        particle.alpha = (kind === "glow" ? 0.9 : 1) * (1 - life) ** 1.6;
      }
    }
  }

  private drawFlash(t: number): void {
    const strength = 1 - phase(t, 0.05, 0.35);
    this.flash.clear();
    if (strength <= 0 || t < 0.05) return;
    this.flash.circle(0, 0, this.radius).fill({ color: STRIKE_COLORS.ruby, alpha: 0.5 * strength });
  }

  private drawBlades(t: number, scale: number): void {
    const g = this.blades.clear();
    const r = this.radius;
    STRIKE_SLASHES.forEach((_, index) => {
      const begin = STRIKE_SLASH_START + index * STRIKE_SLASH_GAP;
      const sweep = phase(t, begin, begin + STRIKE_SLASH_SWEEP);
      const fade = phase(
        t,
        begin + STRIKE_SLASH_SWEEP,
        begin + STRIKE_SLASH_SWEEP + STRIKE_SLASH_FADE,
      );
      if (sweep <= 0 || fade >= 1) return;
      const line = this.slashLine(index);
      const tail = Math.max(0, sweep - 0.55) + fade * sweep;
      const head = sweep;
      if (head - tail <= 0.01) return;
      const thin = 1 - fade;
      const outer = Math.max(r * 0.26 * thin, 3 / scale);
      const inner = Math.max(r * 0.08 * thin, 1.2 / scale);
      g.poly(bladeOutline(line.from, line.to, line.bend, outer, tail, head)).fill({
        color: STRIKE_COLORS.ruby,
        alpha: 0.75 * thin,
      });
      g.poly(bladeOutline(line.from, line.to, line.bend, inner, tail, head)).fill({
        color: STRIKE_COLORS.white,
        alpha: thin,
      });
    });
  }
}
