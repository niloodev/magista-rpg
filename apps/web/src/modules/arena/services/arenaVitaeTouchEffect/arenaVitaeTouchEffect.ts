import { Container, Graphics, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  easeOutBack,
  mixColor,
  mixStops,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";
import {
  heartbeat,
  leafShape,
  pathPoint,
  VITAE_COLORS,
} from "@/modules/arena/services/arenaVitaeUniusEffect";

import {
  VITAE_ROOT_LEAVES,
  VITAE_ROOT_STEPS,
  VITAE_TOUCH_BEATS,
  VITAE_TOUCH_DURATION_MS,
  VITAE_TOUCH_HIT_MS,
  VITAE_TOUCH_LEAVES,
  VITAE_TOUCH_RAYS,
} from "./arenaVitaeTouchEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Tony's part of "Vitae Unius": his heart beats and a sun of green rays opens and turns around him, leaves rise
 * at his feet, and a root of living light grows from him along the ground to the target, sprouting leaves, with a
 * bright seed racing at its tip; when it arrives the spell blooms on the target and the root fades.
 */
export class ArenaVitaeTouchEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.28,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly aura: Sprite;
  private readonly sun = new Graphics();
  private readonly root = new Graphics();
  private readonly seed: Sprite;
  private readonly leaves: ArenaFxParticles;
  private readonly path: IArenaPoint2[] = [];
  private readonly rootLeaves: { at: number; side: 1 | -1 }[] = [];
  private grownKey = -1;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed * 5 + 3);
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    const direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    const normal = { x: -direction.y, y: direction.x };
    const from = r * 0.9;
    const to = Math.max(distance - options.targetRadius * 0.9, from + 1);
    const wave = random() * Math.PI * 2;
    for (let step = 0; step <= VITAE_ROOT_STEPS; step += 1) {
      const share = step / VITAE_ROOT_STEPS;
      const along = from + (to - from) * share;
      const bend = Math.sin(share * Math.PI * 3 + wave) * r * 0.35 * Math.sin(Math.PI * share);
      this.path.push({
        x: direction.x * along + normal.x * bend,
        y: direction.y * along + normal.y * bend,
      });
    }
    for (let index = 0; index < VITAE_ROOT_LEAVES; index += 1)
      this.rootLeaves.push({
        at: 0.12 + (index / VITAE_ROOT_LEAVES) * 0.8,
        side: index % 2 === 0 ? 1 : -1,
      });
    this.aura = new Sprite(host.textures.glow);
    this.aura.anchor.set(0.5);
    this.aura.tint = VITAE_COLORS.emerald;
    this.aura.blendMode = "add";
    this.seed = new Sprite(host.textures.glow);
    this.seed.anchor.set(0.5);
    this.seed.tint = VITAE_COLORS.mint;
    this.seed.blendMode = "add";
    this.leaves = new ArenaFxParticles(r * 4, "add");
    this.planLeaves(host, r, random);
    this.drawSun(r);
    this.sun.blendMode = "add";
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.aura, this.root, this.sun, this.leaves.container, this.seed);
    this.container.filters = [this.bloom];
  }

  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / VITAE_TOUCH_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    const r = this.options.size / 2;
    const scale = cameraScale > 0 ? cameraScale : 1;
    const beat = heartbeat(t, VITAE_TOUCH_BEATS, 0.04, 0.1);
    const hit = VITAE_TOUCH_HIT_MS / VITAE_TOUCH_DURATION_MS;
    const fade = 1 - phase(t, hit + 0.05, 1);
    const open = easeOutBack(phase(t, 0, 0.22));
    this.aura.width = this.aura.height = r * (3.2 + 1.2 * beat);
    this.aura.alpha = (0.35 + 0.5 * beat) * fade * Math.min(open, 1);
    this.sun.scale.set(Math.max(open, 0) * (1 + 0.08 * beat));
    this.sun.rotation = (elapsed / 1000) * 0.9;
    this.sun.alpha = fade;
    const grow = phase(t, 0.16, hit);
    this.drawRoot(grow, scale);
    this.root.alpha = fade;
    const tip = pathPoint(this.path, grow).point;
    this.seed.visible = grow > 0 && grow < 1;
    this.seed.position.set(tip.x, tip.y);
    this.seed.width = this.seed.height = r * (0.9 + 0.3 * Math.sin(elapsed / 40));
    this.leaves.update(elapsed / 1000);
    const lift = Math.sin(Math.PI * Math.min(t / hit, 1)) * r * 0.06;
    return {
      done: false,
      frame: { dx: 0, dy: -lift, scaleX: 1 + 0.06 * beat, scaleY: 1 + 0.06 * beat },
    };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** The sun around him, drawn once: long and short gold rays between two thin rings. */
  private drawSun(r: number): void {
    const g = this.sun;
    for (let index = 0; index < VITAE_TOUCH_RAYS; index += 1) {
      const angle = (index / VITAE_TOUCH_RAYS) * Math.PI * 2;
      const long = index % 2 === 0;
      const inner = r * 1.12;
      const outer = r * (long ? 1.75 : 1.45);
      const spread = long ? 0.07 : 0.05;
      g.poly([
        Math.cos(angle - spread) * inner,
        Math.sin(angle - spread) * inner,
        Math.cos(angle) * outer,
        Math.sin(angle) * outer,
        Math.cos(angle + spread) * inner,
        Math.sin(angle + spread) * inner,
      ]).fill({ color: long ? VITAE_COLORS.emerald : VITAE_COLORS.spring, alpha: 0.85 });
    }
    g.circle(0, 0, r * 1.08).stroke({ width: r * 0.04, color: VITAE_COLORS.spring, alpha: 0.9 });
    g.circle(0, 0, r * 1.2).stroke({ width: r * 0.02, color: VITAE_COLORS.leaf, alpha: 0.7 });
  }

  /** The root of light up to `grow` (redrawn only while it grows), with its leaves opening as it passes. */
  private drawRoot(grow: number, scale: number): void {
    const key = Math.round(grow * 200);
    if (key === this.grownKey) return;
    this.grownKey = key;
    const g = this.root.clear();
    if (grow <= 0) return;
    const r = this.options.size / 2;
    const count = Math.max(2, Math.ceil(this.path.length * grow));
    const shown = this.path.slice(0, count).flatMap((point) => [point.x, point.y]);
    g.poly(shown, false).stroke({
      width: Math.max(r * 0.16, 3 / scale),
      color: VITAE_COLORS.deep,
      alpha: 0.85,
      cap: "round",
    });
    g.poly(shown, false).stroke({
      width: Math.max(r * 0.08, 2 / scale),
      color: VITAE_COLORS.emerald,
      cap: "round",
    });
    g.poly(shown, false).stroke({
      width: Math.max(r * 0.03, 1 / scale),
      color: VITAE_COLORS.cream,
      cap: "round",
    });
    for (const leaf of this.rootLeaves) {
      const open = phase(grow, leaf.at, leaf.at + 0.15);
      if (open <= 0) continue;
      const { point, angle } = pathPoint(this.path, leaf.at);
      g.poly(leafShape(point, angle + leaf.side * 1.0, r * 0.4 * easeOutBack(open))).fill({
        color: mixColor(VITAE_COLORS.jade, VITAE_COLORS.leaf, 0.3),
        alpha: 0.95,
      });
    }
  }

  /** Leaves rising at his feet, swaying and turning gold as they go up. */
  private planLeaves(host: IArenaFxHost, r: number, random: () => number): void {
    for (let index = 0; index < VITAE_TOUCH_LEAVES; index += 1) {
      const angle = random() * Math.PI * 2;
      const size = r * (0.14 + random() * 0.1);
      const sway = random() * Math.PI * 2;
      const spin = (random() - 0.5) * 6;
      this.leaves.add({
        texture: host.textures.petal,
        spawn: {
          x: Math.cos(angle) * r * 1.1,
          y: Math.sin(angle) * r * 0.6 + r * 0.3,
          vx: 0,
          vy: -r * (1 + random() * 0.8),
          drag: 0,
          gravity: 0,
          born: random() * 0.8,
          life: 0.6 + random() * 0.4,
        },
        look: {
          size: () => size,
          height: (l) => size * (0.5 + 0.5 * Math.abs(Math.cos(l * 7 + sway))),
          alpha: (l) => Math.sin(Math.PI * l),
          tint: (l) => mixStops([VITAE_COLORS.emerald, VITAE_COLORS.leaf, VITAE_COLORS.spring], l),
          rotation: (age) => sway + age * spin,
          drift: (age) => ({ x: Math.sin(age * 5 + sway) * r * 0.2, y: 0 }),
        },
      });
    }
  }
}
