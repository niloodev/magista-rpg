import { ColorMatrixFilter, Container, Graphics, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  mixColor,
  mixStops,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  NOX_COLORS,
  NOX_DRAINED_MATRIX,
  NOX_IDENTITY_MATRIX,
  SOUL_DRAIN_DURATION_MS,
  SOUL_DRAIN_MOTES,
  SOUL_DRAIN_WISPS,
} from "./arenaSoulDrainEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Where the drain pulls toward when there is no attacker (the example without one). */
const DEFAULT_INCOMING: IArenaPoint2 = { x: 1, y: 0 };

/**
 * "Sugada Espiritual" on the target: Lorcan opens his mouth and sucks the soul out. A cold violet ring tightens
 * on the target, its color drains to gray and violet, and wisps of pale soul are torn out of it and pulled away
 * toward the attacker, while it shudders and sags; cold motes linger around it.
 */
export class ArenaSoulDrainEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = 0.15 * SOUL_DRAIN_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly drained = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.2,
    blur: 5,
    quality: 3,
  });
  private readonly ring = new Graphics();
  private readonly wisps: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly away: IArenaPoint2;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaEffectOptions,
    host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const incoming = options.incoming ?? DEFAULT_INCOMING;
    const length = Math.hypot(incoming.x, incoming.y) || 1;
    this.away = { x: -incoming.x / length, y: -incoming.y / length };
    this.wisps = new ArenaFxParticles(r * 8, "add");
    this.plan(host, r);
    this.amount = new ArenaAmountText(
      "soulDrain",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.ring.blendMode = "add";
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.ring, this.wisps.container, this.amount.text);
    this.container.filters = [this.bloom];
    this.tokenFilters = [this.drained];
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / SOUL_DRAIN_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    this.amount.place(phase(t, 0.15, 1), scale, r + lift, false);
    if (t >= 1) {
      this.drained.matrix = NOX_IDENTITY_MATRIX as ColorMatrixFilter["matrix"];
      return { done: true, frame: REST };
    }
    const grip = phase(t, 0, 0.2) * (1 - phase(t, 0.75, 1));
    this.drained.matrix = NOX_IDENTITY_MATRIX.map(
      (value, index) => value + ((NOX_DRAINED_MATRIX[index] ?? 0) - value) * grip,
    ) as ColorMatrixFilter["matrix"];
    this.drawRing(t, r, scale);
    this.wisps.update(elapsed / 1000);
    const pull = Math.sin(Math.PI * Math.min(t * 1.3, 1));
    const frame = {
      dx: this.away.x * r * 0.08 * pull + shake(t, r * 0.025 * grip, 30, 1),
      dy: this.away.y * r * 0.08 * pull,
      scaleX: 1 - 0.06 * pull,
      scaleY: 1 - 0.08 * pull,
    };
    return { done: false, frame };
  }

  destroy(): void {
    this.container.filters = [];
    this.bloom.destroy();
    this.drained.destroy();
    this.container.destroy({ children: true });
  }

  /** A cold ring tightening on the target, pulsing, its bright arc turned toward where the soul goes. */
  private drawRing(t: number, r: number, scale: number): void {
    const g = this.ring.clear();
    const shown = phase(t, 0, 0.12) * (1 - phase(t, 0.7, 0.95));
    if (shown <= 0) return;
    const radius = r * (1.6 - 0.45 * phase(t, 0, 0.5));
    const pulse = 0.75 + 0.25 * Math.sin(t * 50);
    g.circle(0, 0, radius).stroke({
      width: Math.max(r * 0.1, 1.5 / scale),
      color: NOX_COLORS.purple,
      alpha: 0.5 * shown,
    });
    g.circle(0, 0, radius).stroke({
      width: Math.max(r * 0.03, 1 / scale),
      color: NOX_COLORS.lavender,
      alpha: 0.9 * shown * pulse,
    });
    const toward = Math.atan2(this.away.y, this.away.x);
    g.arc(0, 0, radius + r * 0.08, toward - 0.6, toward + 0.6).stroke({
      width: Math.max(r * 0.06, 1 / scale),
      color: NOX_COLORS.soul,
      alpha: shown,
    });
  }

  /** Wisps of soul torn out of the body and pulled away toward the attacker, and cold motes lingering. */
  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const seconds = SOUL_DRAIN_DURATION_MS / 1000;
    for (let index = 0; index < SOUL_DRAIN_WISPS; index += 1) {
      const angle = random() * Math.PI * 2;
      const from = {
        x: Math.cos(angle) * r * 0.6 * random(),
        y: Math.sin(angle) * r * 0.6 * random(),
      };
      const speed = r * (3 + random() * 3);
      const swirl = (random() - 0.5) * r * 1.4;
      const size = r * (0.12 + random() * 0.14);
      const sway = random() * Math.PI * 2;
      const life = 0.45 + random() * 0.35;
      this.wisps.add({
        texture: index % 3 === 0 ? host.textures.streak : host.textures.glow,
        anchorX: index % 3 === 0 ? 1 : 0.5,
        spawn: {
          ...from,
          vx: this.away.x * speed,
          vy: this.away.y * speed - r * 0.4,
          drag: 0,
          gravity: 0,
          born: 0.05 + random() * (seconds * 0.65 - life),
          life,
        },
        look: {
          size: (l) => size * (index % 3 === 0 ? 3 : 1) * (1 - l * 0.4),
          height: index % 3 === 0 ? () => size * 0.5 : undefined,
          alpha: (l) => Math.min(l * 5, 1) * (1 - phase(l, 0.7, 1)),
          tint: (l) =>
            mixStops(
              [NOX_COLORS.white, NOX_COLORS.soul, NOX_COLORS.lavender, NOX_COLORS.violet],
              l,
            ),
          rotation:
            index % 3 === 0 ? (_, velocity) => Math.atan2(velocity.y, velocity.x) : undefined,
          drift: (age) => ({
            x: -this.away.y * Math.sin(age * 9 + sway) * swirl * 0.3,
            y: this.away.x * Math.sin(age * 9 + sway) * swirl * 0.3,
          }),
        },
      });
    }
    for (let index = 0; index < SOUL_DRAIN_MOTES; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = r * (0.9 + random() * 0.8);
      const size = r * (0.05 + random() * 0.06);
      const flicker = random() * 10;
      this.wisps.add({
        texture: host.textures.spark,
        spawn: {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.7,
          vx: 0,
          vy: -r * 0.3,
          drag: 0,
          gravity: 0,
          born: 0.2 + random() * 0.6,
          life: 0.6 + random() * 0.4,
        },
        look: {
          size: () => size,
          alpha: (l, age) => Math.sin(Math.PI * l) * (0.5 + 0.5 * Math.sin(age * 20 + flicker)),
          tint: (l) => mixColor(NOX_COLORS.lavender, NOX_COLORS.purple, l),
        },
      });
    }
  }
}
