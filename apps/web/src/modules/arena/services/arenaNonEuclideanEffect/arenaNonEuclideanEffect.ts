import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import { GEOMETRY_GLYPH_STOPS } from "@/modules/arena/services/arenaGeometryCastEffect";
import {
  ArenaAmountText,
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
  NON_EUCLIDEAN_BURST_GLYPHS,
  NON_EUCLIDEAN_BURST_SPARKS,
  NON_EUCLIDEAN_COLLAPSE,
  NON_EUCLIDEAN_COLORS,
  NON_EUCLIDEAN_DIGIT_RING,
  NON_EUCLIDEAN_DIGIT_SHARE,
  NON_EUCLIDEAN_DURATION_MS,
  NON_EUCLIDEAN_LAYERS,
  NON_EUCLIDEAN_SHOCKWAVE,
  NON_EUCLIDEAN_SPIRAL_GLYPHS,
} from "./arenaNonEuclideanEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Colapso da Geometria Não Euclidiana" on the target: a lattice of nested blue polygons (octagon down to a
 * triangle, each corner wired to the next layer) appears around the token in an impossible perspective, every
 * layer turning its own way and folding inward faster and faster while math symbols spiral into the center and
 * a void opens there; the token is crushed toward the point. At the collapse everything is gone in a blinding
 * blue-white burst: the board ripples, a ring races out, sparks and symbols are thrown everywhere and the token
 * springs back.
 */
