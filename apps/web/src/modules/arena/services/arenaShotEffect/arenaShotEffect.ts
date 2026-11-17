import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  bladeOutline,
  easeOutBack,
  mixColor,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  SHOT_BLAST,
  SHOT_COLORS,
  SHOT_DRAW,
  SHOT_DURATION_MS,
  SHOT_EMBERS,
  SHOT_FIRE,
  SHOT_HOLSTER,
  SHOT_MUZZLE_SPARKS,
  SHOT_SMOKE_PUFFS,
  SHOT_TRAVEL_MS,
} from "./arenaShotEffect.constants";
import type { IArenaShotOptions } from "./arenaShotEffect.types";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * The shooter's part of "Magia completamente normal mágica", just a gunshot, a brutal one: the token pulls out
 * an actual pistol (it pops in and swings to aim at the target), holds the aim while the hammer goes back, and
 * fires with a huge blast of fire and smoke, the board shaking, a heavy recoil that throws the token back, a hot
 * tracer tearing to the target with a shock trail (its impact starts when it arrives) and a casing flying out;
 * then the smoking gun is put away. The effect cancels the token's own motion, so the blast and the tracer stay
 * where the shot happened; only the gun follows the token.
 */
export class ArenaShotEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.4,
    brightness: 1.05,
    blur: 6,
    quality: 4,
  });
  private readonly back: ArenaFxParticles;
  private readonly tracer = new Graphics();
  private readonly casing = new Graphics();
  private readonly gun = new Container();
  private readonly gunBody = new Graphics();
  private readonly hammer = new Graphics();
  private readonly flash = new Graphics();
  private readonly light: ArenaFxParticles;
  private readonly direction: IArenaPoint2;
  private readonly aim: number;
  private readonly flip: number;
  private readonly hold: IArenaPoint2;
  private readonly barrel: number;
  private readonly muzzle: IArenaPoint2;
  private readonly impact: IArenaPoint2;
  private rippled = false;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaShotOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    this.direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    this.aim = Math.atan2(this.direction.y, this.direction.x);
    this.flip = this.direction.x >= 0 ? 1 : -1;
    this.hold = { x: this.direction.x * r * 0.92, y: this.direction.y * r * 0.92 + r * 0.12 };
    this.barrel = r * 1.05;
    this.muzzle = {
      x: this.hold.x + this.direction.x * this.barrel,
      y: this.hold.y + this.direction.y * this.barrel,
    };
    const stop = Math.max(distance - options.targetRadius * 0.6, r * 2.4);
    this.impact = { x: this.direction.x * stop, y: this.direction.y * stop };
    const reach = distance + r * 5;
    this.back = new ArenaFxParticles(reach, "normal");
    this.light = new ArenaFxParticles(reach, "add");
    this.bloom.resolution = 1;
    this.tracer.blendMode = "add";
    this.flash.blendMode = "add";
    this.drawGun(r);
    this.gun.addChild(this.hammer, this.gunBody);
    this.gun.visible = false;
    this.container.eventMode = "none";
    this.container.addChild(
      this.back.container,
      this.casing,
      this.gun,
      this.tracer,
      this.flash,
      this.light.container,
    );
    this.container.filters = [this.bloom];
    this.plan(host, r);
  }

  /** The recoil is the token offset this frame; `done` once the gun is away and the smoke is gone. */
  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / SHOT_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    const since = (elapsed - SHOT_DURATION_MS * SHOT_FIRE) / 1000;
    if (!this.rippled && since >= 0) {
      this.rippled = true;
      this.host.shockwave(this.container, r * scale * SHOT_BLAST.radii, SHOT_BLAST.durationMs, {
        amplitude: SHOT_BLAST.amplitude,
        wavelength: SHOT_BLAST.wavelength,
      });
    }
    const frame = this.recoil(since, r);
    this.placeGun(t, since, frame, r);
    this.drawFlash(since, r);
    this.drawTracer(since, r, scale);
    this.drawCasing(since, r);
    this.back.update(elapsed / 1000);
    this.light.update(elapsed / 1000);
    this.container.scale.set(1 / frame.scaleX, 1 / frame.scaleY);
    this.container.position.set(-frame.dx / frame.scaleX, -frame.dy / frame.scaleY);
    return { done: false, frame };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** Braced while aiming, then one heavy kick straight back and a slow, steady return (no bounce). */
  private recoil(since: number, r: number): IArenaEffectFrame {
    if (since < 0) {
      const brace = phase(since, -0.15, 0);
      return { dx: 0, dy: 0, scaleX: 1 - 0.04 * brace, scaleY: 1 + 0.04 * brace };
    }
    const kick = -r * 0.65 * (1 - Math.exp(-since * 70)) * Math.exp(-since * 4);
    const squash = 0.14 * Math.exp(-since * 10);
    return {
      dx: this.direction.x * kick,
      dy: this.direction.y * kick,
      scaleX: 1 - squash * 0.5,
      scaleY: 1 + squash * 0.3,
    };
  }

  /**
   * The gun: pops in spinning from the token and swings to aim, holds still (the hammer cocks back), kicks up on
   * the shot, settles smoking and is put away with a twirl. Held by the token, so it follows the recoil.
   */
  private placeGun(t: number, since: number, frame: IArenaEffectFrame, r: number): void {
    const draw = phase(t, 0, SHOT_DRAW);
    const away = phase(t, SHOT_HOLSTER, 1);
    if (draw <= 0 || away >= 1) {
      this.gun.visible = false;
      return;
    }
    this.gun.visible = true;
    const pop = easeOutBack(draw) * (1 - away * away);
    const swing = (1 - easeOutBack(Math.min(draw * 1.15, 1))) * -1.8 * this.flip;
    const kick =
      since >= 0 ? -0.8 * this.flip * Math.exp(-since * 8) * (1 - Math.exp(-since * 80)) : 0;
    const twirl = away * Math.PI * 2 * this.flip;
    this.gun.rotation = this.aim + swing + kick + twirl;
    this.gun.scale.set(pop, pop * this.flip);
    const pull = since >= 0 ? Math.exp(-since * 8) * (1 - Math.exp(-since * 80)) : 0;
    const back = this.barrel * 0.3 * pull;
    this.gun.position.set(
      this.hold.x * pop + frame.dx - this.direction.x * back,
      this.hold.y * pop + frame.dy - this.direction.y * back,
    );
    this.gun.alpha = 1 - away;
    const cocked = since < 0 ? phase(t, SHOT_DRAW, SHOT_DRAW + 0.08) : 0;
    this.hammer.rotation = -0.9 * cocked;
    this.hammer.position.set(-this.barrel * 0.06, -r * 0.1);
  }

  /** A heavy pistol drawn along +x (barrel forward): dark steel slide and barrel, wooden grip, trigger. */
  private drawGun(r: number): void {
    const g = this.gunBody;
    const length = this.barrel;
    const height = r * 0.26;
    const edge = { width: r * 0.035, color: SHOT_COLORS.steelEdge };
    g.roundRect(-length * 0.08, -height * 0.55, length * 1.02, height * 0.9, height * 0.15)
      .fill({ color: SHOT_COLORS.steel })
      .stroke(edge);
    g.rect(length * 0.05, -height * 0.5, length * 0.85, height * 0.18).fill({
      color: SHOT_COLORS.steelLight,
    });
    for (let index = 0; index < 5; index += 1)
      g.rect(
        -length * 0.02 + index * length * 0.035,
        -height * 0.4,
        length * 0.012,
        height * 0.5,
      ).fill({
        color: SHOT_COLORS.steelEdge,
      });
    g.rect(length * 0.9, -height * 0.42, length * 0.14, height * 0.6)
      .fill({ color: SHOT_COLORS.steelEdge })
      .stroke(edge);
    g.poly([
      -length * 0.06,
      height * 0.3,
      length * 0.22,
      height * 0.3,
      length * 0.08,
      height * 1.7,
      -length * 0.24,
      height * 1.6,
    ])
      .fill({ color: SHOT_COLORS.grip })
      .stroke(edge);
    g.poly([0, height * 0.6, length * 0.14, height * 0.6, length * 0.03, height * 1.4]).fill({
      color: SHOT_COLORS.gripLight,
      alpha: 0.6,
    });
    g.circle(length * 0.32, height * 0.62, height * 0.42).stroke({
      width: r * 0.035,
      color: SHOT_COLORS.steel,
    });
    g.rect(length * 0.3, height * 0.34, length * 0.04, height * 0.5).fill({
      color: SHOT_COLORS.brass,
    });
    this.hammer
      .rect(-length * 0.04, -height * 0.5, length * 0.08, height * 0.5)
      .fill({ color: SHOT_COLORS.steelEdge });
  }

  /**
   * The blast: a ball of fire bursting forward with long white-hot spikes and a short fan to the sides, gone in
   * ~180 ms.
   */
  private drawFlash(since: number, r: number): void {
    const g = this.flash.clear();
    if (since < 0 || since > 0.18) return;
    const fade = 1 - since / 0.18;
    const grow = 0.5 + 0.5 * Math.min(since / 0.025, 1);
    const spikes = [
      { a: 0, len: 3.4, w: 0.6 },
      { a: 0.25, len: 1.6, w: 0.35 },
      { a: -0.25, len: 1.6, w: 0.35 },
      { a: 0.6, len: 0.9, w: 0.25 },
      { a: -0.6, len: 0.9, w: 0.25 },
    ];
    for (const spike of spikes) {
      const a = this.aim + spike.a;
      const tip = {
        x: this.muzzle.x + Math.cos(a) * r * spike.len * grow,
        y: this.muzzle.y + Math.sin(a) * r * spike.len * grow,
      };
      g.poly(bladeOutline(this.muzzle, tip, 0, r * spike.w * grow, 0, 1, 6)).fill({
        color: mixColor(SHOT_COLORS.fire, SHOT_COLORS.gold, fade),
        alpha: 0.85 * fade,
      });
      g.poly(bladeOutline(this.muzzle, tip, 0, r * spike.w * 0.35 * grow, 0, 0.9, 6)).fill({
        color: SHOT_COLORS.core,
        alpha: fade,
      });
    }
    const ball = {
      x: this.muzzle.x + this.direction.x * r * 0.5 * grow,
      y: this.muzzle.y + this.direction.y * r * 0.5 * grow,
    };
    g.circle(ball.x, ball.y, r * 0.75 * grow).fill({ color: SHOT_COLORS.fire, alpha: 0.6 * fade });
    g.circle(this.muzzle.x, this.muzzle.y, r * 0.5 * grow).fill({
      color: SHOT_COLORS.core,
      alpha: fade,
    });
  }

  /**
   * The tracer: a thick hot streak that crosses to the target in a blink and lingers a moment as a burning
   * line that thins and dims, white core in an amber sheath.
   */
  private drawTracer(since: number, r: number, scale: number): void {
    const g = this.tracer.clear();
    if (since < 0) return;
    const ms = since * 1000;
    const head = Math.min(ms / SHOT_TRAVEL_MS, 1);
    const fade = 1 - phase(ms, SHOT_TRAVEL_MS, SHOT_TRAVEL_MS + 320);
    if (fade <= 0) return;
    const to = {
      x: this.muzzle.x + (this.impact.x - this.muzzle.x) * head,
      y: this.muzzle.y + (this.impact.y - this.muzzle.y) * head,
    };
    const thick = Math.max(r * 0.26 * fade, 2 / scale);
    g.poly(bladeOutline(this.muzzle, to, 0, thick * 2.4, 0, 1, 4)).fill({
      color: SHOT_COLORS.amber,
      alpha: 0.25 * fade,
    });
    g.poly(bladeOutline(this.muzzle, to, 0, thick, 0, 1, 4)).fill({
      color: SHOT_COLORS.gold,
      alpha: 0.8 * fade,
    });
    g.poly(bladeOutline(this.muzzle, to, 0, thick * 0.35, 0, 1, 4)).fill({
      color: SHOT_COLORS.core,
      alpha: fade,
    });
    if (head < 1) g.circle(to.x, to.y, thick * 0.9).fill({ color: SHOT_COLORS.core });
  }

  /** One fat casing thrown out of the gun, spinning, hitting the floor once and fading. */
  private drawCasing(since: number, r: number): void {
    const g = this.casing.clear();
    const age = since - 0.03;
    if (age < 0) return;
    const life = age / 0.75;
    if (life >= 1) return;
    const side = { x: -this.direction.y * this.flip, y: this.direction.x * this.flip };
    const start = { x: this.hold.x - side.x * r * 0.2, y: this.hold.y - side.y * r * 0.2 };
    const x = start.x - side.x * r * 3 * age - this.direction.x * r * 1.2 * age;
    const floor = r * 0.7;
    let y = start.y - side.y * r * 3 * age - r * 5 * age + 0.5 * r * 30 * age * age;
    if (y > floor) y = floor - (y - floor) * 0.25;
    const spin = age * 30;
    const length = r * 0.24;
    const width = r * 0.1;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    const corner = (u: number, v: number) => [x + u * cos - v * sin, y + u * sin + v * cos];
    g.poly([
      ...corner(-length / 2, -width / 2),
      ...corner(length / 2, -width / 2),
      ...corner(length / 2, width / 2),
      ...corner(-length / 2, width / 2),
    ]).fill({ color: SHOT_COLORS.brass, alpha: 1 - phase(life, 0.7, 1) });
  }

  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const frames = host.textures;
    const fire = (SHOT_DURATION_MS * SHOT_FIRE) / 1000;
    this.light.add({
      texture: frames.glow,
      spawn: { ...this.muzzle, vx: 0, vy: 0, drag: 0, gravity: 0, born: fire, life: 0.32 },
      look: {
        size: (life) => r * (5.5 - life * 2),
        alpha: (life) => (1 - life) ** 2,
        tint: (life) => mixColor(SHOT_COLORS.flash, SHOT_COLORS.fire, life),
      },
    });
    for (let index = 0; index < SHOT_MUZZLE_SPARKS; index += 1) {
      const a = this.aim + (random() - 0.5) * 1.1;
      const speed = r * (7 + random() * 10);
      const length = r * (0.45 + random() * 0.45);
      this.light.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          ...this.muzzle,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          drag: 4,
          gravity: r * 4,
          born: fire + random() * 0.03,
          life: 0.2 + random() * 0.25,
        },
        look: {
          size: (life) => length * (1 - life * 0.6),
          height: () => r * 0.07,
          alpha: (life) => 1 - life,
          tint: (life) => mixColor(SHOT_COLORS.core, SHOT_COLORS.fire, life),
          rotation: (_age, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    for (let index = 0; index < SHOT_EMBERS; index += 1) {
      const a = this.aim + (random() - 0.5) * 1.6;
      const speed = r * (2 + random() * 4);
      const size = r * (0.05 + random() * 0.06);
      this.light.add({
        texture: frames.spark,
        spawn: {
          ...this.muzzle,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - r,
          drag: 2.5,
          gravity: r * 3,
          born: fire + 0.01,
          life: 0.5 + random() * 0.4,
        },
        look: {
          size: () => size,
          alpha: (life) => (1 - life) * (0.6 + 0.4 * Math.sin(life * 40)),
          tint: (life) => mixColor(SHOT_COLORS.gold, SHOT_COLORS.fire, life),
        },
      });
    }
    const span = Math.hypot(this.impact.x - this.muzzle.x, this.impact.y - this.muzzle.y);
    for (let index = 0; index < 14; index += 1) {
      const along = (index + random() * 0.5) / 14;
      const point = {
        x: this.muzzle.x + this.direction.x * span * along,
        y: this.muzzle.y + this.direction.y * span * along,
      };
      const size = r * (0.25 + random() * 0.2);
      this.back.add({
        texture: frames.smoke,
        spawn: {
          ...point,
          vx: (random() - 0.5) * r * 0.6,
          vy: -r * (0.3 + random() * 0.4),
          drag: 1.5,
          gravity: 0,
          born: fire + (SHOT_TRAVEL_MS / 1000) * along,
          life: 0.5 + random() * 0.3,
        },
        look: {
          size: (life) => size + r * 0.5 * life,
          alpha: (life) => 0.35 * (1 - life) * Math.min(life * 8, 1),
          tint: () => SHOT_COLORS.smoke,
        },
      });
    }
    for (let index = 0; index < SHOT_SMOKE_PUFFS; index += 1) {
      const a = this.aim + (random() - 0.5) * 1.5;
      const speed = r * (1.2 + random() * 2.4);
      const sway = random() * 6;
      const base = r * (0.4 + random() * 0.35);
      this.back.add({
        texture: frames.smoke,
        spawn: {
          ...this.muzzle,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - r * 0.6,
          drag: 2,
          gravity: -r * 1.1,
          born: fire + 0.02 + index * 0.018,
          life: 0.75 + random() * 0.35,
        },
        look: {
          size: (life) => base + r * 1.9 * life,
          alpha: (life) => 0.6 * (1 - life) * Math.min(life * 6, 1),
          tint: () => SHOT_COLORS.smoke,
          drift: (age) => ({ x: Math.sin(age * 6 + sway) * r * 0.12, y: 0 }),
        },
      });
    }
  }
}
