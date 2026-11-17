import { ColorMatrixFilter, Container, Graphics } from "pixi.js";
import { RGBSplitFilter } from "pixi-filters";

import { ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";
import {
  ArenaEnergyFluid,
  ArenaEnergyTendril,
  FLUID_LINGER_MS,
} from "@/modules/arena/services/arenaEnergyFluid";
import { paintFalloff } from "@/modules/arena/services/arenaFxScreen";
import { ArenaGlassShatterFilter } from "@/modules/arena/services/arenaGlassShatter";
import {
  ARENA_FX_FADE_FROM,
  mixStops,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

import {
  VOX_BLOOD_MATRIX,
  VOX_BELIEF_CHANNELS,
  VOX_COLORS,
  VOX_DURATION_MS,
  VOX_FLUID_PALETTES,
  VOX_IDENTITY_MATRIX,
  VOX_PHASES,
  VOX_SCREEN_SHARDS,
  VOX_VERDICT_CHANNELS,
} from "../../arenaVoxPopuliEffect.constants";
import type { IScreenShard, IVoxScreen } from "../../arenaVoxPopuliEffect.types";

/**
 * The screen part of "Vox Populi": the silence (a darkness closing around the target and the map in blood-red
 * monochrome), belief pouring in from the edges in threads of red energy, and at the truth the screen itself
 * breaking like glass (a filter on the world), a sweep of reflected light, colors splitting and big shards flying
 * at the viewer.
 */
export class VoxScreen implements IVoxScreen {
  private readonly root = new Container();
  private readonly dark = new Graphics();
  private readonly flying = new Graphics();
  private readonly sweep = new Graphics();
  private readonly tint = new ColorMatrixFilter();
  private readonly split = new RGBSplitFilter({
    red: { x: 0, y: 0 },
    green: { x: 0, y: 0 },
    blue: { x: 0, y: 0 },
  });
  private readonly glass = new ArenaGlassShatterFilter({
    edge: VOX_COLORS.blush,
    glow: VOX_COLORS.ruby,
    seed: 4,
  });
  private reach = 1;
  private impact: IArenaPoint2 = { x: 0, y: 0 };
  private readonly shards: IScreenShard[] = [];
  private planned = false;
  private readonly channels = new Container();
  private fluid: ArenaEnergyFluid | null = null;
  private readonly fluidLayer = new Container();
  private fluidSeconds = 0;
  private pane: IArenaPoint2 = HERE;
  private readonly belief: ArenaEnergyTendril[] = [];
  private readonly verdict: ArenaEnergyTendril[] = [];
  private focus: IArenaPoint2 = HERE;
  private size = 1;
  private darkTall = 1;
  private field: IArenaFxField = { x: 0, y: 0, width: 1, height: 1, diagonal: 1 };
  private breaking = false;
  private splitting = false;
  private ended = false;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly random: () => number,
  ) {
    this.sweep.blendMode = "add";
    this.root.addChild(this.dark, this.channels, this.flying, this.sweep);
    host.screen.layer.addChild(this.root);
    host.screen.layer.addChild(this.fluidLayer);
  }

  step(
    t: number,
    origin: Container,
    focus: IArenaPoint2,
    paneOffset: IArenaPoint2,
    r: number,
  ): void {
    this.host.screen.fitWorldFilters();
    const anchor = this.host.screen.toScreen(origin);
    if (!this.planned) {
      this.planned = true;
      this.host.screen.addWorldFilter(this.tint);
      this.size = r;
      const field = this.host.screen.field();
      this.field = { ...field, x: field.x - anchor.x, y: field.y - anchor.y };
      this.focus = focus;
      this.plan(focus, paneOffset, this.field, r);
    }
    this.root.position.set(anchor.x, anchor.y);
    this.root.scale.set(r / this.size);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const silence = phase(t, 0, VOX_PHASES.dark) * (1 - phase(t, VOX_PHASES.settle, 1));
    this.placeDark(silence, t);
    this.tint.matrix = VOX_IDENTITY_MATRIX.map(
      (value, index) => value + ((VOX_BLOOD_MATRIX[index] ?? 0) - value) * 0.7 * silence,
    ) as ColorMatrixFilter["matrix"];
    this.runFlows(t);
    this.drawFlying(t, this.focus, this.field);
    this.drawSweep(t, this.field);
    this.drawSplit(t);
    this.breakGlass(t, anchor, r);
  }

  /**
   * Once the spell is over only its fluid is left: everything else (the last, nearly faded frame of the screen
   * part and its filters on the world) goes at once.
   */
  private rest(): void {
    if (!this.root.visible) return;
    this.root.visible = false;
    for (const filter of [this.tint, this.split, this.glass])
      this.host.screen.removeWorldFilter(filter);
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.host.screen.removeWorldFilter(this.tint);
    this.host.screen.removeWorldFilter(this.split);
    this.host.screen.removeWorldFilter(this.glass);
    this.glass.destroy();
    this.tint.destroy();
    this.split.destroy();
    for (const channel of [...this.belief, ...this.verdict]) channel.destroy();
    this.fluid?.destroy();
    this.fluidLayer.destroy({ children: true });
    this.root.destroy({ children: true });
  }

  /**
   * The silence: the world sinks into a half darkness around a tall soft opening over the target and the rumor
   * window above it, its edge pulsing in red, breathing a little (drawn once, moved and faded).
   */
  private placeDark(amount: number, t: number): void {
    this.dark.visible = amount > 0;
    if (amount <= 0) return;
    const breathe = 1 + 0.03 * Math.sin(t * 40);
    this.dark.scale.set(breathe, breathe * this.darkTall);
    this.dark.alpha = amount * (0.92 + 0.08 * Math.sin(t * 60));
  }

  /**
   * The cracks of reality: the screen itself breaks like a pane of glass hit at the target (a filter on the
   * world). Cracks race out from a flashing impact, the shards shift the map behind them and catch the light,
   * come apart a little as the rumor window shatters, and close again as reality settles.
   */
  private breakGlass(t: number, anchor: IArenaPoint2, r: number): void {
    const reveal = phase(t, VOX_PHASES.truth, VOX_PHASES.truth + 0.07);
    const fade = 1 - phase(t, VOX_PHASES.settle - 0.05, 1);
    if (reveal <= 0 || fade <= 0) {
      if (this.breaking) {
        this.breaking = false;
        this.host.screen.removeWorldFilter(this.glass);
      }
      return;
    }
    if (!this.breaking) {
      this.breaking = true;
      this.host.screen.addWorldFilter(this.glass);
    }
    const scale = r / this.size;
    this.glass.update({
      center: { x: anchor.x + this.impact.x * scale, y: anchor.y + this.impact.y * scale },
      unit: r,
      reach: this.reach * (1 - (1 - reveal) ** 2),
      amount: fade,
      breakup: phase(t, VOX_PHASES.shatter, VOX_PHASES.shatter + 0.08),
      flash: 1 - phase(t, VOX_PHASES.truth, VOX_PHASES.truth + 0.05),
      seconds: (t * VOX_DURATION_MS) / 1000,
    });
  }

  /** Big shards flying out of the screen at the viewer: growing, turning, fading. */
  private drawFlying(t: number, center: IArenaPoint2, field: IArenaFxField): void {
    const g = this.flying.clear();
    const since = (t - VOX_PHASES.shatter) * VOX_DURATION_MS;
    if (since < 0) return;
    const diagonal = field.diagonal;
    for (const shard of this.shards) {
      const life = (since - shard.delay) / 900;
      if (life < 0 || life >= 1) continue;
      const travel = diagonal * 0.55 * shard.speed * life ** 0.8;
      const position = {
        x: center.x + Math.cos(shard.angle) * travel,
        y: center.y + Math.sin(shard.angle) * travel,
      };
      const grow = 1 + life * 5;
      const turn = shard.spin * life;
      const cos = Math.cos(turn);
      const sin = Math.sin(turn);
      const points = shard.points.flatMap((point) => [
        position.x + (point.x * cos - point.y * sin) * grow,
        position.y + (point.x * sin + point.y * cos) * grow,
      ]);
      const alpha = (1 - life) * Math.min(life * 10, 1);
      const [p0x = 0, p0y = 0, p1x = 0, p1y = 0, p2x = 0, p2y = 0] = points;
      g.poly(points)
        .fill({
          color: mixStops([VOX_COLORS.white, VOX_COLORS.rose, VOX_COLORS.ruby], shard.tone),
          alpha: 0.35 * alpha,
        })
        .stroke({ width: 1.5, color: VOX_COLORS.white, alpha: 0.8 * alpha });
      const glint = Math.max(0, Math.sin(life * 18 + shard.tone * 6));
      g.poly([p0x, p0y, (p0x + p1x) / 2, (p0y + p1y) / 2, (p0x + p2x) / 2, (p0y + p2y) / 2]).fill({
        color: VOX_COLORS.white,
        alpha: 0.45 * alpha * glint,
      });
    }
  }

  /** A sweep of reflected light across the whole screen at the truth, like a pane of glass turning. */
  private drawSweep(t: number, field: IArenaFxField): void {
    const g = this.sweep.clear();
    const life = phase(t, VOX_PHASES.truth + 0.01, VOX_PHASES.truth + 0.12);
    if (life <= 0 || life >= 1) return;
    const { x: left, y: top, width, height } = field;
    const x = left - width * 0.4 + life * width * 1.8;
    const band = width * 0.18;
    const bottom = top + height;
    g.poly([x, top, x + band, top, x + band - height * 0.5, bottom, x - height * 0.5, bottom]).fill(
      {
        color: VOX_COLORS.blush,
        alpha: 0.22 * Math.sin(Math.PI * life),
      },
    );
  }

  /** Colors split apart at the truth and slowly come back together. */
  private drawSplit(t: number): void {
    const amount =
      phase(t, VOX_PHASES.truth, VOX_PHASES.truth + 0.005) *
      (1 - phase(t, VOX_PHASES.truth, VOX_PHASES.settle));
    if (amount <= 0) {
      if (this.splitting) {
        this.splitting = false;
        this.host.screen.removeWorldFilter(this.split);
      }
      return;
    }
    if (!this.splitting) {
      this.splitting = true;
      this.host.screen.addWorldFilter(this.split);
    }
    const offset = 14 * amount * (0.7 + 0.3 * Math.sin(t * 300));
    this.split.red = { x: -offset, y: offset * 0.3 };
    this.split.green = { x: 0, y: 0 };
    this.split.blue = { x: offset, y: -offset * 0.3 };
  }

  /** The darkness, the cracks, the flying shards and the channels of energy, planned once the screen point is known. */
  private plan(center: IArenaPoint2, pane: IArenaPoint2, field: IArenaFxField, r: number): void {
    const random = this.random;
    const opening = { x: (center.x + pane.x) / 2, y: (center.y + pane.y) / 2 - r * 0.4 };
    const rx = r * 2.8;
    const ry = Math.abs(center.y - pane.y) * 0.5 + r * 3.6;
    this.darkTall = ry / rx;
    this.dark.position.set(opening.x, opening.y);
    paintFalloff(
      this.dark,
      0,
      0,
      rx,
      Math.max(field.diagonal * 1.1 * (rx / ry), rx * 3),
      VOX_COLORS.night,
      0.5,
    );
    this.dark
      .circle(0, 0, rx)
      .stroke({ width: Math.max(r * 0.05, 2), color: VOX_COLORS.blood, alpha: 0.35 });
    this.impact = center;
    this.reach = (field.diagonal * 0.8) / r;
    this.planFlows(center, pane, field, r);
    for (let index = 0; index < VOX_SCREEN_SHARDS; index += 1) {
      const size = r * (0.25 + random() * 0.35);
      const points = [0, 1, 2].map((corner) => {
        const a = (corner / 3) * Math.PI * 2 + random() * 1.2;
        return {
          x: Math.cos(a) * size * (0.6 + random() * 0.6),
          y: Math.sin(a) * size * (0.6 + random() * 0.6),
        };
      });
      this.shards.push({
        points,
        angle: random() * Math.PI * 2,
        speed: 0.6 + random() * 0.6,
        spin: (random() - 0.5) * 8,
        delay: random() * 120,
        tone: random(),
      });
    }
  }

  /**
   * Red energy flowing in channels: belief pours in from beyond the edges of the screen through long swaying
   * channels into the rumor window while people believe, and when it becomes true the verdict runs down from the
   * window onto the targets.
   */
  private runFlows(t: number): void {
    const seconds = (t * VOX_DURATION_MS) / 1000;
    this.belief.forEach((channel, index) => {
      const start = VOX_PHASES.believe + index * 0.025;
      channel.update(seconds, {
        head: phase(t, start, start + 0.16),
        tail: phase(t, VOX_PHASES.truth - 0.03, VOX_PHASES.truth + 0.05),
        alpha: 0.9,
      });
    });
    this.verdict.forEach((channel, index) => {
      const start = VOX_PHASES.truth + index * 0.008;
      channel.update(seconds, {
        head: phase(t, start, start + 0.035),
        tail: phase(t, VOX_PHASES.shatter, VOX_PHASES.shatter + 0.08),
        alpha: 1,
      });
    });
    this.runFluid(t);
  }

  /** Lays out the channels of energy (see `runFlows`) once the window and the targets are known. */
  private planFlows(
    center: IArenaPoint2,
    pane: IArenaPoint2,
    field: IArenaFxField,
    r: number,
  ): void {
    this.pane = pane;
    this.fluid = new ArenaEnergyFluid(this.host, {
      area: { x: field.x, y: field.y, width: field.width, height: field.height },
      palette: ENERGY_PALETTES.scarlet,
      decay: 0.45,
      turbulence: { scale: r * 2.2, force: r * 7 },
      vorticity: 34,
      gain: 1.25,
      seed: 9,
    });
    const fluid = this.fluid;
    this.fluidLayer.addChild(fluid.view);
    const reach = field.diagonal * 0.55;
    for (let index = 0; index < VOX_BELIEF_CHANNELS; index += 1) {
      const angle = (index / VOX_BELIEF_CHANNELS) * Math.PI * 2 + 0.4;
      const from = { x: pane.x + Math.cos(angle) * reach, y: pane.y + Math.sin(angle) * reach };
      const channel = new ArenaEnergyTendril(fluid, {
        palette: VOX_FLUID_PALETTES[index % VOX_FLUID_PALETTES.length] ?? ENERGY_PALETTES.blood,
        from,
        to: pane,
        bend: (index % 2 === 0 ? 1 : -1) * (0.12 + (index % 3) * 0.06),
        width: r * 0.4,
        speed: 260,
        grain: 110,
        strands: 4,
        seed: index * 11 + 5,
      });
      this.belief.push(channel);
      this.channels.addChild(channel.view);
    }
    for (let index = 0; index < VOX_VERDICT_CHANNELS; index += 1) {
      const channel = new ArenaEnergyTendril(fluid, {
        palette: index % 2 === 0 ? ENERGY_PALETTES.scarlet : ENERGY_PALETTES.blood,
        from: pane,
        to: center,
        bend: (index - (VOX_VERDICT_CHANNELS - 1) / 2) * 0.28,
        width: r * (index === Math.floor(VOX_VERDICT_CHANNELS / 2) ? 0.6 : 0.4),
        speed: 380,
        grain: 120,
        strands: 4,
        seed: index * 17 + 3,
      });
      this.verdict.push(channel);
      this.channels.addChild(channel.view);
    }
  }

  /**
   * The red fluid the channels pour their ink into: while people believe it is drawn into the rumor window,
   * swirling; once it is true it runs down from the window onto the targets and lingers a little longer.
   */
  private runFluid(t: number): void {
    const fluid = this.fluid;
    if (!fluid) return;
    const seconds = (t * VOX_DURATION_MS) / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const r = this.size;
    const dx = this.focus.x - this.pane.x;
    const dy = this.focus.y - this.pane.y;
    const length = Math.hypot(dx, dy) || 1;
    const truth = t >= VOX_PHASES.truth;
    fluid.update(delta, {
      inject: 3.2,
      alpha: 1,
      decay: truth ? 0.55 : 0.45,
      bias: truth
        ? {
            center: this.focus,
            radial: -r * 1,
            swirl: r * 2.4,
            drift: { x: (dx / length) * r * 4.5, y: (dy / length) * r * 4.5 },
          }
        : { center: this.pane, radial: -r * 2.6, swirl: r * 2.8 },
    });
  }

  linger(origin: Container, r: number, since: number): boolean {
    const fluid = this.fluid;
    if (!fluid || this.ended) return false;
    this.rest();
    const anchor = this.host.screen.toScreen(origin);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    const seconds = VOX_DURATION_MS / 1000 + since / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    fluid.update(delta, {
      inject: 0,
      decay: 0.4,
      alpha: 1 - phase(since, FLUID_LINGER_MS - 500, FLUID_LINGER_MS),
    });
    return since < FLUID_LINGER_MS;
  }
}
