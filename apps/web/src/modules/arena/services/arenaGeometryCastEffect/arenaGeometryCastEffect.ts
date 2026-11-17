import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  bladeOutline,
  easeOutBack,
  mixColor,
  mixStops,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  GEOMETRY_CAST_DURATION_MS,
  GEOMETRY_COLORS,
  GEOMETRY_GLYPH_STOPS,
  GEOMETRY_DIGIT_RAIN,
  GEOMETRY_DIGIT_SHARE,
  GEOMETRY_ORBIT_GLYPHS,
  GEOMETRY_RELEASE,
  GEOMETRY_RIDERS,
  GEOMETRY_STRAND_GLYPHS,
  GEOMETRY_TRAVEL_MS,
} from "./arenaGeometryCastEffect.constants";
import type { IArenaGeometryCastOptions } from "./arenaGeometryCastEffect.types";
import { helixPoint, squarePoints } from "./arenaGeometryCastEffect.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * The caster's part of "Colapso da Geometria Não Euclidiana": the token rises a little while impossible figures
 * build up in blue around it (a Penrose triangle turning around the token, a tesseract folding over its head)
 * and math symbols orbit closer and closer; then it releases them: the figures flare out, a burst of axes and
 * ticks flashes, and two strands of symbols wind in a helix to the target, a bright head riding in front (the
 * collapse on the target starts when it arrives). Drawn in the caster's coordinates, so the stream stays put.
 */