export class ArenaNonEuclideanEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = NON_EUCLIDEAN_COLLAPSE * NON_EUCLIDEAN_DURATION_MS;
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.5,
    brightness: 1.05,
    blur: 6,
    quality: 3,
  });
  private readonly voidDisk = new Graphics();
  private readonly lattice = new Graphics();
  private readonly burst = new Graphics();
  private readonly glyphs: ArenaFxParticles;
  private readonly light: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly tilt: number;
  private start: number | null = null;
  private rippled = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed);
    this.tilt = random() * Math.PI;
    this.glyphs = new ArenaFxParticles(r * 6, "add");
    this.light = new ArenaFxParticles(r * 6, "add");
    this.bloom.resolution = 1;
    this.lattice.blendMode = "add";
    this.burst.blendMode = "add";
    this.amount = new ArenaAmountText(
      "nonEuclidean",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(
      this.voidDisk,
      this.lattice,
      this.glyphs.container,
      this.burst,
      this.light.container,
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
    const t = Math.min(elapsed / NON_EUCLIDEAN_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < NON_EUCLIDEAN_COLLAPSE) this.amount.text.visible = false;
    else this.amount.place(phase(t, NON_EUCLIDEAN_COLLAPSE, 1), scale, r + lift, false);
    if (t >= 1) return { done: true, frame: REST };
    if (!this.rippled && t >= NON_EUCLIDEAN_COLLAPSE) {
      this.rippled = true;
      this.host.shockwave(
        this.container,
        r * scale * NON_EUCLIDEAN_SHOCKWAVE.radii,
        NON_EUCLIDEAN_SHOCKWAVE.durationMs,
        {
          amplitude: NON_EUCLIDEAN_SHOCKWAVE.amplitude,
          wavelength: NON_EUCLIDEAN_SHOCKWAVE.wavelength,
        },
      );
    }
    const seconds = elapsed / 1000;
    this.drawVoid(t, r);
    this.drawLattice(t, seconds, r, scale);
    this.drawBurst(t, r, scale);
    this.glyphs.update(seconds);
    this.light.update(seconds);
    return { done: false, frame: this.warp(t, seconds) };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The token is crushed toward the point, wobbling between flattened and stretched as the space folds, then
   * thrown back out by the burst with an overshoot.
   */
  private warp(t: number, seconds: number): IArenaEffectFrame {
    if (t < NON_EUCLIDEAN_COLLAPSE) {
      const pull = phase(t, 0.05, NON_EUCLIDEAN_COLLAPSE) ** 2;
      const fold = 0.12 * pull * Math.sin(seconds * 26);
      const shrink = 1 - 0.45 * pull;
      return { dx: 0, dy: 0, scaleX: shrink * (1 + fold), scaleY: shrink * (1 - fold) };
    }
    const after = phase(t, NON_EUCLIDEAN_COLLAPSE, 1);
    const spring = 1 + 0.35 * Math.exp(-after * 9) * Math.cos(after * 22);
    const start = 0.55 + 0.45 * Math.min(after * 12, 1);
    return { dx: 0, dy: 0, scaleX: start * spring, scaleY: start * spring };
  }

  /** A dark void opening at the center as the lattice falls in, swallowed by the burst. */
  private drawVoid(t: number, r: number): void {
    const g = this.voidDisk.clear();
    const open = phase(t, 0.15, NON_EUCLIDEAN_COLLAPSE);
    const gone = phase(t, NON_EUCLIDEAN_COLLAPSE, NON_EUCLIDEAN_COLLAPSE + 0.05);
    if (open <= 0 || gone >= 1) return;
    const radius = r * 0.85 * Math.sin((open * Math.PI) / 2) * (1 - gone);
    g.circle(0, 0, radius * 1.35).fill({ color: NON_EUCLIDEAN_COLORS.deep, alpha: 0.55 * open });
    g.circle(0, 0, radius).fill({ color: NON_EUCLIDEAN_COLORS.void, alpha: 0.85 * open });
    g.circle(0, 0, radius).stroke({
      width: r * 0.05,
      color: NON_EUCLIDEAN_COLORS.cyan,
      alpha: 0.8 * open,
    });
  }

  /**
   * The lattice: nested polygons in an impossible perspective (each layer tilted its own way), turning in
   * alternating directions ever faster and shrinking into the point, every corner wired to the next layer.
   */
  private drawLattice(t: number, seconds: number, r: number, scale: number): void {
    const g = this.lattice.clear();
    const appear = phase(t, 0, 0.12);
    const fall = phase(t, 0.08, NON_EUCLIDEAN_COLLAPSE);
    if (appear <= 0 || fall >= 1) return;
    const alpha = appear * (1 - phase(fall, 0.85, 1));
    const width = Math.max(r * 0.03, 1 / scale);
    const layers = NON_EUCLIDEAN_LAYERS.map((sides, index) => {
      const depth = index / (NON_EUCLIDEAN_LAYERS.length - 1);
      const radius = r * (2.6 - depth * 1.7) * (1 - fall ** 1.6);
      const direction = index % 2 === 0 ? 1 : -1;
      const turn = direction * (seconds * (1 + index * 0.5) + fall * fall * 9);
      const squash = 0.45 + 0.55 * Math.abs(Math.cos(this.tilt + index * 0.9 + seconds * 1.4));
      const skew = this.tilt + index * 0.7 + seconds * 0.6;
      const points: IArenaPoint2[] = [];
      for (let corner = 0; corner < sides; corner += 1) {
        const a = turn + (corner * Math.PI * 2) / sides;
        const u = Math.cos(a) * radius;
        const v = Math.sin(a) * radius * squash;
        points.push({
          x: u * Math.cos(skew) - v * Math.sin(skew),
          y: u * Math.sin(skew) + v * Math.cos(skew),
        });
      }
      return { points, depth };
    });
    layers.forEach(({ points, depth }, index) => {
      const color = mixStops(
        [
          NON_EUCLIDEAN_COLORS.ice,
          NON_EUCLIDEAN_COLORS.cyan,
          NON_EUCLIDEAN_COLORS.blue,
          NON_EUCLIDEAN_COLORS.indigo,
        ],
        depth,
      );
      g.poly(points.flatMap((point) => [point.x, point.y])).stroke({
        width: width * (1.4 - depth * 0.5),
        color,
        alpha,
      });
      const next = layers[index + 1];
      if (!next) return;
      points.forEach((point, corner) => {
        const target = next.points[corner % next.points.length];
        if (!target) return;
        g.moveTo(point.x, point.y)
          .lineTo(target.x, target.y)
          .stroke({ width: width * 0.6, color: NON_EUCLIDEAN_COLORS.blue, alpha: alpha * 0.55 });
      });
      points.forEach((point) =>
        g.circle(point.x, point.y, width * 1.5).fill({ color: NON_EUCLIDEAN_COLORS.white, alpha }),
      );
    });
  }

  /** The collapse: a blinding flash at the point and a ring of light racing out, double-edged. */
  private drawBurst(t: number, r: number, scale: number): void {
    const g = this.burst.clear();
    const since = (t - NON_EUCLIDEAN_COLLAPSE) * NON_EUCLIDEAN_DURATION_MS;
    if (since < 0) return;
    const flash = 1 - since / 200;
    if (flash > 0)
      g.circle(0, 0, r * 1.5 * (1.3 - flash * 0.3)).fill({
        color: mixColor(NON_EUCLIDEAN_COLORS.cyan, NON_EUCLIDEAN_COLORS.white, flash),
        alpha: 0.9 * flash,
      });
    const life = since / 460;
    if (life >= 1) return;
    const radius = r * (0.3 + 3.2 * (1 - (1 - life) ** 3));
    g.circle(0, 0, radius).stroke({
      width: Math.max(r * 0.3 * (1 - life), 1.5 / scale),
      color: NON_EUCLIDEAN_COLORS.blue,
      alpha: 0.55 * (1 - life),
    });
    g.circle(0, 0, radius * 0.94).stroke({
      width: Math.max(r * 0.07 * (1 - life), 1 / scale),
      color: NON_EUCLIDEAN_COLORS.white,
      alpha: 0.95 * (1 - life),
    });
  }

  private plan(host: IArenaFxHost, r: number, random: () => number): void {
    const frames = host.textures;
    const glyph = () => {
      const pool = random() < NON_EUCLIDEAN_DIGIT_SHARE ? frames.digits : frames.glyphs;
      return pool[Math.floor(random() * pool.length)] ?? frames.spark;
    };
    const seconds = NON_EUCLIDEAN_DURATION_MS / 1000;
    const collapse = NON_EUCLIDEAN_COLLAPSE * seconds;
    const still = { vx: 0, vy: 0, drag: 0, gravity: 0 };
    this.light.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: 0, life: collapse },
      look: {
        size: (life) => r * (3 - 2 * life),
        alpha: (life) => 0.45 * Math.min(life * 5, 1),
        tint: (life) => mixColor(NON_EUCLIDEAN_COLORS.blue, NON_EUCLIDEAN_COLORS.indigo, life),
      },
    });
    for (let index = 0; index < NON_EUCLIDEAN_DIGIT_RING; index += 1) {
      const digit = frames.digits[Math.floor(random() * frames.digits.length)] ?? frames.spark;
      const angle = (index / NON_EUCLIDEAN_DIGIT_RING) * Math.PI * 2;
      const size = r * (0.22 + random() * 0.1);
      this.glyphs.add({
        texture: digit,
        spawn: { x: 0, y: 0, ...still, born: 0.05, life: collapse - 0.05 },
        look: {
          size: (l) => size * (1 - l * 0.7),
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.85, 1)),
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, 0.1 + l * 0.6),
          drift: (age) => {
            const k = Math.min(age / (collapse - 0.05), 1);
            const radius = r * 2.9 * (1 - k ** 1.8);
            const a = angle - age * 2.2 - k * k * 6;
            return { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.6 };
          },
        },
      });
    }
    for (let index = 0; index < NON_EUCLIDEAN_SPIRAL_GLYPHS; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * (1.8 + random() * 1.2);
      const born = random() * collapse * 0.55;
      const life = collapse - born;
      const turns = (random() > 0.5 ? 1 : -1) * (5 + random() * 4);
      const size = r * (0.26 + random() * 0.16);
      this.glyphs.add({
        texture: glyph(),
        spawn: { x: 0, y: 0, ...still, born, life },
        look: {
          size: (l) => size * (1 - l * 0.85),
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.9, 1)),
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, l),
          rotation: (age) => age * turns,
          drift: (age) => {
            const k = Math.min(age / life, 1);
            const radius = from * (1 - k) ** 1.5;
            const a = angle + turns * k;
            return { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.75 };
          },
        },
      });
    }
    this.light.add({
      texture: frames.glow,
      spawn: { x: 0, y: 0, ...still, born: collapse, life: 0.4 },
      look: {
        size: (life) => r * (5.5 - 2.5 * life),
        alpha: (life) => (1 - life) ** 2,
        tint: (life) => mixColor(NON_EUCLIDEAN_COLORS.white, NON_EUCLIDEAN_COLORS.blue, life),
      },
    });
    for (let index = 0; index < NON_EUCLIDEAN_BURST_SPARKS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (6 + random() * 9);
      const length = r * (0.4 + random() * 0.4);
      this.light.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 4,
          gravity: 0,
          born: collapse,
          life: 0.3 + random() * 0.25,
        },
        look: {
          size: (l) => length * (1 - l * 0.5),
          height: () => r * 0.06,
          alpha: (l) => 1 - l,
          tint: (l) => mixColor(NON_EUCLIDEAN_COLORS.white, NON_EUCLIDEAN_COLORS.cyan, l),
          rotation: (_age, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    for (let index = 0; index < NON_EUCLIDEAN_BURST_GLYPHS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (3 + random() * 5);
      const size = r * (0.3 + random() * 0.2);
      const spin = (random() - 0.5) * 8;
      this.glyphs.add({
        texture: glyph(),
        spawn: {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 3,
          gravity: 0,
          born: collapse + 0.01,
          life: 0.55 + random() * 0.3,
        },
        look: {
          size: (l) => size * (1 + l * 0.4),
          alpha: (l) => 1 - l,
          tint: (l) => mixStops(GEOMETRY_GLYPH_STOPS, l),
          rotation: (age) => age * spin,
        },
      });
    }
  }
}
