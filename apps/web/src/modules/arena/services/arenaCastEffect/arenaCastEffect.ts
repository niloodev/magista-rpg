import { Container } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  bump,
  mixColor,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  CAST_DURATION_MS,
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
  private readonly particles: ArenaFxParticles;
  private start: number | null = null;

  constructor(options: IArenaCastOptions, host: IArenaFxHost) {
    const r = options.size / 2;
    const reach = Math.hypot(options.toward.x, options.toward.y) + r * 3;
    this.bloom.resolution = 1;
    this.particles = new ArenaFxParticles(reach, "add");
    this.container.eventMode = "none";
    this.container.addChild(this.particles.container);
    this.container.filters = [this.bloom];
    this.plan(options, host, r);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / CAST_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
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
  }
}