export class ArenaGeometryCastEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.5,
    brightness: 1.05,
    blur: 6,
    quality: 3,
  });
  private readonly figures = new Graphics();
  private readonly beam = new Graphics();
  private readonly glyphs: ArenaFxParticles;
  private readonly light: ArenaFxParticles;
  private readonly length: number;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaGeometryCastOptions,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.length = Math.hypot(options.toward.x, options.toward.y) || 1;
    const reach = this.length + r * 4;
    this.glyphs = new ArenaFxParticles(reach, "add");
    this.light = new ArenaFxParticles(reach, "add");
    this.bloom.resolution = 1;
    this.figures.blendMode = "add";
    this.beam.blendMode = "add";
    this.container.eventMode = "none";
    this.container.addChild(this.beam, this.figures, this.glyphs.container, this.light.container);
    this.container.filters = [this.bloom];
    this.plan(host, r);
  }

  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / GEOMETRY_CAST_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    this.drawFigures(t, seconds, r, scale);
    this.drawBeam(t, r, scale);
    this.glyphs.update(seconds);
    this.light.update(seconds);
    const rise = phase(t, 0, GEOMETRY_RELEASE) * (1 - phase(t, GEOMETRY_RELEASE + 0.1, 0.8));
    const pulse =
      0.08 * Math.exp(-Math.max(t - GEOMETRY_RELEASE, 0) * 18) * (t >= GEOMETRY_RELEASE ? 1 : 0);
    return {
      done: false,
      frame: { dx: 0, dy: -r * 0.14 * rise, scaleX: 1 + pulse, scaleY: 1 + pulse },
    };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The impossible figures: a Penrose-like triangle of three shaded beams turning around the token and a
   * tesseract (two squares turning opposite ways, corners joined) over its head; they build up to the release,
   * then flare out and vanish.
   */
  private drawFigures(t: number, seconds: number, r: number, scale: number): void {
    const g = this.figures.clear();
    const build = easeOutBack(phase(t, 0.02, GEOMETRY_RELEASE * 0.8));
    const flare = phase(t, GEOMETRY_RELEASE, GEOMETRY_RELEASE + 0.12);
    if (build <= 0 || flare >= 1) return;
    const alpha = Math.min(build, 1) * (1 - flare);
    const grow = 1 + flare * 0.8;
    const width = Math.max(r * 0.035, 1 / scale);
    const outer = r * 1.55 * build * grow;
    const inner = outer * 0.62;
    const turn = seconds * 0.9;
    const vertex = (radius: number, index: number) => {
      const a = turn + (index * Math.PI * 2) / 3 - Math.PI / 2;
      return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
    };
    const shades = [GEOMETRY_COLORS.ice, GEOMETRY_COLORS.blue, GEOMETRY_COLORS.indigo];
    for (let index = 0; index < 3; index += 1) {
      const o1 = vertex(outer, index);
      const o2 = vertex(outer, index + 1);
      const i1 = vertex(inner, index);
      const i2 = vertex(inner, index + 1);
      const bite = { x: i2.x + (o2.x - i2.x) * 0.35, y: i2.y + (o2.y - i2.y) * 0.35 };
      g.poly([o1.x, o1.y, o2.x, o2.y, bite.x, bite.y, i2.x, i2.y, i1.x, i1.y])
        .fill({ color: shades[index] ?? GEOMETRY_COLORS.blue, alpha: 0.22 * alpha })
        .stroke({ width, color: GEOMETRY_COLORS.cyan, alpha: 0.9 * alpha });
    }
    const head = { x: 0, y: -r * (1.75 + 0.1 * Math.sin(seconds * 3)) };
    const half = r * 0.48 * build * grow;
    const outerSquare = squarePoints(head, half, seconds * 1.3);
    const innerSquare = squarePoints(
      head,
      half * (0.45 + 0.1 * Math.sin(seconds * 5)),
      -seconds * 2.1,
    );
    g.poly(outerSquare).stroke({ width, color: GEOMETRY_COLORS.cyan, alpha });
    g.poly(innerSquare).stroke({ width, color: GEOMETRY_COLORS.ice, alpha });
    for (let index = 0; index < 4; index += 1) {
      const ox = outerSquare[index * 2] ?? 0;
      const oy = outerSquare[index * 2 + 1] ?? 0;
      const ix = innerSquare[index * 2] ?? 0;
      const iy = innerSquare[index * 2 + 1] ?? 0;
      g.moveTo(ox, oy)
        .lineTo(ix, iy)
        .stroke({ width: width * 0.8, color: GEOMETRY_COLORS.blue, alpha });
      g.circle(ox, oy, width * 1.6).fill({ color: GEOMETRY_COLORS.white, alpha });
      g.circle(ix, iy, width * 1.3).fill({ color: GEOMETRY_COLORS.ice, alpha });
    }
    if (flare > 0) {
      const cross = r * (1.2 + flare * 3);
      const ticks = 8;
      for (const axis of [0, Math.PI / 2]) {
        const dir = { x: Math.cos(axis + turn), y: Math.sin(axis + turn) };
        g.moveTo(-dir.x * cross, -dir.y * cross)
          .lineTo(dir.x * cross, dir.y * cross)
          .stroke({ width, color: GEOMETRY_COLORS.white, alpha: 1 - flare });
        for (let tick = -ticks; tick <= ticks; tick += 1) {
          if (tick === 0) continue;
          const at = (tick / ticks) * cross;
          const normal = { x: -dir.y, y: dir.x };
          const size = r * 0.06;
          g.moveTo(dir.x * at - normal.x * size, dir.y * at - normal.y * size)
            .lineTo(dir.x * at + normal.x * size, dir.y * at + normal.y * size)
            .stroke({ width: width * 0.8, color: GEOMETRY_COLORS.ice, alpha: 1 - flare });
        }
      }
    }
  }

  /** A faint straight guide line from the caster to the head of the stream, fading after the hit. */
  private drawBeam(t: number, r: number, scale: number): void {
    const g = this.beam.clear();
    const ms = (t - GEOMETRY_RELEASE) * GEOMETRY_CAST_DURATION_MS;
    if (ms < 0) return;
    const head = Math.min(ms / GEOMETRY_TRAVEL_MS, 1);
    const fade = 1 - phase(ms, GEOMETRY_TRAVEL_MS, GEOMETRY_TRAVEL_MS + 300);
    if (fade <= 0) return;
    const to = { x: this.options.toward.x * head, y: this.options.toward.y * head };
    g.poly(bladeOutline({ x: 0, y: 0 }, to, 0, Math.max(r * 0.12, 1.5 / scale), 0, 1, 4)).fill({
      color: GEOMETRY_COLORS.cyan,
      alpha: 0.35 * fade,
    });
    g.poly(bladeOutline({ x: 0, y: 0 }, to, 0, Math.max(r * 0.03, 1 / scale), 0, 1, 4)).fill({
      color: GEOMETRY_COLORS.white,
      alpha: 0.7 * fade,
    });
  }

  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const frames = host.textures;
    const glyph = () => {
      const pool = random() < GEOMETRY_DIGIT_SHARE ? frames.digits : frames.glyphs;
      return pool[Math.floor(random() * pool.length)] ?? frames.spark;
    };
    const release = (GEOMETRY_CAST_DURATION_MS * GEOMETRY_RELEASE) / 1000;
    const travel = GEOMETRY_TRAVEL_MS / 1000;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.light.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: release + 0.15 },
      look: {
        size: (life) => r * (1.6 + 1.6 * life),
        alpha: (life) => 0.55 * Math.sin(Math.PI * life),
        tint: (life) => mixColor(GEOMETRY_COLORS.blue, GEOMETRY_COLORS.cyan, life),
      },
    });
    for (let index = 0; index < GEOMETRY_ORBIT_GLYPHS; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * (1.6 + random() * 1.2);
      const spin = (random() > 0.5 ? 1 : -1) * (2 + random() * 2);
      const size = r * (0.28 + random() * 0.18);
      const born = random() * release * 0.5;
      const life = release - born;
      this.glyphs.add({
        texture: glyph(),
        spawn: { x: 0, y: 0, ...still, born, life },
        look: {
          size: (l) => size * (1 - l * 0.4),
          alpha: (l) => Math.min(l * 4, 1) * (1 - phase(l, 0.85, 1)),
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, 0.15 + l * 0.5),
          rotation: (age) => age * spin * 0.4,
          drift: (age) => {
            const k = 1 - Math.min(age / life, 1) * 0.75;
            return {
              x: Math.cos(angle + age * spin) * from * k,
              y: Math.sin(angle + age * spin) * from * k * 0.8,
            };
          },
        },
      });
    }
    for (let index = 0; index < GEOMETRY_DIGIT_RAIN; index += 1) {
      const digit = frames.digits[Math.floor(random() * frames.digits.length)] ?? frames.spark;
      const size = r * (0.2 + random() * 0.14);
      const sway = random() * 6;
      this.glyphs.add({
        texture: digit,
        spawn: {
          x: (random() - 0.5) * r * 2.6,
          y: r * (0.2 + random() * 0.8),
          vx: 0,
          vy: -r * (1.4 + random() * 1.4),
          drag: 0.4,
          gravity: 0,
          born: random() * release,
          life: 0.45 + random() * 0.3,
        },
        look: {
          size: () => size,
          alpha: (l) => Math.sin(Math.PI * l),
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, 0.1 + l * 0.7),
          drift: (age) => ({ x: Math.sin(age * 5 + sway) * r * 0.1, y: 0 }),
        },
      });
    }
    for (let index = 0; index < GEOMETRY_STRAND_GLYPHS; index += 1) {
      const s = (index + 0.5) / GEOMETRY_STRAND_GLYPHS;
      const strand = index % 2 === 0 ? 0 : Math.PI;
      const point = helixPoint(this.options.toward, s, r * 0.7, 2.5, strand);
      const size = r * (0.24 + random() * 0.16);
      const spin = (random() - 0.5) * 6;
      this.glyphs.add({
        texture: glyph(),
        spawn: {
          ...point,
          vx: (random() - 0.5) * r * 0.5,
          vy: (random() - 0.5) * r * 0.5,
          drag: 2,
          gravity: 0,
          born: release + travel * s,
          life: 0.45 + random() * 0.25,
        },
        look: {
          size: (l) => size * (1.3 - l * 0.6),
          alpha: (l) => 1 - l,
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, l),
          rotation: (age) => age * spin,
        },
      });
    }
    for (let index = 0; index < GEOMETRY_RIDERS; index += 1) {
      const offset = (index / GEOMETRY_RIDERS) * Math.PI * 2;
      const size = r * (0.3 + random() * 0.12);
      this.glyphs.add({
        texture: glyph(),
        spawn: { x: 0, y: 0, ...still, born: release, life: travel + 0.02 },
        look: {
          size: () => size,
          alpha: () => 1,
          tint: () => GEOMETRY_COLORS.white,
          drift: (age) =>
            helixPoint(this.options.toward, Math.min(age / travel, 1), r * 0.55, 2.5, offset),
        },
      });
    }
    for (const [texture, size, tint] of [
      [frames.glow, 1.3, GEOMETRY_COLORS.blue],
      [frames.spark, 0.7, GEOMETRY_COLORS.white],
    ] as const) {
      this.light.add({
        texture,
        spawn: { x: 0, y: 0, ...still, born: release, life: travel + 0.03 },
        look: {
          size: () => r * size,
          alpha: () => 1,
          tint: () => tint,
          drift: (age) => {
            const s = Math.min(age / travel, 1);
            return { x: this.options.toward.x * s, y: this.options.toward.y * s };
          },
        },
      });
    }
  }
}
