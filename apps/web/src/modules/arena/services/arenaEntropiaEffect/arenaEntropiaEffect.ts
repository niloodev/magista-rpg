import { ColorMatrixFilter, Container, Graphics, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  groupShape,
  mixColor,
  phase,
  seededRandom,
  shake,
  type IArenaEffectFrame,
  type IArenaEffectOptions,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  ENTROPIA_COLORS,
  ENTROPIA_DURATION_MS,
  ENTROPIA_GROUP_GROWTH,
  ENTROPIA_GROUP_MAX,
  ENTROPIA_HOLE_LIFT,
  ENTROPIA_IDENTITY_MATRIX,
  ENTROPIA_MOTES,
  ENTROPIA_PHASES,
  ENTROPIA_SCREEN_KEY,
  ENTROPIA_SHOCKWAVE,
  ENTROPIA_TOKEN_MATRIX,
} from "./arenaEntropiaEffect.constants";
import type { IEntropiaScreen } from "./arenaEntropiaEffect.types";
import { EntropiaScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Entropia e Poema", Selvarin's ultimate: everything that is born learns to fall apart. The world drains into
 * black and red and a black hole opens above the target, bending the image of the board around it; chains fly
 * in from beyond the screen and bind the target (a red seal burns under it where they bite), the poem, written in
 * runes around the hole, is pulled into it, and the target is stretched toward it, its color drained, bits of it torn off
 * and sucked up. The hole collapses and bursts: the target is slammed down, the chains break and ash falls.
 */
export class ArenaEntropiaEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = ENTROPIA_PHASES.burst * ENTROPIA_DURATION_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly drain = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.3,
    blur: 5,
    quality: 3,
  });
  private readonly seal = new Graphics();
  private readonly motes: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly screen: IEntropiaScreen | null;
  private start: number | null = null;
  private struck = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const random = seededRandom(options.seed);
    this.drawSeal(r);
    this.motes = new ArenaFxParticles(r * 6, "add");
    this.planMotes(host, r, random);
    this.amount = new ArenaAmountText(
      "entropiaPoema",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.seal.blendMode = "add";
    this.seal.alpha = 0;
    this.bloom.resolution = 1;
    this.container.eventMode = "none";
    this.container.addChild(this.seal, this.motes.container, this.amount.text);
    this.container.filters = [this.bloom];
    this.tokenFilters = [this.drain];
    this.screen = host.screen.claim(ENTROPIA_SCREEN_KEY, ENTROPIA_DURATION_MS)
      ? new EntropiaScreen(host, seededRandom(options.seed * 11 + 5), options.group)
      : null;
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / ENTROPIA_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < ENTROPIA_PHASES.burst) this.amount.text.visible = false;
    else this.amount.place(phase(t, ENTROPIA_PHASES.burst, 1), scale, r + lift, false);
    if (t >= 1) {
      this.drain.matrix = ENTROPIA_IDENTITY_MATRIX as ColorMatrixFilter["matrix"];
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= ENTROPIA_PHASES.burst) {
      this.struck = true;
      this.host.shockwave(
        this.container,
        r * scale * ENTROPIA_SHOCKWAVE.radii,
        ENTROPIA_SHOCKWAVE.durationMs,
        { amplitude: ENTROPIA_SHOCKWAVE.amplitude, wavelength: ENTROPIA_SHOCKWAVE.wavelength },
      );
    }
    const seconds = elapsed / 1000;
    const pull = phase(t, ENTROPIA_PHASES.bind, ENTROPIA_PHASES.collapse);
    const drained = Math.min(pull * 1.3, 1) * (1 - phase(t, ENTROPIA_PHASES.burst, 1));
    this.drain.matrix = ENTROPIA_IDENTITY_MATRIX.map(
      (value, index) => value + ((ENTROPIA_TOKEN_MATRIX[index] ?? 0) - value) * drained,
    ) as ColorMatrixFilter["matrix"];
    const bound = phase(t, ENTROPIA_PHASES.poem, ENTROPIA_PHASES.poem + 0.06);
    this.seal.alpha =
      bound *
      (1 - phase(t, ENTROPIA_PHASES.burst, ENTROPIA_PHASES.settle)) *
      (0.75 + 0.25 * Math.sin(seconds * 9));
    this.seal.rotation = -seconds * 0.6;
    this.seal.tint = mixColor(
      ENTROPIA_COLORS.white,
      ENTROPIA_COLORS.hot,
      phase(t, ENTROPIA_PHASES.pull, ENTROPIA_PHASES.collapse),
    );
    this.motes.update(seconds);
    this.screen?.step(t, this.container, r * scale);
    return { done: false, frame: this.stretch(t, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.container.filters = [];
    this.bloom.destroy();
    this.drain.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The target in the grip of the hole: it trembles as the chains bite, is stretched up toward the hole more
   * and more (spaghettified), and at the burst is slammed down, squashed, and shudders back.
   */
  private stretch(t: number, r: number): IArenaEffectFrame {
    if (t < ENTROPIA_PHASES.burst) {
      const bite = phase(t, ENTROPIA_PHASES.bind + 0.05, ENTROPIA_PHASES.poem + 0.08);
      const pull = phase(t, ENTROPIA_PHASES.pull, ENTROPIA_PHASES.collapse) ** 1.4;
      const tremble =
        shake(bite, r * 0.04 * (1 - pull), 18, 1) + shake(pull, r * 0.03 * pull, 50, 1);
      return {
        dx: tremble,
        dy: -r * ENTROPIA_HOLE_LIFT * 0.18 * pull,
        scaleX: 1 - 0.28 * pull,
        scaleY: 1 + 0.45 * pull,
      };
    }
    const after = phase(t, ENTROPIA_PHASES.burst, 1);
    const crush = 0.35 * Math.exp(-after * 11);
    const wobble = 0.07 * Math.exp(-after * 5) * Math.sin(after * 60);
    return {
      dx: shake(after, r * 0.1, 10, 0.4),
      dy: r * 0.3 * Math.exp(-after * 9),
      scaleX: 1 + crush * 0.8 + wobble,
      scaleY: 1 - crush - wobble,
    };
  }

  /** The seal burning under the target where the chains bite: two rings with runic marks between them. */
  private drawSeal(r: number): void {
    const g = this.seal;
    const outer = r * 1.45;
    const inner = r * 1.2;
    g.circle(0, 0, outer).stroke({ width: r * 0.05, color: ENTROPIA_COLORS.crimson, alpha: 0.9 });
    g.circle(0, 0, inner).stroke({ width: r * 0.03, color: ENTROPIA_COLORS.ruby, alpha: 0.8 });
    const marks = 18;
    for (let index = 0; index < marks; index += 1) {
      const angle = (index / marks) * Math.PI * 2;
      const tall = index % 3 === 0;
      const from = inner + r * 0.04;
      const to = tall ? outer - r * 0.02 : inner + (outer - inner) * 0.55;
      g.moveTo(Math.cos(angle) * from, Math.sin(angle) * from)
        .lineTo(Math.cos(angle + 0.04) * to, Math.sin(angle + 0.04) * to)
        .stroke({ width: r * 0.03, color: ENTROPIA_COLORS.ember, alpha: 0.9 });
    }
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;
      g.moveTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
        .lineTo(
          Math.cos(angle + (Math.PI * 2) / 3) * outer,
          Math.sin(angle + (Math.PI * 2) / 3) * outer,
        )
        .stroke({ width: r * 0.02, color: ENTROPIA_COLORS.blood, alpha: 0.7 });
    }
  }

  /** Bits of the target torn off and sucked up toward the hole, dark at first and burning as they rise. */
  private planMotes(host: IArenaFxHost, r: number, random: () => number): void {
    const seconds = ENTROPIA_DURATION_MS / 1000;
    const from = ENTROPIA_PHASES.poem * seconds;
    const until = ENTROPIA_PHASES.collapse * seconds;
    const shape = groupShape(this.options.group);
    const grow = Math.min(Math.max(shape.spread * ENTROPIA_GROUP_GROWTH, 1), ENTROPIA_GROUP_MAX);
    const hole = { x: shape.center.x * r, y: shape.center.y * r - r * ENTROPIA_HOLE_LIFT * grow };
    for (let index = 0; index < ENTROPIA_MOTES; index += 1) {
      const angle = random() * Math.PI * 2;
      const start = { x: Math.cos(angle) * r * 0.7, y: Math.sin(angle) * r * 0.7 };
      const life = 0.5 + random() * 0.4;
      const size = r * (0.08 + random() * 0.12);
      const spin = (random() - 0.5) * 10;
      const shard = index % 2 === 0;
      this.motes.add({
        texture: shard ? host.textures.shard : host.textures.spark,
        spawn: {
          ...start,
          vx: (hole.x - start.x) / life,
          vy: (hole.y - start.y) / life,
          drag: 0,
          gravity: 0,
          born: from + random() * Math.max(until - from - life, 0.1),
          life,
        },
        look: {
          size: (l) => size * (1 - l * 0.6),
          height: shard ? (l) => size * (1 + l * 2.5) : undefined,
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.8, 1)),
          tint: (l) => mixColor(ENTROPIA_COLORS.rust, ENTROPIA_COLORS.hot, l),
          rotation: (age, velocity) =>
            shard ? Math.atan2(velocity.y, velocity.x) + Math.PI / 2 : age * spin,
        },
      });
    }
  }
}
