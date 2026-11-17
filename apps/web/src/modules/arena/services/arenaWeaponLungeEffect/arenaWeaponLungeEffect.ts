import { Container, Graphics, Sprite } from "pixi.js";

import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaEnergyFlow, ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import {
  ArenaLungeEffect,
  LUNGE_DURATION_MS,
  type ArenaLungePalette,
} from "@/modules/arena/services/arenaLungeEffect";
import {
  easeOutBack,
  phase,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  WEAPON_COLORS,
  WEAPON_FIRE_LINGER_MS,
  WEAPON_RAISE_ARC,
  WEAPON_REST_ARC,
  WEAPON_SWING,
} from "./arenaWeaponLungeEffect.constants";
import type { ArenaWeapon, IWeaponFire } from "./arenaWeaponLungeEffect.types";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * A lunge with a weapon in hand: the attacker draws it as it winds up, dashes at the target with it raised high
 * behind the head, and brings it down hard right as it arrives (a pale blur for the shovel, an arc of green fire
 * for the voodoo axe, whose burning edge leaves real flames behind it), so the blow lands on the target with the impact; the weapon stays on the target for a
 * moment, then is lowered and fades on the way back. The trail of the dash goes under the token, the weapon over
 * it.
 */
export class ArenaWeaponLungeEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly lunge: ArenaLungeEffect;
  private readonly trail = new Graphics();
  private readonly weapon = new Graphics();
  private readonly glow: Sprite | null;
  private readonly hand: IArenaPoint2;
  private readonly length: number;
  private readonly fire: IWeaponFire | null;
  private fireSeconds = 0;
  private start: number | null = null;
  private placed = false;

  constructor(
    private readonly options: IArenaAttackerInput,
    host: IArenaFxHost,
    private readonly kind: ArenaWeapon,
    palette: ArenaLungePalette,
  ) {
    const r = options.size / 2;
    this.lunge = new ArenaLungeEffect({ ...options, palette }, host);
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    const across = { x: -options.toward.y / distance, y: options.toward.x / distance };
    this.hand = { x: across.x * r * 0.35, y: across.y * r * 0.35 };
    this.length = Math.min(r + options.targetRadius, r * 3);
    this.trail.blendMode = "add";
    this.glow = kind === "axe" ? new Sprite(host.textures.glow) : null;
    this.fire = kind === "axe" ? this.kindle(host, r) : null;
    this.container.eventMode = "none";
    if (this.fire) this.container.addChild(this.fire.fluid.view, this.fire.swing.mesh);
    this.container.addChild(this.trail, this.weapon);
    if (this.glow) {
      this.glow.anchor.set(0.5);
      this.glow.tint = WEAPON_COLORS.lime;
      this.glow.blendMode = "add";
      this.container.addChild(this.glow);
    }
  }

  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const play = this.lunge.step(now, cameraScale);
    if (play.done) return this.burnOut(now);
    const parent = this.container.parent;
    if (!this.placed && parent) {
      this.placed = true;
      parent.addChildAt(this.lunge.container, 0);
    }
    const t = Math.min((now - this.start) / LUNGE_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const target = {
      x: this.options.toward.x - play.frame.dx,
      y: this.options.toward.y - play.frame.dy,
    };
    const heading = Math.atan2(target.y - this.hand.y, target.x - this.hand.x);
    const fade = 1 - phase(t, WEAPON_SWING.lower, WEAPON_SWING.gone);
    const shown = Math.min(easeOutBack(phase(t, 0, WEAPON_SWING.raised * 0.6)), 1.2);
    const angle = this.angle(t, heading);
    this.drawTrail(t, heading, angle);
    if (this.kind === "shovel")
      this.drawShovel(angle, scale, fade * Math.min(shown, 1), Math.max(shown, 0));
    else {
      this.drawAxe(angle, scale, fade * Math.min(shown, 1), Math.max(shown, 0), now);
      this.burn(now, t, heading, angle, fade * Math.min(shown, 1));
    }
    return play;
  }

  destroy(): void {
    if (this.fire) {
      this.fire.edge.mesh.removeFromParent();
      this.fire.embers.mesh.removeFromParent();
      for (const flow of [this.fire.edge, this.fire.embers, this.fire.swing]) flow.destroy();
      this.fire.fluid.destroy();
    }
    this.lunge.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * Angle of the weapon at `t`: drawn to the side, raised high behind while dashing (bobbing), slammed down to
   * the target right before the arrival, held there (the shovel bounces off, the axe bites and shivers), then
   * lowered.
   */
  private angle(t: number, heading: number): number {
    const raised = heading - WEAPON_RAISE_ARC;
    if (t < WEAPON_SWING.raised) {
      const rest = heading - WEAPON_REST_ARC;
      return rest + (raised - rest) * Math.min(easeOutBack(phase(t, 0, WEAPON_SWING.raised)), 1.1);
    }
    if (t < WEAPON_SWING.strike) return raised + 0.08 * Math.sin(t * 40);
    if (t < WEAPON_SWING.hit)
      return raised + WEAPON_RAISE_ARC * phase(t, WEAPON_SWING.strike, WEAPON_SWING.hit) ** 2.2;
    const since = phase(t, WEAPON_SWING.hit, WEAPON_SWING.lower);
    if (t < WEAPON_SWING.lower) {
      if (this.kind === "shovel")
        return heading - 0.32 * Math.sin(Math.PI * Math.min(since * 2, 1)) * (1 - since * 0.4);
      return heading + 0.05 * Math.exp(-since * 8) * Math.sin(since * 90);
    }
    return heading - 0.7 * phase(t, WEAPON_SWING.lower, WEAPON_SWING.gone);
  }

  /** The swing of the shovel: a pale blur swept from where it was raised to where it is, gone after the hit. */
  private drawTrail(t: number, heading: number, angle: number): void {
    const g = this.trail.clear();
    if (t < WEAPON_SWING.strike || this.kind === "axe") return;
    const life = phase(t, WEAPON_SWING.hit, WEAPON_SWING.hit + 0.14);
    if (life >= 1) return;
    const from = heading - WEAPON_RAISE_ARC;
    const to = Math.min(angle, heading);
    const span = to - from;
    if (span <= 0.05) return;
    const r = this.options.size / 2;
    const steps = 22;
    const tail = from + span * (0.3 + 0.7 * life);
    const band = (inner: number, outer: number): number[] => {
      const points: number[] = [];
      for (let step = 0; step <= steps; step += 1) {
        const a = tail + ((to - tail) * step) / steps;
        points.push(this.hand.x + Math.cos(a) * outer, this.hand.y + Math.sin(a) * outer);
      }
      for (let step = steps; step >= 0; step -= 1) {
        const a = tail + ((to - tail) * step) / steps;
        points.push(this.hand.x + Math.cos(a) * inner, this.hand.y + Math.sin(a) * inner);
      }
      return points;
    };
    const tip = this.length;
    g.poly(band(tip - r * 0.45, tip + r * 0.5)).fill({
      color: WEAPON_COLORS.shine,
      alpha: 0.32 * (1 - life),
    });
  }

  /**
   * The fire of the voodoo axe: its burning edge pours into a fluid of green fire (so the blade leaves flames
   * behind it as it is raised and swung, and the blow bursts into fire), and a ribbon of fire sweeps along the
   * arc of the swing.
   */
  private kindle(host: IArenaFxHost, r: number): IWeaponFire {
    const reach = this.length + r * 1.6;
    const fluid = new ArenaEnergyFluid(host, {
      area: { x: -reach, y: -reach - r * 3, width: reach * 2, height: reach * 2 + r * 3 },
      palette: ENERGY_PALETTES.voodoo,
      secondary: ENERGY_PALETTES.hellfire,
      mode: "fire",
      resolution: 300,
      simulation: 96,
      pressureSteps: 10,
      decay: 0.4,
      turbulence: { scale: r * 0.8, force: r * 6 },
      vorticity: 40,
      threads: 3,
      gain: 1.15,
      seed: this.options.seed + 3,
    });
    const edge = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.voodooHot,
      speed: 300,
      grain: 40,
      feather: 0.5,
      samples: 12,
      seed: this.options.seed + 5,
    });
    const embers = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.hellfire,
      speed: 260,
      grain: 40,
      feather: 0.6,
      samples: 12,
      seed: this.options.seed + 6,
    });
    fluid.sources.addChild(edge.mesh, embers.mesh);
    const swing = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.voodoo,
      speed: 700,
      grain: 50,
      sharpness: 3.5,
      strands: 3,
      feather: 0.6,
      samples: 28,
      seed: this.options.seed + 7,
    });
    return { fluid, edge, embers, swing };
  }

  /**
   * The axe burns: its edge pours fire (much more while it comes down and bites), and the swing leaves a ribbon
   * of fire along its arc that fades right after the hit.
   */
  private burn(now: number, t: number, heading: number, angle: number, alpha: number): void {
    const fire = this.fire;
    if (!fire) return;
    const r = this.options.size / 2;
    const seconds = (now - (this.start ?? now)) / 1000;
    const delta = seconds - this.fireSeconds;
    this.fireSeconds = seconds;
    const at = (u: number, v: number) => {
      const [x, y] = this.at(angle, u, v);
      return { x, y };
    };
    const head = this.length - r * 0.15;
    fire.edge.setPath(
      [at(head + r * 0.3, r * 0.55), at(head + r * 0.05, r * 0.7), at(head - r * 0.3, r * 0.5)],
      r * 0.4,
    );
    fire.embers.setPath(
      [at(head + r * 0.25, r * 0.2), at(head, r * 0.4), at(head - r * 0.25, r * 0.15)],
      r * 0.45,
    );
    const striking = t >= WEAPON_SWING.strike && t < WEAPON_SWING.hit + 0.1;
    fire.edge.update(seconds, { alpha: alpha * (striking ? 1 : 0.45) });
    fire.embers.update(seconds, { alpha: alpha * (striking ? 1 : 0.6) });
    fire.fluid.update(delta, {
      inject: striking ? 12 : 6,
      bias: { drift: { x: 0, y: -r * 4.5 } },
    });
    const life = phase(t, WEAPON_SWING.hit, WEAPON_SWING.hit + 0.14);
    const from = heading - WEAPON_RAISE_ARC;
    const to = Math.min(angle, heading);
    if (t < WEAPON_SWING.strike || life >= 1 || to - from <= 0.05) {
      fire.swing.update(seconds, { alpha: 0 });
      return;
    }
    const tail = from + (to - from) * (0.3 + 0.7 * life);
    const radius = this.length + r * 0.45;
    const arc = Array.from({ length: 20 }, (_, index) => {
      const a = tail + ((to - tail) * index) / 19;
      return { x: this.hand.x + Math.cos(a) * radius, y: this.hand.y + Math.sin(a) * radius };
    });
    fire.swing.setPath(arc, (along) => r * 1.1 * along ** 1.5);
    fire.swing.update(seconds, { alpha: 1 - life });
  }

  /** After the lunge, the last flames of the axe rise and fade by themselves. */
  private burnOut(now: number): { done: boolean; frame: IArenaEffectFrame } {
    const fire = this.fire;
    if (!fire) return { done: true, frame: REST };
    this.weapon.visible = false;
    if (this.glow) this.glow.visible = false;
    fire.swing.update(0, { alpha: 0 });
    const seconds = (now - (this.start ?? now)) / 1000;
    const delta = seconds - this.fireSeconds;
    this.fireSeconds = seconds;
    const since = now - (this.start ?? now) - LUNGE_DURATION_MS;
    const r = this.options.size / 2;
    fire.fluid.update(delta, {
      inject: 0,
      alpha: 1 - phase(since, WEAPON_FIRE_LINGER_MS * 0.4, WEAPON_FIRE_LINGER_MS),
      bias: { drift: { x: 0, y: -r * 5 } },
    });
    return { done: since >= WEAPON_FIRE_LINGER_MS, frame: REST };
  }

  /** A point along the weapon (`u` from the hand) and across it (`v`), for drawing it at `angle`. */
  private at(angle: number, u: number, v: number): [number, number] {
    const along = { x: Math.cos(angle), y: Math.sin(angle) };
    return [this.hand.x + along.x * u - along.y * v, this.hand.y + along.y * u + along.x * v];
  }

  /**
   * The shovel: a wooden handle with a D grip and a steel spade blade with a bright edge, its blade reaching the
   * target center at the blow.
   */
  private drawShovel(angle: number, scale: number, alpha: number, size: number): void {
    const g = this.weapon.clear();
    if (alpha <= 0) return;
    const r = (this.options.size / 2) * size;
    const at = (u: number, v: number) => this.at(angle, u, v);
    const outline = { width: Math.max(r * 0.03, 1 / scale), color: WEAPON_COLORS.ink, alpha };
    const tip = this.length * size + r * 0.45;
    const neck = tip - r * 1;
    const handle = r * 0.06;
    g.poly([
      ...at(-r * 0.4, -handle),
      ...at(neck, -handle),
      ...at(neck, handle),
      ...at(-r * 0.4, handle),
    ])
      .fill({ color: WEAPON_COLORS.wood, alpha })
      .stroke(outline);
    g.poly([...at(-r * 0.35, -handle * 0.3), ...at(neck - r * 0.05, -handle * 0.3)], false).stroke({
      width: Math.max(r * 0.02, 0.5 / scale),
      color: WEAPON_COLORS.woodLight,
      alpha,
    });
    g.poly([
      ...at(-r * 0.4, -handle * 2.2),
      ...at(-r * 0.7, -handle * 2.2),
      ...at(-r * 0.7, handle * 2.2),
      ...at(-r * 0.4, handle * 2.2),
    ]).stroke({ width: handle * 1.2, color: WEAPON_COLORS.wood, alpha });
    g.poly([
      ...at(neck - r * 0.08, -handle * 1.6),
      ...at(neck + r * 0.08, -handle * 1.8),
      ...at(neck + r * 0.08, handle * 1.8),
      ...at(neck - r * 0.08, handle * 1.6),
    ])
      .fill({ color: WEAPON_COLORS.dark, alpha })
      .stroke(outline);
    const half = r * 0.42;
    const base = neck + r * 0.08;
    const blade: number[] = [...at(base, -half)];
    for (let step = 0; step <= 12; step += 1) {
      const a = -Math.PI / 2 + (step / 12) * Math.PI;
      blade.push(...at(base + (tip - base) * (0.55 + 0.45 * Math.cos(a)), half * Math.sin(a)));
    }
    blade.push(...at(base, half));
    g.poly(blade).fill({ color: WEAPON_COLORS.steel, alpha }).stroke(outline);
    g.poly([
      ...at(base + r * 0.06, -half * 0.55),
      ...at(tip - r * 0.25, -half * 0.35),
      ...at(tip - r * 0.3, -half * 0.1),
      ...at(base + r * 0.08, -half * 0.25),
    ]).fill({ color: WEAPON_COLORS.shine, alpha: 0.85 * alpha });
    g.moveTo(...at(base + (tip - base) * 0.4, -half * 0.92))
      .quadraticCurveTo(...at(tip + r * 0.02, 0), ...at(base + (tip - base) * 0.4, half * 0.92))
      .stroke({
        width: Math.max(r * 0.035, 1 / scale),
        color: WEAPON_COLORS.white,
        alpha: 0.8 * alpha,
      });
  }

  /**
   * The voodoo axe: a dark wooden haft and an iron bearded head with an edge of green fire, wreathed in a
   * flickering green glow, its edge reaching the target center at the blow.
   */
  private drawAxe(angle: number, scale: number, alpha: number, size: number, now: number): void {
    const g = this.weapon.clear();
    if (this.glow) this.glow.visible = alpha > 0;
    if (alpha <= 0) return;
    const r = (this.options.size / 2) * size;
    const at = (u: number, v: number) => this.at(angle, u, v);
    const edge = { width: Math.max(r * 0.03, 1 / scale), color: WEAPON_COLORS.ink, alpha };
    const head = this.length * size - r * 0.15;
    g.poly([
      ...at(-r * 0.4, -r * 0.05),
      ...at(head + r * 0.12, -r * 0.05),
      ...at(head + r * 0.12, r * 0.05),
      ...at(-r * 0.4, r * 0.05),
    ])
      .fill({ color: WEAPON_COLORS.axeWood, alpha })
      .stroke(edge);
    g.poly([
      ...at(head - r * 0.12, r * 0.06),
      ...at(head + r * 0.12, r * 0.06),
      ...at(head + r * 0.3, r * 0.55),
      ...at(head, r * 0.62),
      ...at(head - r * 0.3, r * 0.5),
    ])
      .fill({ color: WEAPON_COLORS.iron, alpha })
      .stroke(edge);
    g.poly([
      ...at(head - r * 0.08, -r * 0.06),
      ...at(head + r * 0.08, -r * 0.06),
      ...at(head, -r * 0.24),
    ])
      .fill({ color: WEAPON_COLORS.iron, alpha })
      .stroke(edge);
    g.moveTo(...at(head + r * 0.3, r * 0.55))
      .quadraticCurveTo(...at(head + r * 0.05, r * 0.7), ...at(head - r * 0.3, r * 0.5))
      .stroke({ width: r * 0.09, color: WEAPON_COLORS.lime, alpha });
    g.moveTo(...at(head + r * 0.28, r * 0.56))
      .quadraticCurveTo(...at(head + r * 0.05, r * 0.68), ...at(head - r * 0.28, r * 0.51))
      .stroke({ width: r * 0.03, color: WEAPON_COLORS.core, alpha });
    g.circle(...at(head + r * 0.3, r * 0.55), r * 0.06).fill({ color: WEAPON_COLORS.gold, alpha });
    if (this.glow) {
      const [x, y] = at(head, r * 0.4);
      this.glow.position.set(x, y);
      this.glow.width = this.glow.height = r * (1.4 + 0.2 * Math.sin(now / 45));
      this.glow.alpha = 0.55 * alpha;
    }
  }
}
