import { Container, Graphics, Particle, ParticleContainer, Rectangle } from "pixi.js";

import {
  bladeOutline,
  mixColor,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  LUNGE_COLORS,
  LUNGE_DURATION_MS,
  LUNGE_GHOSTS,
  LUNGE_PHASES,
  LUNGE_STREAKS,
  LUNGE_TRAIL_LENGTH,
} from "./arenaLungeEffect.constants";
import type { IArenaLungeOptions } from "./arenaLungeEffect.types";
import { lungeDistance, lungeReach } from "./arenaLungeEffect.utils";

const FRAME = 64;

interface IStreak {
  particle: Particle;
  along: number;
  side: number;
  born: number;
  life: number;
  length: number;
}

/**
 * The attacker's part of an attack: the token winds up, dashes to the target leaving a ruby trail with white
 * core, afterimages and speed lines, hits (the target animation starts at that moment) and slides back home.
 * Everything is drawn in the attacker's own coordinates, so the trail stays put on the map while the token
 * moves.
 */
export class ArenaLungeEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly trail = new Graphics();
  private readonly streaks = new ParticleContainer({
    dynamicProperties: { position: true, rotation: true, vertex: true, color: true },
  });
  private readonly lines: IStreak[] = [];
  private readonly history: IArenaPoint2[] = [];
  private readonly direction: IArenaPoint2;
  private readonly reach: number;
  private readonly pullBack: number;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaLungeOptions,
    host: IArenaFxHost,
  ) {
    const radius = options.size / 2;
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    this.direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    this.reach = lungeReach(options.toward, radius, options.targetRadius);
    this.pullBack = Math.min(this.reach * 0.18, radius * 0.7);
    this.container.eventMode = "none";
    this.trail.blendMode = "add";
    this.streaks.blendMode = "add";
    const extent = this.reach + radius * 3;
    this.streaks.boundsArea = new Rectangle(-extent, -extent, extent * 2, extent * 2);
    this.container.addChild(this.trail, this.streaks);
    const random = seededRandom(options.seed);
    for (let index = 0; index < LUNGE_STREAKS; index += 1) {
      const particle = new Particle({
        texture: host.textures.streak,
        anchorX: 1,
        anchorY: 0.5,
        tint: LUNGE_COLORS.white,
        alpha: 0,
      });
      this.streaks.addParticle(particle);
      this.lines.push({
        particle,
        along: random(),
        side: (random() - 0.5) * 2,
        born: LUNGE_PHASES.windup + random() * (LUNGE_PHASES.hit - LUNGE_PHASES.windup) * 0.9,
        life: 0.16 + random() * 0.12,
        length: radius * (0.8 + random() * 0.9),
      });
    }
  }

  /** The token offset this frame is the lunge itself; `done` once it is home. */
  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const t = Math.min((now - this.start) / LUNGE_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 } };
    const along = lungeDistance(t, this.reach, this.pullBack);
    const offset = { x: this.direction.x * along, y: this.direction.y * along };
    this.history.unshift(offset);
    if (this.history.length > LUNGE_TRAIL_LENGTH) this.history.pop();
    this.drawTrail(t, offset, cameraScale > 0 ? cameraScale : 1);
    this.moveStreaks(t);
    const windup = phase(t, 0, LUNGE_PHASES.windup);
    const impact = phase(t, LUNGE_PHASES.hit, LUNGE_PHASES.hold);
    const grow = t < LUNGE_PHASES.windup ? 0.06 * windup : t < LUNGE_PHASES.hit ? 0.06 : 0;
    const squash = impact > 0 && impact < 1 ? 0.08 * (1 - impact) : 0;
    return {
      done: false,
      frame: { dx: offset.x, dy: offset.y, scaleX: 1 + grow + squash, scaleY: 1 + grow - squash },
    };
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private drawTrail(t: number, offset: IArenaPoint2, scale: number): void {
    const g = this.trail.clear();
    const radius = this.options.size / 2;
    const dashing = t >= LUNGE_PHASES.windup && t < LUNGE_PHASES.hold;
    const fade = dashing ? 1 : 1 - phase(t, LUNGE_PHASES.hold, LUNGE_PHASES.hold + 0.2);
    if (fade <= 0) return;
    const local = this.history.map((point) => ({ x: point.x - offset.x, y: point.y - offset.y }));
    const tail = local.at(-1);
    const head = local[0];
    if (!tail || !head || Math.hypot(head.x - tail.x, head.y - tail.y) < radius * 0.3) return;
    const width = Math.max(radius * 1.5, 6 / scale);
    const beyond = { x: head.x * 2 - tail.x, y: head.y * 2 - tail.y };
    g.poly(bladeOutline(tail, beyond, 0, width, 0, 0.5)).fill({
      color: LUNGE_COLORS.ruby,
      alpha: 0.45 * fade,
    });
    g.poly(bladeOutline(tail, beyond, 0, width * 0.35, 0, 0.5)).fill({
      color: LUNGE_COLORS.white,
      alpha: 0.6 * fade,
    });
    for (let index = 1; index <= LUNGE_GHOSTS; index += 1) {
      const point = local[Math.min(index * 3, local.length - 1)];
      if (!point) continue;
      const alpha = (0.5 - index * 0.1) * fade;
      g.circle(point.x, point.y, radius * (1 - index * 0.06)).stroke({
        width: Math.max(radius * 0.08, 1.5 / scale),
        color: mixColor(LUNGE_COLORS.rubyLight, LUNGE_COLORS.ruby, index / LUNGE_GHOSTS),
        alpha,
      });
    }
  }

  private moveStreaks(t: number): void {
    const radius = this.options.size / 2;
    const normal = { x: -this.direction.y, y: this.direction.x };
    const angle = Math.atan2(this.direction.y, this.direction.x);
    for (const line of this.lines) {
      const life = (t - line.born) / line.life;
      const { particle } = line;
      if (life < 0 || life >= 1) {
        particle.alpha = 0;
        continue;
      }
      const behind = radius * (0.6 + line.along * 1.6) + life * radius * 1.2;
      particle.x = -this.direction.x * behind + normal.x * line.side * radius * 0.8;
      particle.y = -this.direction.y * behind + normal.y * line.side * radius * 0.8;
      particle.rotation = angle;
      particle.scaleX = line.length / FRAME;
      particle.scaleY = (radius * 0.07) / FRAME;
      particle.tint = mixColor(LUNGE_COLORS.white, LUNGE_COLORS.rubyLight, life);
      particle.alpha = Math.sin(Math.PI * life) * 0.9;
    }
  }
}
