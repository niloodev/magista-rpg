import { Container, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { ArenaEnergyFlow, ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ArenaAmountText,
  groupShape,
  easeOutBack,
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
  VOX_COLORS,
  VOX_DURATION_MS,
  VOX_GROUP_GROWTH,
  VOX_GROUP_MAX,
  VOX_PANE,
  VOX_GLINTS,
  VOX_PHASES,
  VOX_SCREEN_KEY,
  VOX_SECTORS,
  VOX_SHARDS_PER_CELL,
  VOX_SHOCKWAVE,
} from "./arenaVoxPopuliEffect.constants";
import type { IFracture, IRumorCell, IVoxScreen } from "./arenaVoxPopuliEffect.types";
import { buildRumorCells, fracturePattern, strokeFracture } from "./arenaVoxPopuliEffect.utils";
import { VoxScreen } from "./subcomponents";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * "Vox Populi", the villain's spell: when Marion says something and everyone believes it, it always was true.
 * The world falls silent (the screen darkens around the target and the map bleeds into red monochrome), and a
 * rumor appears above the target: a tall gothic stained-glass window holding an all-seeing eye, dark and off.
 * Glints of belief fly in from every edge of the screen, and pane after pane its leading burns red-hot and the
 * glass lights up, rays first, then the ring, the eye and last the pupil. Then it is true: the window flashes
 * white, reality cracks over the whole screen (red-hot cracks with glinting facets, colors splitting, a huge
 * ripple through the map), the window slams down on the target and shatters into a storm of glass that catches
 * the light, while big shards fly at the viewer. The cracks fade slowly and the color comes back.
 */
export class ArenaVoxPopuliEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = VOX_PHASES.shatter * VOX_DURATION_MS;
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.4,
    brightness: 1.05,
    blur: 6,
    quality: 3,
  });
  private readonly pane = new Container();
  private readonly paneBloom = new AdvancedBloomFilter({
    threshold: 0.3,
    bloomScale: 1.4,
    brightness: 1.05,
    blur: 6,
    quality: 3,
  });
  private readonly glass = new Graphics();
  private readonly lead = new Graphics();
  private readonly shine = new Graphics();
  private readonly paneCracks = new Graphics();
  private readonly paneFlash = new Graphics();
  private readonly shineMask = new Graphics();
  private glassKey = "";
  private paneCrackReveal = -1;
  private readonly shards: ArenaFxParticles;
  private readonly glints: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly cells: IRumorCell[];
  private readonly paneFracture: IFracture;
  private readonly outline: number[];
  private readonly paneY: number;
  private readonly random: () => number;
  private readonly screen: IVoxScreen | null;
  private start: number | null = null;
  private struck = false;
  private readonly paneEnergy = new ArenaEnergyFlow({
    palette: ENERGY_PALETTES.blood,
    closed: true,
    samples: 96,
    speed: 140,
    strands: 5,
    seed: 29,
  });
  private readonly grow: number;
  private readonly middle: IArenaPoint2;
  private readonly showPane: boolean;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.random = seededRandom(options.seed);
    this.screen = host.screen.claim(VOX_SCREEN_KEY, VOX_DURATION_MS)
      ? new VoxScreen(host, this.random)
      : null;
    const shape = groupShape(options.group);
    this.grow = Math.min(Math.max(shape.spread * VOX_GROUP_GROWTH, 1), VOX_GROUP_MAX);
    this.middle = { x: shape.center.x * r, y: shape.center.y * r };
    this.showPane = !options.group || this.screen !== null;
    const width = r * VOX_PANE.width;
    const height = r * VOX_PANE.height;
    const rumor = buildRumorCells(width, height, VOX_SECTORS, this.random);
    this.cells = rumor.cells;
    this.outline = rumor.outline.flatMap((point) => [point.x, point.y]);
    this.paneFracture = fracturePattern(rumor.eye, height * 0.8, this.random, 9);
    this.paneY = -(shape.spread * r + r * VOX_PANE.gap + (height / 2) * this.grow);
    this.shards = new ArenaFxParticles(r * 8, "normal");
    this.glints = new ArenaFxParticles(r * 8, "add");
    this.bloom.resolution = 1;
    this.shine.blendMode = "add";
    this.shineMask.poly(this.outline).fill({ color: VOX_COLORS.white });
    this.shine.mask = this.shineMask;
    this.paneCracks.blendMode = "add";
    this.paneFlash.blendMode = "add";
    this.paneFlash.poly(this.outline).fill({ color: VOX_COLORS.white });
    this.drawShine(r);
    this.paneEnergy.setPath([...rumor.outline, rumor.outline[0] ?? { x: 0, y: 0 }], r * 0.32);
    this.pane.addChild(
      this.glass,
      this.lead,
      this.paneEnergy.mesh,
      this.shineMask,
      this.shine,
      this.paneCracks,
      this.paneFlash,
    );
    this.paneBloom.resolution = 1;
    this.pane.eventMode = "none";
    this.pane.visible = false;
    this.amount = new ArenaAmountText(
      "voxPopuli",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.container.eventMode = "none";
    this.container.addChild(this.shards.container, this.glints.container, this.amount.text);
    this.container.filters = [this.bloom];
    if (this.showPane) this.planShatter(host, r);
    if (this.screen) this.pane.filters = [this.paneBloom];
    host.screen.layer.addChild(this.pane);
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / VOX_DURATION_MS, 1);
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    if (t < VOX_PHASES.shatter) this.amount.text.visible = false;
    else this.amount.place(phase(t, VOX_PHASES.shatter, 1), scale, r + lift, false);
    if (t >= 1) {
      this.pane.visible = false;
      if (this.screen?.linger(this.container, r * scale, elapsed - VOX_DURATION_MS))
        return { done: false, frame: REST };
      this.screen?.end();
      return { done: true, frame: REST };
    }
    if (!this.struck && t >= VOX_PHASES.truth) {
      this.struck = true;
      this.host.shockwave(
        this.container,
        r * scale * VOX_SHOCKWAVE.radii,
        VOX_SHOCKWAVE.durationMs,
        {
          amplitude: VOX_SHOCKWAVE.amplitude,
          wavelength: VOX_SHOCKWAVE.wavelength,
        },
      );
    }
    this.drawPane(t, elapsed / 1000, r, scale);
    this.shards.update(elapsed / 1000);
    this.glints.update(elapsed / 1000);
    this.screen?.step(
      t,
      this.container,
      { x: this.middle.x * scale, y: this.middle.y * scale },
      { x: this.middle.x * scale, y: (this.middle.y + this.paneY) * scale },
      r * scale,
    );
    return { done: false, frame: this.quake(t, elapsed / 1000, r) };
  }

  destroy(): void {
    this.screen?.end();
    this.pane.filters = [];
    this.paneBloom.destroy();
    this.paneEnergy.destroy();
    this.pane.destroy({ children: true });
    this.container.filters = [];
    this.bloom.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The target trembles more and more while people believe, is crushed when the window slams down on it, and
   * shudders back.
   */
  private quake(t: number, seconds: number, r: number): IArenaEffectFrame {
    if (t < VOX_PHASES.shatter) {
      const dread = phase(t, VOX_PHASES.believe, VOX_PHASES.truth);
      return { dx: shake(dread, r * 0.03 * dread, 40, 1), dy: 0, scaleX: 1, scaleY: 1 };
    }
    const after = phase(t, VOX_PHASES.shatter, 1);
    const crush = 0.32 * Math.exp(-after * 12);
    const wobble = 0.06 * Math.exp(-after * 6) * Math.sin(seconds * 40);
    return {
      dx: shake(after, r * 0.12, 10, 0.4),
      dy: r * 0.25 * Math.exp(-after * 10),
      scaleX: 1 + crush * 0.8 + wobble,
      scaleY: 1 - crush - wobble,
    };
  }

  /**
   * The rumor window: it appears dark, panes light up one by one as people believe (the leading burns red-hot
   * as each one catches, then glows), a slow reflection keeps sliding over the glass; at the truth it flashes
   * white and slams down on the target, and at the shatter it is gone (the shards take over).
   */
  private drawPane(t: number, seconds: number, r: number, scale: number): void {
    if (!this.showPane || t >= VOX_PHASES.shatter) {
      this.pane.visible = false;
      return;
    }
    const appear = easeOutBack(phase(t, VOX_PHASES.dark, VOX_PHASES.pane));
    if (appear <= 0) {
      this.pane.visible = false;
      return;
    }
    this.pane.visible = true;
    const slam = phase(t, VOX_PHASES.truth + 0.012, VOX_PHASES.shatter) ** 2;
    const anchor = this.host.screen.toScreen(this.container);
    const lift = this.paneY * (1 - slam) + r * 0.2 * slam;
    const size = scale * this.grow;
    this.pane.position.set(
      anchor.x + this.middle.x * scale,
      anchor.y + (this.middle.y + lift) * scale,
    );
    this.pane.scale.set(appear * (1 - slam * 0.35) * size, appear * (1 - slam * 0.5) * size);
    this.pane.alpha = Math.min(appear, 1);
    this.drawGlass(t, seconds, r, scale);
    const belief = phase(t, VOX_PHASES.connect, VOX_PHASES.truth);
    this.paneEnergy.update(seconds, {
      alpha:
        phase(t, VOX_PHASES.connect - 0.02, VOX_PHASES.connect + 0.06) * (0.45 + 0.55 * belief),
    });
    const sweep = ((seconds * 0.35) % 1.4) - 0.2;
    this.shine.x = sweep * r * VOX_PANE.width * 1.6;
    const reveal = phase(t, VOX_PHASES.truth, VOX_PHASES.truth + 0.03);
    if (reveal !== this.paneCrackReveal) {
      this.paneCrackReveal = reveal;
      strokeFracture(
        this.paneCracks.clear(),
        this.paneFracture,
        reveal,
        1,
        Math.max(r * 0.03, 1 / scale),
      );
    }
    const flash = 1 - phase(t, VOX_PHASES.truth, VOX_PHASES.truth + 0.04);
    this.paneFlash.alpha = t >= VOX_PHASES.truth ? 0.9 * flash : 0;
  }

  /**
   * The glass and its leading, redrawn only when a pane is catching (or the shimmer of the lit ones moves a
   * step): the dim panes, the lit ones with a brighter heart, and the leading burning red-hot as each catches.
   */
  private drawGlass(t: number, seconds: number, r: number, scale: number): void {
    const span = VOX_PHASES.truth - VOX_PHASES.connect;
    const lits = this.cells.map((cell) => {
      const at = VOX_PHASES.connect + cell.order * span * 0.94;
      return phase(t, at, at + 0.035);
    });
    const shimmer = Math.round(seconds * 12);
    const believe = phase(t, VOX_PHASES.connect, VOX_PHASES.truth);
    const key = `${lits.map((lit) => lit.toFixed(2)).join(",")}|${shimmer}|${believe.toFixed(2)}|${scale.toFixed(3)}`;
    if (key === this.glassKey) return;
    this.glassKey = key;
    const glass = this.glass.clear();
    const lead = this.lead.clear();
    const leadWidth = Math.max(r * 0.05, 1.4 / scale);
    const pulse = shimmer / 12;
    glass.poly(this.outline).fill({ color: VOX_COLORS.darkGlass, alpha: 0.92 });
    this.cells.forEach((cell, index) => {
      const lit = lits[index] ?? 0;
      const dim = mixColor(VOX_COLORS.darkGlass, cell.color, 0.18);
      glass
        .poly(cell.points)
        .fill({ color: lit > 0 ? mixColor(dim, cell.color, lit) : dim, alpha: 0.95 });
      if (lit > 0) {
        const inner = cell.points.map((value, at) =>
          at % 2 === 0
            ? cell.centroid.x + (value - cell.centroid.x) * 0.55
            : cell.centroid.y + (value - cell.centroid.y) * 0.55,
        );
        glass.poly(inner).fill({
          color: mixColor(cell.color, VOX_COLORS.white, 0.45),
          alpha: 0.4 * lit * (0.85 + 0.15 * Math.sin(pulse * 6 + cell.order * 20)),
        });
      }
      const catching = lit > 0 && lit < 1 ? 1 - lit : 0;
      lead.poly(cell.points).stroke({ width: leadWidth, color: VOX_COLORS.lead, alpha: 0.95 });
      if (lit > 0)
        lead.poly(cell.points).stroke({
          width: leadWidth * (0.55 + catching * 1.6),
          color: mixColor(VOX_COLORS.ruby, VOX_COLORS.white, catching),
          alpha: 0.55 + 0.45 * catching,
        });
    });
    lead.poly(this.outline).stroke({ width: leadWidth * 2.2, color: VOX_COLORS.lead });
    lead.poly(this.outline).stroke({
      width: leadWidth * 0.8,
      color: VOX_COLORS.blood,
      alpha: 0.6 + 0.4 * believe,
    });
  }

  /** The two bands of reflected light over the glass, drawn once and slid by position. */
  private drawShine(r: number): void {
    const width = r * VOX_PANE.width;
    const height = r * VOX_PANE.height;
    const x = -width / 2;
    this.shine
      .poly([
        x,
        -height / 2,
        x + width * 0.22,
        -height / 2,
        x - width * 0.3,
        height / 2,
        x - width * 0.52,
        height / 2,
      ])
      .fill({ color: VOX_COLORS.white, alpha: 0.1 });
    const thin = x + width * 0.34;
    this.shine
      .poly([
        thin,
        -height / 2,
        thin + width * 0.05,
        -height / 2,
        thin - width * 0.47,
        height / 2,
        thin - width * 0.52,
        height / 2,
      ])
      .fill({ color: VOX_COLORS.blush, alpha: 0.16 });
  }

  /** The shatter: every pane breaks into shards of its own glass that fly, spin and catch the light. */
  private planShatter(host: IArenaFxHost, r: number): void {
    const random = this.random;
    const frames = host.textures;
    const seconds = VOX_DURATION_MS / 1000;
    const born = VOX_PHASES.shatter * seconds;
    for (const cell of this.cells) {
      for (let index = 0; index < VOX_SHARDS_PER_CELL; index += 1) {
        const from = {
          x: this.middle.x + cell.centroid.x * 0.6 * this.grow,
          y: this.middle.y + (cell.centroid.y * 0.5 + r * 0.3) * this.grow,
        };
        const angle = Math.atan2(from.y, from.x) + (random() - 0.5) * 1.2;
        const speed = r * (3 + random() * 6);
        const size = r * (0.16 + random() * 0.22);
        const spin = (random() - 0.5) * 22;
        const glint = random() * 10;
        this.shards.add({
          texture: frames.shard,
          spawn: {
            ...from,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - r * 2,
            drag: 1.5,
            gravity: r * 9,
            born,
            life: 0.9 + random() * 0.5,
          },
          look: {
            size: () => size,
            height: (l) => size * (0.5 + 0.5 * Math.abs(Math.cos(l * 9 + glint))),
            alpha: (l) => 1 - phase(l, 0.7, 1),
            tint: (l) =>
              Math.sin(l * 26 + glint) > 0.85
                ? VOX_COLORS.white
                : mixColor(cell.color, VOX_COLORS.blood, l),
            rotation: (age) => glint + age * spin,
          },
        });
      }
    }
    for (let index = 0; index < VOX_GLINTS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (4 + random() * 7);
      const size = r * (0.08 + random() * 0.1);
      const flicker = random() * 10;
      this.glints.add({
        texture: frames.spark,
        spawn: {
          x: 0,
          y: r * 0.2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - r,
          drag: 3,
          gravity: r * 3,
          born,
          life: 0.6 + random() * 0.5,
        },
        look: {
          size: () => size,
          alpha: (l) => (1 - l) * (0.5 + 0.5 * Math.sin(l * 34 + flicker)),
          tint: (l) => mixStops([VOX_COLORS.white, VOX_COLORS.blush, VOX_COLORS.ruby], l),
        },
      });
    }
  }
}
