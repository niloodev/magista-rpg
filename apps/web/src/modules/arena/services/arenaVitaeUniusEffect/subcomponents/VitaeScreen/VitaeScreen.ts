import { ColorMatrixFilter, Container, Graphics, Sprite } from "pixi.js";

import { paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ARENA_FX_FADE_FROM,
  groupShape,
  mixColor,
  mixStops,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

import {
  VITAE_BEAMS,
  VITAE_BEAT_WIDTH,
  VITAE_BEATS,
  VITAE_COLORS,
  VITAE_DUB_GAP,
  VITAE_DURATION_MS,
  VITAE_FALLING_PETALS,
  VITAE_GROUP_GROWTH,
  VITAE_GROUP_MAX,
  VITAE_IDENTITY_MATRIX,
  VITAE_PHASES,
  VITAE_RAYS,
  VITAE_SCREEN_PETALS,
  VITAE_SOULS,
  VITAE_WARM_MATRIX,
} from "../../arenaVitaeUniusEffect.constants";
import type { IFlowerCircle, IVitaeScreen } from "../../arenaVitaeUniusEffect.types";
import { flowerOfLife, heartbeat } from "../../arenaVitaeUniusEffect.utils";

/** The Flower of Life lies on the ground around the target, seen at an angle. */
const FLOOR_TILT = 0.55;

/**
 * The screen part of "Vitae Unius": dawn (the world warms and shafts of light pour down on the target), the
 * Flower of Life traced circle by circle on the ground around it and flaring with every heartbeat, the lights
 * of everyone rising from the whole screen to the target (Vitae Populi), and at the bloom a white flash, rays
 * turning across the screen and a storm of petals, which keep falling slowly while the light fades.
 */
export class VitaeScreen implements IVitaeScreen {
  private readonly root = new Container();
  private readonly sun: Sprite;
  private readonly beams: Sprite[] = [];
  private readonly mandala = new Container();
  private readonly flower = new Graphics();
  private readonly rays = new Graphics();
  private readonly flash = new Graphics();
  private readonly souls: ArenaFxParticles;
  private readonly storm: ArenaFxParticles;
  private readonly warm = new ColorMatrixFilter();
  private readonly circles: IFlowerCircle[] = flowerOfLife(1);
  private planned = false;
  private grow = 1;
  private middle: IArenaPoint2 = HERE;
  private size = 1;
  private field: IArenaFxField = { x: 0, y: 0, width: 1, height: 1, diagonal: 1 };
  private traced = -1;
  private ended = false;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly random: () => number,
    private readonly group?: IArenaPoint2[],
  ) {
    const { width, height } = host.screen.size();
    const diagonal = Math.hypot(width, height);
    this.souls = new ArenaFxParticles(diagonal, "add");
    this.storm = new ArenaFxParticles(diagonal, "add");
    for (let index = 0; index < VITAE_BEAMS; index += 1) {
      const beam = new Sprite(host.textures.beam);
      beam.anchor.set(0.5, 0);
      beam.tint = index % 2 === 0 ? VITAE_COLORS.mint : VITAE_COLORS.leaf;
      beam.blendMode = "add";
      beam.visible = false;
      this.beams.push(beam);
    }
    this.sun = new Sprite(host.textures.glow);
    this.sun.anchor.set(0.5);
    this.sun.tint = VITAE_COLORS.leaf;
    this.sun.blendMode = "add";
    this.flower.blendMode = "add";
    this.rays.blendMode = "add";
    this.flash.blendMode = "add";
    this.mandala.addChild(this.flower);
    this.root.addChild(
      ...this.beams,
      this.sun,
      this.mandala,
      this.souls.container,
      this.rays,
      this.storm.container,
      this.flash,
    );
    host.screen.layer.addChild(this.root);
  }

  step(t: number, origin: Container, r: number): void {
    this.host.screen.fitWorldFilters();
    const anchor = this.host.screen.toScreen(origin);
    if (!this.planned) {
      this.planned = true;
      this.host.screen.addWorldFilter(this.warm);
      this.size = r;
      const shape = groupShape(this.group);
      this.grow = Math.min(Math.max(shape.spread * VITAE_GROUP_GROWTH, 1), VITAE_GROUP_MAX);
      this.middle = { x: shape.center.x * r, y: shape.center.y * r };
      const field = this.host.screen.field();
      this.field = { ...field, x: field.x - anchor.x, y: field.y - anchor.y };
      this.plan(this.middle, this.field, r * this.grow);
    }
    this.root.position.set(anchor.x, anchor.y);
    this.root.scale.set(r / this.size);
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const center = this.middle;
    const size = this.size * this.grow;
    const dawn = phase(t, 0, VITAE_PHASES.dawn) * (1 - phase(t, VITAE_PHASES.settle + 0.06, 1));
    const flash =
      t >= VITAE_PHASES.bloom ? 1 - phase(t, VITAE_PHASES.bloom, VITAE_PHASES.bloom + 0.06) : 0;
    const beat = heartbeat(t, VITAE_BEATS, VITAE_DUB_GAP, VITAE_BEAT_WIDTH);
    const strength = Math.min(0.85 * dawn + 0.5 * flash, 1.3);
    this.warm.matrix = VITAE_IDENTITY_MATRIX.map(
      (value, index) => value + ((VITAE_WARM_MATRIX[index] ?? 0) - value) * strength,
    ) as ColorMatrixFilter["matrix"];
    this.drawLight(t, dawn, center, this.field, size);
    this.placeFlower(t, beat, center, size);
    this.placeRays(t, center);
    this.flash.alpha = 0.6 * flash;
    const seconds = (t * VITAE_DURATION_MS) / 1000;
    this.souls.update(seconds);
    this.storm.update(seconds);
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.host.screen.removeWorldFilter(this.warm);
    this.warm.destroy();
    this.root.destroy({ children: true });
  }

  /**
   * Dawn: soft beams of light pour from above the screen onto the target like spotlights (a painted beam,
   * narrow at the top, fading at both ends), swaying a little, with a sun glowing on it that breathes with the
   * heart.
   */
  private drawLight(
    t: number,
    dawn: number,
    center: IArenaPoint2,
    field: IArenaFxField,
    r: number,
  ): void {
    this.sun.visible = dawn > 0;
    for (const beam of this.beams) beam.visible = dawn > 0;
    if (dawn <= 0) return;
    const seconds = (t * VITAE_DURATION_MS) / 1000;
    this.beams.forEach((beam, index) => {
      const share = index / (this.beams.length - 1) - 0.5;
      const sway = Math.sin(seconds * 0.9 + index * 1.7) * field.width * 0.03;
      const top = {
        x: center.x + share * field.width * 0.6 + sway,
        y: field.y - field.height * 0.08,
      };
      const toward = { x: center.x - top.x, y: center.y - top.y };
      const length = Math.hypot(toward.x, toward.y) + r * 1.2;
      beam.position.set(top.x, top.y);
      beam.rotation = Math.atan2(toward.y, toward.x) - Math.PI / 2;
      beam.height = length;
      beam.width = r * (2.6 + 0.8 * (index % 3));
      beam.alpha = (0.2 + 0.06 * Math.sin(seconds * 1.6 + index * 2.1)) * dawn;
    });
    const pulse = heartbeat(t, VITAE_BEATS, VITAE_DUB_GAP, VITAE_BEAT_WIDTH);
    this.sun.position.set(center.x, center.y);
    this.sun.width = this.sun.height = r * (7 + 2 * pulse);
    this.sun.alpha = 0.35 * dawn + 0.3 * pulse;
  }

  /**
   * The Flower of Life on the ground: traced circle by circle from the center out while the heart beats
   * (redrawn only while tracing), flaring with each beat, then folding, spinning, into the target.
   */
  private placeFlower(t: number, beat: number, center: IArenaPoint2, r: number): void {
    const visible = t >= VITAE_PHASES.weave - 0.02 && t < VITAE_PHASES.bloom;
    this.mandala.visible = visible;
    if (!visible) return;
    const radius = r * 1.15;
    const trace = phase(t, VITAE_PHASES.weave, VITAE_PHASES.fold - 0.04);
    if (Math.abs(trace - this.traced) > 0.004 || (trace >= 1 && this.traced < 1)) {
      this.traced = trace;
      this.drawFlower(trace);
    }
    const fold = phase(t, VITAE_PHASES.fold, VITAE_PHASES.bloom);
    const shrink = 1 - fold ** 2 * 0.92;
    this.mandala.position.set(center.x, center.y);
    this.mandala.scale.set(
      radius * shrink,
      radius * shrink * (FLOOR_TILT + fold * (1 - FLOOR_TILT)),
    );
    const seconds = (t * VITAE_DURATION_MS) / 1000;
    this.mandala.rotation = 0;
    this.flower.rotation = seconds * 0.25 + fold ** 2 * Math.PI * 3;
    this.mandala.alpha = Math.min(0.75 + 0.5 * beat + 0.4 * fold, 1);
  }

  /** Strokes the flower at unit size: each circle traced from its own start, the outer circle closing last. */
  private drawFlower(trace: number): void {
    const g = this.flower.clear();
    const count = this.circles.length;
    this.circles.forEach((circle, index) => {
      const start = (circle.ring * 0.3 + (index / count) * 0.25) * 0.85;
      const shown = phase(trace, start, start + 0.32);
      if (shown <= 0) return;
      const end = circle.startAngle + shown * Math.PI * 2;
      g.moveTo(
        circle.center.x + Math.cos(circle.startAngle),
        circle.center.y + Math.sin(circle.startAngle),
      );
      g.arc(circle.center.x, circle.center.y, 1, circle.startAngle, end).stroke({
        width: 0.09,
        color: VITAE_COLORS.emerald,
        alpha: 0.35,
      });
      g.moveTo(
        circle.center.x + Math.cos(circle.startAngle),
        circle.center.y + Math.sin(circle.startAngle),
      );
      g.arc(circle.center.x, circle.center.y, 1, circle.startAngle, end).stroke({
        width: 0.028,
        color: mixColor(VITAE_COLORS.mint, VITAE_COLORS.spring, circle.ring / 2),
        alpha: 0.95,
      });
    });
    const outer = phase(trace, 0.82, 1);
    if (outer > 0) {
      const start = -Math.PI / 2;
      g.moveTo(Math.cos(start) * 3, Math.sin(start) * 3);
      g.arc(0, 0, 3, start, start + outer * Math.PI * 2).stroke({
        width: 0.05,
        color: VITAE_COLORS.spring,
        alpha: 0.9,
      });
      g.moveTo(Math.cos(start) * 3.12, Math.sin(start) * 3.12);
      g.arc(0, 0, 3.12, start, start - outer * Math.PI * 2, true).stroke({
        width: 0.02,
        color: VITAE_COLORS.emerald,
        alpha: 0.8,
      });
    }
  }

  /** Rays of light turning around the target across the screen at the bloom (drawn once, turned and faded). */
  private placeRays(t: number, center: IArenaPoint2): void {
    const shown = phase(t, VITAE_PHASES.bloom, VITAE_PHASES.bloom + 0.03);
    const fade = 1 - phase(t, VITAE_PHASES.settle - 0.04, 0.95);
    this.rays.visible = shown > 0 && fade > 0;
    if (!this.rays.visible) return;
    this.rays.position.set(center.x, center.y);
    this.rays.rotation = t * 1.6;
    this.rays.alpha = shown * fade;
    this.rays.scale.set(0.6 + 0.4 * shown);
  }

  /**
   * Plans what does not move with the target: the rays and the flash (drawn once), the lights of everyone
   * rising from the edges and the bottom of the screen to the target while the flower is woven, the storm of
   * petals blown out from the target across the screen at the bloom and the petals falling after.
   */
  private plan(center: IArenaPoint2, field: IArenaFxField, r: number): void {
    const random = this.random;
    const frames = this.host.textures;
    const seconds = VITAE_DURATION_MS / 1000;
    const diagonal = field.diagonal;
    const { x: left, y: top, width, height } = field;
    for (let index = 0; index < VITAE_RAYS; index += 1) {
      const angle = (index / VITAE_RAYS) * Math.PI * 2;
      const spread = 0.035 + (index % 3) * 0.015;
      this.rays
        .poly([
          0,
          0,
          Math.cos(angle - spread) * diagonal,
          Math.sin(angle - spread) * diagonal,
          Math.cos(angle + spread) * diagonal,
          Math.sin(angle + spread) * diagonal,
        ])
        .fill({ color: index % 2 === 0 ? VITAE_COLORS.mint : VITAE_COLORS.emerald, alpha: 0.16 });
    }
    paintGlow(this.flash, 0, 0, field.diagonal, VITAE_COLORS.mint);
    this.flash.alpha = 0;
    const from = VITAE_PHASES.weave * seconds;
    const to = (VITAE_PHASES.fold - 0.02) * seconds;
    for (let index = 0; index < VITAE_SOULS; index += 1) {
      const side = random();
      const start =
        side < 0.5
          ? { x: left + random() * width, y: top + height + r * 0.3 }
          : side < 0.75
            ? { x: left - r * 0.3, y: top + height * (0.3 + random() * 0.7) }
            : { x: left + width + r * 0.3, y: top + height * (0.3 + random() * 0.7) };
      const life = 0.9 + random() * 0.7;
      const born = from + random() * Math.max(to - from - life, 0.1);
      const size = r * (0.2 + random() * 0.26);
      const sway = random() * Math.PI * 2;
      const tone = random();
      const color =
        tone < 0.45
          ? VITAE_COLORS.emerald
          : tone < 0.75
            ? VITAE_COLORS.leaf
            : tone < 0.9
              ? VITAE_COLORS.spring
              : VITAE_COLORS.gold;
      this.souls.add({
        texture: frames.glow,
        spawn: {
          ...start,
          vx: (center.x - start.x) / life,
          vy: (center.y - start.y) / life,
          drag: 0,
          gravity: 0,
          born,
          life,
        },
        look: {
          size: (l) => size * (1 + l * 0.6),
          alpha: (l) => Math.min(l * 4, 1) * (1 - phase(l, 0.88, 1)),
          tint: (l) => mixColor(color, VITAE_COLORS.white, l * 0.6),
          drift: (age) => {
            const share = Math.min(age / life, 1);
            const wobble = Math.sin(age * 5 + sway) * r * 1.1 * (1 - share);
            return { x: wobble, y: -Math.sin(Math.PI * share) * r * 1.7 };
          },
        },
      });
    }
    const bloom = VITAE_PHASES.bloom * seconds;
    for (let index = 0; index < VITAE_SCREEN_PETALS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = diagonal * (0.35 + random() * 0.55);
      const size = r * (0.4 + random() * 0.6);
      const spin = (random() - 0.5) * 12;
      const sway = random() * Math.PI * 2;
      const tone = random();
      this.storm.add({
        texture: index % 5 === 0 ? frames.blossom : frames.petal,
        spawn: {
          x: center.x + Math.cos(angle) * r,
          y: center.y + Math.sin(angle) * r,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 1.6,
          gravity: r * 1.7,
          born: bloom + random() * 0.1,
          life: 1.3 + random() * 0.8,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.4 + 0.6 * Math.abs(Math.cos(l * 10 + sway))),
          alpha: (l) => Math.min(l * 12, 1) * (1 - phase(l, 0.7, 1)) * 0.9,
          tint: () =>
            tone < 0.5
              ? VITAE_COLORS.emerald
              : tone < 0.75
                ? VITAE_COLORS.leaf
                : tone < 0.9
                  ? VITAE_COLORS.spring
                  : VITAE_COLORS.blossom,
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 2.5 + sway) * r * 0.85, y: 0 }),
        },
      });
    }
    const settle = VITAE_PHASES.settle * seconds;
    for (let index = 0; index < VITAE_FALLING_PETALS; index += 1) {
      const size = r * (0.35 + random() * 0.45);
      const spin = (random() - 0.5) * 6;
      const sway = random() * Math.PI * 2;
      const life = 1.4 + random() * 0.8;
      this.storm.add({
        texture: index % 3 === 0 ? frames.blossom : frames.petal,
        spawn: {
          x: left + random() * width,
          y: top - r - random() * height * 0.2,
          vx: 0,
          vy: height * (0.25 + random() * 0.2),
          drag: 0,
          gravity: 0,
          born: settle - 0.4 + random() * 0.6,
          life,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.4 + 0.6 * Math.abs(Math.cos(l * 8 + sway))),
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.6, 1)) * 0.85,
          tint: (l) =>
            mixStops(
              [VITAE_COLORS.leaf, VITAE_COLORS.emerald, VITAE_COLORS.spring],
              (l + sway) % 1,
            ),
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 2 + sway) * r * 1.4, y: 0 }),
        },
      });
    }
  }
}
