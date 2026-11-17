import { Container, Graphics, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ENTROPIA_COLORS, quadPoint } from "@/modules/arena/services/arenaEntropiaEffect";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
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
  ENTROPIA_CAST_DURATION_MS,
  ENTROPIA_CAST_HIT_MS,
  ENTROPIA_CAST_INFALL,
  ENTROPIA_CAST_LINKS,
  ENTROPIA_CAST_THROW,
  ENTROPIA_CAST_TRAIL,
} from "./arenaEntropiaCastEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Selvarin's part of "Entropia e Poema": chain links rise and turn around her, and over her hand a singularity
 * opens (a black core in a burning ring) that pulls dark matter in, growing; then she throws it, and it flies in
 * an arc to the target trailing black smoke and embers, while she recoils.
 */
export class ArenaEntropiaCastEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly orb = new Container();
  private readonly glow: Sprite;
  private readonly links: Sprite[] = [];
  private readonly matter: ArenaFxParticles;
  private readonly smoke: ArenaFxParticles;
  private readonly hand: IArenaPoint2;
  private readonly control: IArenaPoint2;
  private readonly target: IArenaPoint2;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed * 3 + 9);
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    const direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    this.hand = { x: direction.x * r * 0.8, y: direction.y * r * 0.8 - r * 0.9 };
    this.target = {
      x: options.toward.x - direction.x * options.targetRadius * 0.3,
      y: options.toward.y - direction.y * options.targetRadius * 0.3,
    };
    this.control = {
      x: (this.hand.x + this.target.x) / 2,
      y: Math.min(this.hand.y, this.target.y) - distance * 0.3,
    };
    this.glow = new Sprite(host.textures.glow);
    this.glow.anchor.set(0.5);
    this.glow.tint = ENTROPIA_COLORS.crimson;
    this.glow.blendMode = "add";
    const core = new Graphics()
      .circle(0, 0, r * 0.32)
      .fill({ color: ENTROPIA_COLORS.black })
      .circle(0, 0, r * 0.34)
      .stroke({ width: r * 0.06, color: ENTROPIA_COLORS.crimson })
      .circle(0, 0, r * 0.33)
      .stroke({ width: r * 0.02, color: ENTROPIA_COLORS.white, alpha: 0.9 });
    this.orb.addChild(this.glow, core);
    this.orb.scale.set(0);
    for (let index = 0; index < ENTROPIA_CAST_LINKS; index += 1) {
      const link = new Sprite(host.textures.link);
      link.anchor.set(0.5);
      link.width = r * (index % 2 === 0 ? 0.32 : 0.12);
      link.height = r * 0.44;
      link.visible = false;
      this.links.push(link);
    }
    this.matter = new ArenaFxParticles(r * 4, "add");
    this.smoke = new ArenaFxParticles(distance + r * 4, "normal");
    this.plan(host, r, random);
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(...this.links, this.smoke.container, this.matter.container, this.orb);
    this.container.filters = [this.bloom];
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / ENTROPIA_CAST_DURATION_MS, 1);
    if (t >= 1) return { done: true, frame: REST };
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const hit = ENTROPIA_CAST_HIT_MS / ENTROPIA_CAST_DURATION_MS;
    const form = easeOutBack(phase(t, 0.05, ENTROPIA_CAST_THROW));
    const flight = phase(t, ENTROPIA_CAST_THROW, hit);
    const arrived = t >= hit;
    this.orb.visible = !arrived;
    const position =
      flight > 0 ? quadPoint(this.hand, this.control, this.target, flight ** 1.3) : this.hand;
    this.orb.position.set(position.x, position.y);
    this.orb.scale.set(Math.max(form, 0) * (1 + 0.1 * Math.sin(seconds * 14)));
    this.glow.width = this.glow.height = r * (1.8 + 0.4 * Math.sin(seconds * 9));
    this.glow.alpha = 0.8;
    const ring = phase(t, 0, 0.15) * (1 - phase(t, ENTROPIA_CAST_THROW, hit + 0.1));
    this.links.forEach((link, index) => {
      link.visible = ring > 0;
      const angle = (index / this.links.length) * Math.PI * 2 + seconds * 2.4;
      link.position.set(Math.cos(angle) * r * 1.35, Math.sin(angle) * r * 0.5 - r * 0.25 * ring);
      link.rotation = angle;
      link.alpha = ring;
      link.tint = mixColor(
        ENTROPIA_COLORS.iron,
        ENTROPIA_COLORS.ember,
        0.5 + 0.5 * Math.sin(seconds * 8 + index),
      );
    });
    this.matter.update(seconds);
    this.smoke.update(seconds);
    const recoil =
      Math.exp(-Math.max(t - ENTROPIA_CAST_THROW, 0) * 30) * (t >= ENTROPIA_CAST_THROW ? 1 : 0);
    const distance = Math.hypot(this.options.toward.x, this.options.toward.y) || 1;
    const frame = {
      dx: (-this.options.toward.x / distance) * r * 0.2 * recoil,
      dy: (-this.options.toward.y / distance) * r * 0.2 * recoil - r * 0.06 * form,
      scaleX: 1 + 0.04 * form,
      scaleY: 1 + 0.04 * form,
    };
    return { done: false, frame };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /** Dark matter falling into the singularity while it forms, and its trail of smoke and embers in flight. */
  private plan(host: IArenaFxHost, r: number, random: () => number): void {
    const seconds = ENTROPIA_CAST_DURATION_MS / 1000;
    const throwAt = ENTROPIA_CAST_THROW * seconds;
    const hitAt = ENTROPIA_CAST_HIT_MS / 1000;
    for (let index = 0; index < ENTROPIA_CAST_INFALL; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = r * (1.2 + random() * 1.2);
      const life = 0.3 + random() * 0.25;
      const start = {
        x: this.hand.x + Math.cos(angle) * from,
        y: this.hand.y + Math.sin(angle) * from,
      };
      const size = r * (0.08 + random() * 0.1);
      this.matter.add({
        texture: host.textures.streak,
        anchorX: 1,
        spawn: {
          ...start,
          vx: (this.hand.x - start.x) / life,
          vy: (this.hand.y - start.y) / life,
          drag: 0,
          gravity: 0,
          born: 0.05 + random() * Math.max(throwAt - 0.05 - life, 0.05),
          life,
        },
        look: {
          size: (l) => size * (2 + l * 3),
          height: () => size * 0.5,
          alpha: (l) => Math.min(l * 5, 1) * (1 - phase(l, 0.85, 1)),
          tint: (l) => mixColor(ENTROPIA_COLORS.crimson, ENTROPIA_COLORS.hot, l),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    for (let index = 0; index < ENTROPIA_CAST_TRAIL; index += 1) {
      const share = index / ENTROPIA_CAST_TRAIL;
      const at = quadPoint(this.hand, this.control, this.target, share ** 1.3);
      const born = throwAt + (hitAt - throwAt) * share;
      const ember = index % 3 === 0;
      const size = r * (ember ? 0.12 : 0.35 + random() * 0.25);
      const sway = random() * Math.PI * 2;
      this.smoke.add({
        texture: ember ? host.textures.spark : host.textures.smoke,
        spawn: {
          x: at.x,
          y: at.y,
          vx: (random() - 0.5) * r,
          vy: -r * (0.2 + random() * 0.4),
          drag: 1,
          gravity: ember ? r * 2 : 0,
          born,
          life: ember ? 0.4 : 0.6 + random() * 0.3,
        },
        look: {
          size: (l) => size * (ember ? 1 - l : 1 + l * 0.8),
          alpha: (l) => (ember ? 1 - l : 0.7 * (1 - l)),
          tint: (l) =>
            ember
              ? mixColor(ENTROPIA_COLORS.hot, ENTROPIA_COLORS.crimson, l)
              : mixColor(ENTROPIA_COLORS.void, ENTROPIA_COLORS.blood, l * 0.5),
          rotation: (age) => sway + age,
        },
      });
    }
  }
}
