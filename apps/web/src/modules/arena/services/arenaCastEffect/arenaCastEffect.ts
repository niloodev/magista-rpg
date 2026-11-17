import { Container } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  bump,
  mixColor,
  phase,
  mixStops,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  CAST_DURATION_MS,
  CAST_FLORAL,
  CAST_FLORAL_PALETTES,
  CAST_PETAL_STOPS,
  CAST_GATHER_MOTES,
  CAST_HIT_MS,
  CAST_PALETTES,
  CAST_RELEASE,
  CAST_TRAIL_MOTES,
} from "./arenaCastEffect.constants";
import type { IArenaCastOptions } from "./arenaCastEffect.types";
import { castArc } from "./arenaCastEffect.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * The caster's part of a healing or of a blow to the mind: light gathers into the token (motes drawn in, an aura
 * blooming), then an orb flies in an arc to the target leaving glowing motes behind; the hit plays on the target
 * when the orb lands. Drawn in the caster's coordinates, so the flight stays put on the map.
 */
export class ArenaCastEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.3,
    blur: 6,
    quality: 3,
  });
  private readonly petals: ArenaFxParticles;
  private readonly particles: ArenaFxParticles;
  private start: number | null = null;

  constructor(options: IArenaCastOptions, host: IArenaFxHost) {
    const r = options.size / 2;
    const reach = Math.hypot(options.toward.x, options.toward.y) + r * 3;
    this.bloom.resolution = 1;
    this.particles = new ArenaFxParticles(reach, "add");
    this.petals = new ArenaFxParticles(reach, "normal");
    this.container.eventMode = "none";
    this.container.addChild(this.particles.container, this.petals.container);
    this.container.filters = [this.bloom];
    this.plan(options, host, r);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / CAST_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    this.petals.update(elapsed / 1000);
    this.particles.update(elapsed / 1000);
    const gather = 0.05 * bump(t, 0, CAST_RELEASE + 0.08);
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + gather, scaleY: 1 + gather } };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  private plan({ toward, palette, seed }: IArenaCastOptions, host: IArenaFxHost, r: number) {
    const random = seededRandom(seed);
    const colors = CAST_PALETTES[palette];
    const frames = host.textures;
    const duration = CAST_DURATION_MS / 1000;
    const release = CAST_RELEASE * duration;
    const flight = CAST_HIT_MS / 1000 - release;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    const flightPoint = (age: number) =>
      castArc(toward, Math.min(Math.max(age / flight, 0), 1) ** 1.3);
    this.particles.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: release + 0.25 },
      look: {
        size: (life) => r * (1.8 + 1.4 * life),
        alpha: (life) => 0.7 * bump(life, 0, 1),
        tint: () => colors.glow,
      },
    });
    for (let index = 0; index < CAST_GATHER_MOTES; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * (1.5 + random() * 0.8);
      const size = r * (0.08 + random() * 0.08);
      const born = random() * release * 0.6;
      const life = release - born + 0.02;
      this.particles.add({
        texture: frames.spark,
        spawn: { x: 0, y: 0, ...still, born, life },
        look: {
          size: () => size,
          alpha: (progress) => Math.sin(Math.PI * progress),
          tint: (progress) => mixColor(colors.glow, colors.core, progress),
          drift: (age) => {
            const k = 1 - Math.min(age / life, 1);
            return {
              x: Math.cos(angle + age * 4) * from * k,
              y: Math.sin(angle + age * 4) * from * k,
            };
          },
        },
      });
    }
    this.particles.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: release, life: flight + 0.04 },
      look: {
        size: (life) => r * (1.1 + 0.25 * Math.sin(life * 30)),
        alpha: () => 0.95,
        tint: () => colors.glow,
        drift: flightPoint,
      },
    });
    this.particles.add({
      texture: frames.spark,
      spawn: { x: 0, y: 0, ...still, born: release, life: flight + 0.04 },
      look: {
        size: () => r * 0.55,
        alpha: () => 1,
        tint: () => colors.core,
        drift: flightPoint,
      },
    });
    for (let index = 0; index < CAST_TRAIL_MOTES; index += 1) {
      const at = (index / CAST_TRAIL_MOTES) * flight;
      const point = flightPoint(at);
      const size = r * (0.12 + random() * 0.14);
      const angle = random() * Math.PI * 2;
      this.particles.add({
        texture: index % 2 === 0 ? frames.glow : frames.spark,
        spawn: {
          x: point.x,
          y: point.y,
          vx: Math.cos(angle) * r * 0.5,
          vy: Math.sin(angle) * r * 0.5,
          drag: 2,
          gravity: palette === "fissure" ? r * 0.6 : -r * 0.6,
          born: release + at,
          life: 0.35 + random() * 0.2,
        },
        look: {
          size: (life) => size * (1 - life * 0.6),
          alpha: (life) => 0.85 * (1 - life),
          tint: (life) => mixColor(colors.glow, colors.trail, life),
        },
      });
    }
    if (CAST_FLORAL_PALETTES.has(palette))
      this.planFloral(toward, frames, r, release, flight, random);
  }

  /**
   * A floral cast: petals spiral into the caster while it gathers, the orb carries a turning blossom (the bud),
   * and petals fall from it along the flight, fluttering.
   */
  private planFloral(
    toward: IArenaCastOptions["toward"],
    frames: IArenaFxHost["textures"],
    r: number,
    release: number,
    flight: number,
    random: () => number,
  ): void {
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    for (let index = 0; index < CAST_FLORAL.gather; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * (1.6 + random() * 1.1);
      const size = r * (0.2 + random() * 0.16);
      const born = random() * release * 0.55;
      const life = release - born + 0.02;
      const tone = random();
      const spin = (random() > 0.5 ? 1 : -1) * (3 + random() * 2);
      this.petals.add({
        texture: frames.petal,
        spawn: { x: 0, y: 0, ...still, born, life },
        look: {
          size: (l) => size * (1 - l * 0.5),
          height: (l) => size * (0.8 + 0.2 * Math.cos(l * 18)),
          alpha: (l) => Math.min(l * 5, 1) * (1 - phase(l, 0.85, 1)),
          tint: () => mixStops(CAST_PETAL_STOPS, tone),
          rotation: (age) => angle + age * spin * 2,
          drift: (age) => {
            const k = 1 - Math.min(age / life, 1);
            return {
              x: Math.cos(angle + age * spin) * from * k,
              y: Math.sin(angle + age * spin) * from * k,
            };
          },
        },
      });
    }
    this.petals.add({
      texture: frames.blossom,
      spawn: { x: 0, y: 0, ...still, born: release, life: flight + 0.04 },
      look: {
        size: () => r * 0.95,
        alpha: () => 1,
        tint: () => CAST_PETAL_STOPS[1],
        rotation: (age) => age * 9,
        drift: (age) => castArc(toward, Math.min(Math.max(age / flight, 0), 1) ** 1.3),
      },
    });
    for (let index = 0; index < CAST_FLORAL.shed; index += 1) {
      const at = (index / CAST_FLORAL.shed) * flight;
      const point = castArc(toward, Math.min(at / flight, 1) ** 1.3);
      const size = r * (0.18 + random() * 0.16);
      const tone = random();
      const spin = (random() - 0.5) * 10;
      const sway = random() * 6;
      this.petals.add({
        texture: index % 5 === 0 ? frames.blossom : frames.petal,
        spawn: {
          x: point.x,
          y: point.y,
          vx: (random() - 0.5) * r,
          vy: -r * 0.4,
          drag: 2,
          gravity: r * 1.4,
          born: release + at,
          life: 0.55 + random() * 0.35,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.7 + 0.3 * Math.cos(l * 16 + sway)),
          alpha: (l) => 1 - l * l,
          tint: () => mixStops(CAST_PETAL_STOPS, tone),
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 6 + sway) * r * 0.15, y: 0 }),
        },
      });
    }
  }
}
