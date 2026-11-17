import { ColorMatrixFilter, Container, Graphics, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  ArenaButterflySwarm,
  curvePoint,
  easeInOut,
} from "@/modules/arena/services/arenaButterflySwarm";
import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
  type IEnergyFlowOptions,
} from "@/modules/arena/services/arenaEnergyFlow";
import {
  ArenaEnergyFluid,
  ArenaEnergyTendril,
  FLUID_LINGER_MS,
} from "@/modules/arena/services/arenaEnergyFluid";
import { paintFalloff, paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import { ArenaSoundWaveFilter } from "@/modules/arena/services/arenaSoundWave";
import {
  ARENA_FX_FADE_FROM,
  easeOutBack,
  groupShape,
  mixColor,
  mixStops,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  BETWEEN_ARM_POINTS,
  BETWEEN_ARMS,
  BETWEEN_COLORS,
  BETWEEN_DROPLETS,
  BETWEEN_DROWN_MATRIX,
  BETWEEN_DURATION_MS,
  BETWEEN_EYES,
  BETWEEN_FLOOR_TILT,
  BETWEEN_FOREWING,
  BETWEEN_GROUP_GROWTH,
  BETWEEN_GROUP_MAX,
  BETWEEN_HINDWING,
  BETWEEN_IDENTITY_MATRIX,
  BETWEEN_OUTLINE_POINTS,
  BETWEEN_PHASES,
  BETWEEN_SPLASH_RINGS,
  BETWEEN_SPRAY,
  BETWEEN_STREAMS,
  BETWEEN_STREAMS_MAX,
  BETWEEN_VEINS,
  BETWEEN_VORTEX,
  BETWEEN_WING_BUTTERFLIES,
  BETWEEN_WINGS_LIFT,
  BETWEEN_WINGSPAN,
} from "../../arenaBetweenWorldsEffect.constants";
import type {
  IBetweenArm,
  IBetweenEye,
  IBetweenScreen,
} from "../../arenaBetweenWorldsEffect.types";
import {
  passageRipplePlan,
  passageRipples,
  smoothLoop,
  spiralPoint,
  wingSlots,
  wingSpread,
} from "../../arenaBetweenWorldsEffect.utils";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

/** The right wing first, then the left one (its mirror). */
const SIDES = [1, -1] as const;

/**
 * The screen part of "Entre os mundos", Antropozohl's ultimate, made with the energy kit: the world sinks into deep
 * water (dark and blue, rings of water rippling the map); currents of water stream in from beyond the screen
 * carrying a swarm of dark blue and white butterflies, which whirls around the target; out of the swarm the wings
 * of the god unfold above it (dark wings with veins and rims of pale light, butterflies settling all over them)
 * and the eyes on them open and stare at the target; the water under it turns into a whirlpool of living dark
 * water, the passage, pulling it in; the wings clap shut, the target is dragged through and spat back in a column
 * of water that throws drops all around, while the swarm bursts and scatters. The dark water keeps flowing up and
 * fades by itself after the spell (`linger`).
 */
export class PassageScreen implements IBetweenScreen {
  private readonly root = new Container();
  private readonly fluidLayer = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.42,
    bloomScale: 0.75,
    blur: 6,
    quality: 3,
  });
  private readonly drown = new ColorMatrixFilter();
  private readonly ripples = new ArenaSoundWaveFilter({ tint: BETWEEN_COLORS.sky, push: 0.5 });
  private readonly ripplePlan = passageRipplePlan();
  private readonly shade = new Graphics();
  private readonly flash = new Graphics();
  private readonly maw = new Graphics();
  private readonly mawGlow: Sprite;
  private readonly rims: ArenaEnergyFlow[];
  private readonly mawInk: ArenaEnergyFlow;
  private readonly arms: IBetweenArm[] = [];
  private readonly splashRings: ArenaEnergyFlow[] = [];
  private readonly beam: Sprite;
  private readonly beamCore: Sprite;
  private readonly column: ArenaEnergyFlow;
  private readonly columnInk: ArenaEnergyFlow;
  private readonly streamsLayer = new Container();
  private readonly streams: ArenaEnergyTendril[] = [];
  private readonly wings = new Container();
  private readonly wingSides: Container[] = [];
  private readonly wingFlows: ArenaEnergyFlow[] = [];
  private readonly body: ArenaEnergyFlow;
  private readonly bodyLight: ArenaEnergyFlow;
  private readonly antennae: ArenaEnergyFlow[] = [];
  private readonly headEyes: Sprite[];
  private readonly eyes: IBetweenEye[] = [];
  private readonly swarm: ArenaButterflySwarm;
  private readonly water: ArenaFxParticles;
  private fluid: ArenaEnergyFluid | null = null;
  private fluidSeconds = 0;
  private planned = false;
  private rippling = false;
  private grow = 1;
  private middle: IArenaPoint2 = HERE;
  private size = 1;
  private top = 0;
  private ended = false;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly random: () => number,
    private readonly group?: IArenaPoint2[],
  ) {
    const { width, height } = host.screen.size();
    const diagonal = Math.hypot(width, height);
    this.swarm = new ArenaButterflySwarm(host.textures, diagonal);
    this.water = new ArenaFxParticles(diagonal, "add");
    this.mawGlow = this.glow(BETWEEN_COLORS.blue);
    this.beam = this.beamSprite(BETWEEN_COLORS.sky);
    this.beamCore = this.beamSprite(BETWEEN_COLORS.white);
    this.headEyes = [this.glow(BETWEEN_COLORS.white), this.glow(BETWEEN_COLORS.white)];
    this.rims = [ENERGY_PALETTES.tide, ENERGY_PALETTES.abyss].map(
      (palette, index) =>
        new ArenaEnergyFlow({
          palette,
          speed: index === 0 ? 420 : -300,
          sharpness: 3,
          strands: 4,
          closed: true,
          samples: 64,
          seed: 11 + index * 7,
        }),
    );
    this.mawInk = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.abyss,
      speed: 200,
      closed: true,
      samples: 48,
      seed: 5,
    });
    for (let index = 0; index < BETWEEN_ARMS; index += 1)
      this.arms.push({
        water: this.flow({
          palette: index % 2 === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
          speed: 520,
          grain: 60,
          sharpness: 3.5,
          strands: 3,
          feather: 0.6,
          samples: BETWEEN_ARM_POINTS,
          seed: 40 + index * 3,
        }),
        ink: this.flow({
          palette: ENERGY_PALETTES.abyss,
          speed: 240,
          grain: 60,
          sharpness: 1.5,
          strands: 2,
          feather: 1,
          samples: BETWEEN_ARM_POINTS,
          seed: 60 + index * 3,
        }),
      });
    for (let index = 0; index < BETWEEN_SPLASH_RINGS; index += 1)
      this.splashRings.push(
        new ArenaEnergyFlow({
          palette: index === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
          speed: 300,
          sharpness: 3,
          strands: 4,
          feather: 0.5,
          closed: true,
          samples: 64,
          seed: 70 + index * 5,
        }),
      );
    this.column = this.flow({
      palette: ENERGY_PALETTES.tide,
      speed: 760,
      grain: 120,
      sharpness: 2.6,
      strands: 6,
      feather: 0.6,
      samples: 24,
      seed: 81,
    });
    this.columnInk = this.flow({
      palette: ENERGY_PALETTES.abyss,
      speed: 400,
      grain: 90,
      sharpness: 1.4,
      strands: 2,
      feather: 1,
      samples: 24,
      seed: 83,
    });
    this.body = this.flow({
      palette: ENERGY_PALETTES.depths,
      blend: "normal",
      density: 3.2,
      speed: 80,
      grain: 60,
      sharpness: 1.2,
      strands: 2,
      feather: 0.8,
      samples: 24,
      seed: 91,
    });
    this.bodyLight = this.flow({
      palette: ENERGY_PALETTES.tide,
      speed: 260,
      grain: 40,
      sharpness: 4.5,
      strands: 2,
      feather: 0.3,
      samples: 24,
      seed: 93,
    });
    this.flash.blendMode = "add";
    this.wings.visible = false;
    this.root.addChild(
      this.shade,
      this.mawGlow,
      this.maw,
      ...this.rims.map((ring) => ring.mesh),
      ...this.arms.map((arm) => arm.water.mesh),
      ...this.splashRings.map((ring) => ring.mesh),
      this.streamsLayer,
      this.beam,
      this.column.mesh,
      this.beamCore,
      this.wings,
      this.swarm.container,
      this.water.container,
      this.flash,
    );
    this.bloom.resolution = 1;
    this.root.filters = [this.bloom];
    host.screen.layer.addChild(this.fluidLayer);
    host.screen.layer.addChild(this.root);
  }

  step(t: number, origin: Container, r: number): void {
    this.host.screen.fitWorldFilters();
    const anchor = this.host.screen.toScreen(origin);
    if (!this.planned) {
      this.planned = true;
      this.host.screen.addWorldFilter(this.drown);
      this.size = r;
      const shape = groupShape(this.group);
      this.grow = Math.min(Math.max(shape.spread * BETWEEN_GROUP_GROWTH, 1), BETWEEN_GROUP_MAX);
      this.middle = { x: shape.center.x * r, y: shape.center.y * r };
      const targets = (this.group ?? [HERE]).map((point) => ({ x: point.x * r, y: point.y * r }));
      const field = this.host.screen.field();
      this.plan(targets, { ...field, x: field.x - anchor.x, y: field.y - anchor.y });
    }
    const zoom = r / this.size;
    for (const layer of [this.root, this.fluidLayer]) {
      layer.position.set(anchor.x, anchor.y);
      layer.scale.set(zoom);
    }
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const center = this.middle;
    const big = this.size * this.grow;
    const seconds = (t * BETWEEN_DURATION_MS) / 1000;
    const depth = phase(t, 0, BETWEEN_PHASES.drown) * (1 - phase(t, BETWEEN_PHASES.settle, 1));
    this.drown.matrix = BETWEEN_IDENTITY_MATRIX.map(
      (value, index) => value + ((BETWEEN_DROWN_MATRIX[index] ?? 0) - value) * 0.85 * depth,
    ) as ColorMatrixFilter["matrix"];
    this.shade.alpha = depth;
    this.runRipples(t, anchor, zoom, center, big);
    this.runStreams(t, seconds);
    this.placeWings(t, seconds);
    this.placeWhirlpool(t, seconds, center, big);
    this.runSurge(t, seconds, center, big);
    this.runFluid(t, seconds, center, big);
    this.flash.alpha =
      t >= BETWEEN_PHASES.hit
        ? 0.75 * (1 - phase(t, BETWEEN_PHASES.hit, BETWEEN_PHASES.hit + 0.05))
        : 0;
    this.swarm.update(seconds);
    this.water.update(seconds);
  }

  linger(origin: Container, r: number, since: number): boolean {
    const fluid = this.fluid;
    if (!fluid || this.ended) return false;
    if (this.root.visible) {
      this.root.visible = false;
      this.host.screen.removeWorldFilter(this.drown);
      this.stopRipples();
    }
    const anchor = this.host.screen.toScreen(origin);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    const seconds = BETWEEN_DURATION_MS / 1000 + since / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    fluid.update(delta, {
      inject: 0,
      decay: 0.42,
      alpha: 1 - phase(since, FLUID_LINGER_MS - 500, FLUID_LINGER_MS),
      bias: { drift: { x: 0, y: -this.size * this.grow * 3 } },
    });
    return since < FLUID_LINGER_MS;
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.host.screen.removeWorldFilter(this.drown);
    this.stopRipples();
    this.drown.destroy();
    this.ripples.destroy();
    this.root.filters = [];
    this.bloom.destroy();
    for (const tendril of this.streams) tendril.destroy();
    const inks = [this.mawInk, this.columnInk, ...this.arms.map((arm) => arm.ink)];
    for (const ink of inks) ink.mesh.removeFromParent();
    for (const flow of [
      ...inks,
      ...this.rims,
      ...this.arms.map((arm) => arm.water),
      ...this.splashRings,
      this.column,
      this.body,
      this.bodyLight,
      ...this.antennae,
      ...this.wingFlows,
    ])
      flow.destroy();
    this.swarm.destroy();
    this.fluid?.destroy();
    this.fluidLayer.destroy({ children: true });
    this.root.destroy({ children: true });
  }

  /** The rings of water on the map (a filter on the world), only while one is alive. */
  private runRipples(
    t: number,
    anchor: IArenaPoint2,
    zoom: number,
    center: IArenaPoint2,
    big: number,
  ): void {
    const waves = passageRipples(t, this.ripplePlan);
    if (waves.length === 0) {
      this.stopRipples();
      return;
    }
    if (!this.rippling) {
      this.rippling = true;
      this.host.screen.addWorldFilter(this.ripples);
    }
    this.ripples.update({
      origin: { x: anchor.x + center.x * zoom, y: anchor.y + (center.y + big * 0.35) * zoom },
      direction: { x: 1, y: 0 },
      unit: big * zoom,
      waves,
    });
  }

  private stopRipples(): void {
    if (!this.rippling) return;
    this.rippling = false;
    this.host.screen.removeWorldFilter(this.ripples);
  }

  /** The currents of water streaming in from beyond the screen, then draining once the swarm has come. */
  private runStreams(t: number, seconds: number): void {
    this.streams.forEach((stream, index) => {
      const start = BETWEEN_PHASES.swarm + index * 0.015;
      stream.update(seconds, {
        head: phase(t, start, BETWEEN_PHASES.gather) ** 0.7,
        tail: phase(t, BETWEEN_PHASES.wings, BETWEEN_PHASES.eyes + 0.04),
        alpha: 0.9,
      });
    });
  }

  /**
   * The wings of the god: they unfold out of the swarm, breathe, are raised before the blow and clap shut as it
   * lands, then fall apart; their eyes open one by one, stare at the target, blink, flare at the hit and close.
   */
  private placeWings(t: number, seconds: number): void {
    const shown =
      phase(t, BETWEEN_PHASES.wings, BETWEEN_PHASES.wings + 0.08) *
      (1 - phase(t, BETWEEN_PHASES.hit + 0.01, BETWEEN_PHASES.surge + 0.08));
    this.wings.visible = shown > 0;
    const off = { alpha: 0 };
    if (!this.wings.visible) {
      for (const flow of [this.body, this.bodyLight, ...this.antennae, ...this.wingFlows])
        flow.update(seconds, off);
      return;
    }
    const spread = Math.max(wingSpread(t), 0.02);
    this.wings.alpha = shown;
    this.wingSides.forEach((side, index) => side.scale.set((SIDES[index] ?? 1) * spread, 1));
    for (const flow of this.wingFlows) flow.update(seconds, { alpha: 0.9 });
    this.body.update(seconds, { alpha: 0.95 });
    this.bodyLight.update(seconds, { alpha: 0.8 });
    for (const antenna of this.antennae) antenna.update(seconds, { alpha: 0.85 });
    const W = BETWEEN_WINGSPAN * this.size * this.grow;
    const awake = phase(t, BETWEEN_PHASES.eyes, BETWEEN_PHASES.eyes + 0.03);
    this.headEyes.forEach((eye) => {
      eye.width = eye.height = W * (0.08 + 0.015 * Math.sin(seconds * 13));
      eye.alpha = awake;
    });
    const flare =
      t >= BETWEEN_PHASES.hit ? 1 - phase(t, BETWEEN_PHASES.hit, BETWEEN_PHASES.surge + 0.04) : 0;
    this.eyes.forEach((eye, index) => {
      const opening = phase(
        t,
        BETWEEN_PHASES.eyes + index * 0.012,
        BETWEEN_PHASES.eyes + 0.05 + index * 0.012,
      );
      const blink = Math.max(0, 1 - Math.abs(seconds - eye.blink) / 0.09);
      const closing = phase(t, BETWEEN_PHASES.surge + 0.02, BETWEEN_PHASES.surge + 0.07);
      const open = Math.max(easeOutBack(opening), 0) * (1 - blink) * (1 - closing);
      eye.lid.visible = open > 0.01;
      eye.lid.scale.y = eye.lid.scale.x * Math.min(open, 1.1);
      eye.glow.alpha =
        (0.45 + 0.25 * Math.sin(seconds * 5 + index) + 0.6 * flare) * Math.min(open, 1);
      eye.pupil.scale.set(1 - 0.35 * flare, 1);
    });
  }

  /**
   * The passage: the water under the target turns into a whirlpool of living dark water, a dark maw with rims of
   * pale water and arms winding into it, pulling harder until the target is dragged through; it closes after the
   * target is spat back.
   */
  private placeWhirlpool(t: number, seconds: number, center: IArenaPoint2, big: number): void {
    const opening = phase(t, BETWEEN_PHASES.pull - 0.04, BETWEEN_PHASES.hit - 0.02);
    const closing = phase(t, BETWEEN_PHASES.surge + 0.04, BETWEEN_PHASES.settle);
    const shown = opening * (1 - closing);
    const off = { alpha: 0 };
    this.maw.visible = this.mawGlow.visible = shown > 0;
    if (shown <= 0) {
      for (const flow of [...this.rims, this.mawInk]) flow.update(seconds, off);
      for (const arm of this.arms) {
        arm.water.update(seconds, off);
        arm.ink.update(seconds, off);
      }
      return;
    }
    const gape =
      t >= BETWEEN_PHASES.hit ? 1 - phase(t, BETWEEN_PHASES.hit, BETWEEN_PHASES.surge) : 0;
    const radius = big * 1.5 * (opening ** 0.7 * (1 - closing * 0.7)) * (1 + 0.35 * gape);
    const floor = { x: center.x, y: center.y + big * 0.35 };
    this.maw.position.set(floor.x, floor.y);
    this.maw.scale.set(radius, radius * BETWEEN_FLOOR_TILT);
    this.maw.alpha = 0.92 * shown;
    this.mawGlow.position.set(floor.x, floor.y);
    this.mawGlow.width = radius * 4.2;
    this.mawGlow.height = radius * 4.2 * BETWEEN_FLOOR_TILT;
    this.mawGlow.alpha = (0.35 + 0.5 * gape) * shown;
    const ring = (scale: number) =>
      circlePath(radius * scale, 64, BETWEEN_FLOOR_TILT).map((point) => ({
        x: point.x + floor.x,
        y: point.y + floor.y,
      }));
    this.rims.forEach((rim, index) => {
      rim.setPath(ring(index === 0 ? 1.05 : 1.55), big * (index === 0 ? 0.16 : 0.1));
      rim.update(seconds, { alpha: shown * (index === 0 ? 0.95 : 0.7) });
    });
    this.mawInk.setPath(ring(1.3), big * 0.6);
    this.mawInk.update(seconds, { alpha: shown });
    this.arms.forEach((arm, index) => {
      const start = -seconds * 3.2 + (index / BETWEEN_ARMS) * Math.PI * 2;
      const points = Array.from({ length: BETWEEN_ARM_POINTS }, (_, step) => {
        const point = spiralPoint(
          step / (BETWEEN_ARM_POINTS - 1),
          radius * 2.6,
          radius * 0.25,
          0.85,
          start,
          BETWEEN_FLOOR_TILT,
        );
        return { x: point.x + floor.x, y: point.y + floor.y };
      });
      arm.water.setPath(
        points,
        (along) => big * 0.32 * Math.sin(Math.PI * Math.min(along * 1.2, 1)),
      );
      arm.water.update(seconds, { alpha: shown * 0.9 });
      arm.ink.setPath(points, (along) => big * 0.8 * (1 - along * 0.6));
      arm.ink.update(seconds, { alpha: shown });
    });
  }

  /**
   * The target spat back: a column of water from the passage to the sky (pale beams around a white core, energy
   * running up), rings of water racing out over the floor, and drops thrown all around (planned particles).
   */
  private runSurge(t: number, seconds: number, center: IArenaPoint2, big: number): void {
    const rise = phase(t, BETWEEN_PHASES.hit, BETWEEN_PHASES.surge + 0.02);
    const fade = 1 - phase(t, BETWEEN_PHASES.settle - 0.08, 0.96);
    const visible = rise > 0 && fade > 0;
    this.beam.visible = this.beamCore.visible = visible;
    const floor = { x: center.x, y: center.y + big * 0.35 };
    if (!visible) {
      this.column.update(seconds, { alpha: 0 });
      this.columnInk.update(seconds, { alpha: 0 });
    } else {
      const reach = (floor.y - this.top + big) * rise;
      for (const [beam, width, alpha] of [
        [this.beam, 3.6, 0.35],
        [this.beamCore, 1.2, 0.45],
      ] as const) {
        beam.position.set(floor.x, floor.y + big * 0.2);
        beam.height = reach + big * 0.2;
        beam.width = big * width * (1 + 0.06 * Math.sin(seconds * 24)) * (0.5 + 0.5 * fade);
        beam.alpha = alpha * fade;
      }
      const path = [floor, { x: floor.x, y: floor.y - reach }];
      this.column.setPath(path, (along) => big * 1.9 * (1 - 0.5 * along));
      this.column.update(seconds, { alpha: 0.85 * fade });
      this.columnInk.setPath(path, (along) => big * 3.2 * (1 - 0.35 * along));
      this.columnInk.update(seconds, { alpha: fade });
    }
    const since = phase(t, BETWEEN_PHASES.hit, BETWEEN_PHASES.settle);
    this.splashRings.forEach((ring, index) => {
      const life = phase(since, index * 0.12, index * 0.12 + 0.6);
      if (since <= 0 || life <= 0 || life >= 1) {
        ring.update(seconds, { alpha: 0 });
        return;
      }
      const radius = big * (1 + (7 - index * 2) * life ** 0.6);
      ring.setPath(
        circlePath(radius, 64, BETWEEN_FLOOR_TILT).map((point) => ({
          x: point.x + floor.x,
          y: point.y + floor.y,
        })),
        big * (0.5 * (1 - life) + 0.08),
      );
      ring.update(seconds, { alpha: (1 - life) * (1 - index * 0.3) });
    });
  }

  /**
   * The living dark water: the currents and the whirlpool pour it, it swirls and is pulled toward the target,
   * sucked into the passage, blown out at the hit and carried up by the column.
   */
  private runFluid(t: number, seconds: number, center: IArenaPoint2, big: number): void {
    const fluid = this.fluid;
    if (!fluid) return;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const floor = { x: center.x, y: center.y + big * 0.35 };
    const { pull, hit, surge } = BETWEEN_PHASES;
    const bias =
      t < pull
        ? { center: floor, radial: -big * 1.2, swirl: big * 2.4 }
        : t < hit
          ? { center: floor, radial: -big * 3.4, swirl: big * 4.6 }
          : t < surge + 0.03
            ? { center: floor, radial: big * 7, swirl: big * 1.5 }
            : {
                center: floor,
                radial: big * 1.2,
                swirl: big * 1.2,
                drift: { x: 0, y: -big * 4.5 },
              };
    fluid.update(delta, { inject: 4, decay: t < hit ? 0.58 : 0.62, bias });
  }

  /**
   * Plans what is drawn once (the deep water, the flash, the maw, the wings and their eyes), the dark water and
   * what feeds it (the currents, the whirlpool, the column), the swarm and the drops.
   */
  private plan(targets: IArenaPoint2[], field: IArenaFxField): void {
    const center = this.middle;
    const big = this.size * this.grow;
    this.top = field.y;
    paintFalloff(
      this.shade,
      center.x,
      center.y - big,
      big * 5,
      field.diagonal * 1.1,
      BETWEEN_COLORS.abyss,
      0.62,
    );
    this.shade.alpha = 0;
    paintGlow(this.flash, center.x, center.y + big * 0.2, big * 3.6, BETWEEN_COLORS.ice);
    this.flash.alpha = 0;
    paintGlow(this.maw, 0, 0, 1, BETWEEN_COLORS.abyss, 14);
    this.maw.visible = false;
    const fluid = new ArenaEnergyFluid(this.host, {
      area: { x: field.x, y: field.y, width: field.width, height: field.height },
      palette: ENERGY_PALETTES.abyss,
      mode: "water",
      decay: 0.58,
      turbulence: { scale: big * 1.8, force: big * 6 },
      vorticity: 34,
      gain: 1.15,
      seed: 17,
    });
    this.fluid = fluid;
    this.fluidLayer.addChild(fluid.view);
    fluid.sources.addChild(
      this.mawInk.mesh,
      this.columnInk.mesh,
      ...this.arms.map((arm) => arm.ink.mesh),
    );
    const streamAngles = this.planStreams(fluid, targets, field);
    this.planWings();
    this.planSwarm(targets, field, streamAngles);
    this.planDrops(center, big);
  }

  /** The currents of water from beyond the screen to the targets; returns the angle each one comes from. */
  private planStreams(
    fluid: ArenaEnergyFluid,
    targets: IArenaPoint2[],
    field: IArenaFxField,
  ): number[] {
    const r = this.size;
    const count = Math.min(Math.max(BETWEEN_STREAMS, targets.length * 2), BETWEEN_STREAMS_MAX);
    const angles: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const target = targets[index % targets.length] ?? this.middle;
      const angle = (index / count) * Math.PI * 2 + (this.random() - 0.5) * 0.5;
      angles.push(angle);
      const tendril = new ArenaEnergyTendril(fluid, {
        palette: index % 2 === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
        from: {
          x: this.middle.x + Math.cos(angle) * field.diagonal * 0.62,
          y: this.middle.y + Math.sin(angle) * field.diagonal * 0.62,
        },
        to: { x: target.x, y: target.y - r * 0.4 },
        bend: (index % 2 === 0 ? 1 : -1) * (0.18 + this.random() * 0.12),
        width: r * 0.42,
        speed: 300,
        grain: 110,
        strands: 4,
        seed: index * 13 + 7,
      });
      this.streams.push(tendril);
      this.streamsLayer.addChild(tendril.view);
    }
    return angles;
  }

  /**
   * The wings of the god, drawn once at full spread around their root (each side is then spread by its horizontal
   * scale): a dark membrane with a lighter heart and white spots along the edge, a rim and veins of pale energy,
   * the eyes; a dark body with light running down it, antennae and two small white eyes.
   */
  private planWings(): void {
    const W = BETWEEN_WINGSPAN * this.size * this.grow;
    const random = this.random;
    this.wings.position.set(
      this.middle.x,
      this.middle.y - BETWEEN_WINGS_LIFT * this.size * this.grow,
    );
    const outlines = [BETWEEN_FOREWING, BETWEEN_HINDWING].map((wing) =>
      smoothLoop(wing, BETWEEN_OUTLINE_POINTS).map((point) => ({ x: point.x * W, y: point.y * W })),
    );
    const root = { x: 0.05 * W, y: 0 };
    SIDES.forEach((_, sideIndex) => {
      const side = new Container();
      const membrane = new Graphics();
      for (const outline of outlines) {
        membrane.poly(outline).fill({ color: BETWEEN_COLORS.navy, alpha: 0.72 });
        membrane
          .poly(
            outline.map((point) => ({
              x: root.x + (point.x - root.x) * 0.66,
              y: root.y + (point.y - root.y) * 0.66,
            })),
          )
          .fill({ color: BETWEEN_COLORS.midnight, alpha: 0.55 });
        outline.forEach((point, index) => {
          if (index % 4 !== 0) return;
          const inset = 0.9;
          membrane
            .circle(
              root.x + (point.x - root.x) * inset,
              root.y + (point.y - root.y) * inset,
              W * 0.012,
            )
            .fill({ color: BETWEEN_COLORS.white, alpha: 0.75 });
        });
      }
      side.addChild(membrane);
      outlines.forEach((outline, index) => {
        const rim = this.flow({
          palette: index === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
          speed: 260,
          grain: 50,
          sharpness: 3,
          strands: 3,
          feather: 0.5,
          closed: true,
          samples: BETWEEN_OUTLINE_POINTS,
          seed: 100 + sideIndex * 10 + index,
        });
        rim.setPath(outline, W * 0.045);
        this.wingFlows.push(rim);
        side.addChild(rim.mesh);
      });
      BETWEEN_VEINS.forEach((end, index) => {
        const vein = this.flow({
          palette: index % 2 === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
          speed: 340,
          grain: 40,
          sharpness: 4,
          strands: 2,
          feather: 0.3,
          samples: 20,
          seed: 120 + sideIndex * 10 + index,
        });
        const to = { x: end.x * W, y: end.y * W };
        const control = { x: to.x * 0.45, y: to.y * 0.62 };
        vein.setPath(
          Array.from({ length: 20 }, (_, step) => curvePoint(root, control, to, step / 19)),
          (along) => W * 0.024 * (1 - along * 0.85),
        );
        this.wingFlows.push(vein);
        side.addChild(vein.mesh);
      });
      for (const spot of BETWEEN_EYES) this.eyes.push(this.drawEye(side, spot, W, random));
      this.wingSides.push(side);
      this.wings.addChild(side);
    });
    this.body.setPath(
      [
        { x: 0, y: -0.3 * W },
        { x: 0, y: 0.45 * W },
      ],
      (along) => W * 0.08 * Math.sin(Math.PI * (0.08 + along * 0.84)) ** 0.6,
    );
    this.bodyLight.setPath(
      [
        { x: 0, y: -0.28 * W },
        { x: 0, y: 0.42 * W },
      ],
      (along) => W * 0.02 * Math.sin(Math.PI * along),
    );
    for (const side of SIDES) {
      const antenna = this.flow({
        palette: ENERGY_PALETTES.tide,
        speed: 220,
        grain: 30,
        sharpness: 4,
        strands: 2,
        feather: 0.3,
        samples: 20,
        seed: 140 + side,
      });
      const from = { x: side * 0.02 * W, y: -0.3 * W };
      const to = { x: side * 0.24 * W, y: -0.64 * W };
      const control = { x: side * 0.03 * W, y: -0.56 * W };
      antenna.setPath(
        Array.from({ length: 20 }, (_, step) => curvePoint(from, control, to, step / 19)),
        (along) => W * 0.014 * (1 - along * 0.6),
      );
      this.antennae.push(antenna);
    }
    this.headEyes.forEach((eye, index) =>
      eye.position.set((index === 0 ? 1 : -1) * 0.028 * W, -0.31 * W),
    );
    this.wings.addChild(
      this.body.mesh,
      this.bodyLight.mesh,
      ...this.antennae.map((antenna) => antenna.mesh),
      ...this.headEyes,
    );
  }

  /**
   * One eye on a wing (on the right side; the left mirrors it): a dark socket with a rim of pale light, a blue
   * iris and a slit pupil turned toward the target, over a soft glow. Its lid is its vertical scale.
   */
  private drawEye(
    side: Container,
    spot: (typeof BETWEEN_EYES)[number],
    W: number,
    random: () => number,
  ): IBetweenEye {
    const at = { x: spot.x * W, y: spot.y * W };
    const glow = this.glow(BETWEEN_COLORS.sky);
    glow.position.set(at.x, at.y);
    glow.width = glow.height = spot.radius * W * 4;
    const lid = new Container();
    lid.position.set(at.x, at.y);
    lid.scale.set(spot.radius * W);
    const eye = new Graphics();
    eye.circle(0, 0, 1).fill({ color: BETWEEN_COLORS.abyss, alpha: 0.95 });
    eye.circle(0, 0, 0.86).stroke({ width: 0.26, color: BETWEEN_COLORS.sky, alpha: 0.3 });
    eye.circle(0, 0, 0.86).stroke({ width: 0.07, color: BETWEEN_COLORS.ice, alpha: 0.95 });
    eye.circle(0, 0, 0.62).fill({ color: BETWEEN_COLORS.blue });
    eye.circle(0, 0, 0.44).fill({ color: BETWEEN_COLORS.sky, alpha: 0.75 });
    const toward = { x: -at.x, y: BETWEEN_WINGS_LIFT * this.size * this.grow - at.y };
    const length = Math.hypot(toward.x, toward.y) || 1;
    const pupil = new Container();
    pupil.position.set((toward.x / length) * 0.24, (toward.y / length) * 0.24);
    const slit = new Graphics();
    slit.ellipse(0, 0, 0.13, 0.42).fill({ color: BETWEEN_COLORS.abyss });
    pupil.addChild(slit);
    const shine = new Graphics();
    shine.circle(-0.22, -0.26, 0.09).fill({ color: BETWEEN_COLORS.white, alpha: 0.9 });
    lid.addChild(eye, pupil, shine);
    lid.visible = false;
    side.addChild(glow, lid);
    const seconds = BETWEEN_DURATION_MS / 1000;
    return {
      lid,
      glow,
      pupil,
      blink:
        seconds *
        (BETWEEN_PHASES.eyes + 0.08 + random() * (BETWEEN_PHASES.hit - BETWEEN_PHASES.eyes - 0.12)),
    };
  }

  /**
   * The swarm: butterflies come in from beyond the screen along the currents, whirl around the targets in rising
   * columns tightening as the passage pulls; some leave the whirl to settle on the wings of the god, and at the hit
   * they all burst away from the clap and scatter up and off.
   */
  private planSwarm(targets: IArenaPoint2[], field: IArenaFxField, streamAngles: number[]): void {
    const random = this.random;
    const r = this.size;
    const big = r * this.grow;
    const W = BETWEEN_WINGSPAN * big;
    const total = BETWEEN_DURATION_MS / 1000;
    const { swarm, gather, wings, pull, hit, settle } = BETWEEN_PHASES;
    const hitTime = hit * total;
    const wingsRoot = { x: this.wings.position.x, y: this.wings.position.y };
    const slots = wingSlots(BETWEEN_WING_BUTTERFLIES, random);
    const count = BETWEEN_VORTEX + slots.length;
    for (let index = 0; index < count; index += 1) {
      const target = targets[index % targets.length] ?? this.middle;
      const slot = index >= BETWEEN_VORTEX ? slots[index - BETWEEN_VORTEX] : undefined;
      const slotSide = index % 2 === 0 ? 1 : -1;
      const streamAngle = streamAngles[index % streamAngles.length] ?? 0;
      const fromAngle = streamAngle + (random() - 0.5) * 0.4;
      const start = {
        x: this.middle.x + Math.cos(fromAngle) * field.diagonal * (0.58 + random() * 0.12),
        y: this.middle.y + Math.sin(fromAngle) * field.diagonal * (0.58 + random() * 0.12),
      };
      const born = total * (swarm + random() * (gather - swarm - 0.04));
      const arrive = born + 0.9 + random() * 0.5;
      const orbit = {
        angle: random() * Math.PI * 2,
        radius: r * (1.2 + random() * 2),
        height: -r * (0.1 + random() * 2.6),
        speed: (random() < 0.85 ? 1 : -1) * (2.2 + random() * 1.6),
      };
      const orbitAt = (time: number) => {
        const tight = phase(time, pull * total, hitTime);
        const angle = orbit.angle + orbit.speed * time;
        const radius = orbit.radius * (1 - 0.35 * tight);
        return {
          x: target.x + Math.cos(angle) * radius,
          y:
            target.y +
            orbit.height * (1 - 0.3 * tight) +
            Math.sin(angle) * radius * BETWEEN_FLOOR_TILT,
        };
      };
      const entry = orbitAt(arrive);
      const bow = (index % 2 === 0 ? 1 : -1) * 0.3;
      const control = {
        x: (start.x + entry.x) / 2 - (entry.y - start.y) * bow,
        y: (start.y + entry.y) / 2 + (entry.x - start.x) * bow,
      };
      const settleAt = wings * total + random() * 0.5;
      const slotAt = (time: number) => {
        const spread = wingSpread(time / total);
        return {
          x: wingsRoot.x + slotSide * (slot?.x ?? 0) * W * spread,
          y: wingsRoot.y + (slot?.y ?? 0) * W,
        };
      };
      const held = (time: number) => {
        if (time < arrive)
          return curvePoint(start, control, entry, easeInOut((time - born) / (arrive - born)));
        const circling = orbitAt(time);
        if (!slot || time < settleAt) return circling;
        const landing = easeInOut((time - settleAt) / 0.6);
        const resting = slotAt(time);
        return {
          x: circling.x + (resting.x - circling.x) * landing,
          y: circling.y + (resting.y - circling.y) * landing,
        };
      };
      const burst = held(hitTime);
      const from = slot ? wingsRoot : { x: target.x, y: target.y + r * 0.35 };
      const away = { x: burst.x - from.x, y: burst.y - from.y };
      const length = Math.hypot(away.x, away.y) || 1;
      const force = big * (3 + random() * 4);
      const rise = big * (1 + random() * 1.4);
      const path = (time: number) => {
        if (time < hitTime) return held(time);
        const since = time - hitTime;
        const push = 1 - Math.exp(-since * 3.5);
        return {
          x: burst.x + (away.x / length) * force * push,
          y: burst.y + (away.y / length) * force * push - rise * since * since,
        };
      };
      const glowing = index % 3 === 0;
      const color = glowing
        ? mixColor(BETWEEN_COLORS.white, BETWEEN_COLORS.ice, random())
        : mixColor(BETWEEN_COLORS.deep, BETWEEN_COLORS.blue, random());
      this.swarm.add({
        path,
        born,
        life: settle * total + random() * 0.7 - born,
        size: r * (slot ? 0.42 + random() * 0.26 : 0.28 + random() * 0.22),
        flap: 7 + random() * 5,
        glowing,
        tint: () => color,
        alpha: (life) =>
          Math.min(life * 8, 1) * Math.min((1 - life) * 3, 1) * (glowing ? 0.9 : 0.95),
        seed: random() * 100,
      });
    }
  }

  /** The drops thrown up by the column of water and falling back, and a fine spray rising with it. */
  private planDrops(center: IArenaPoint2, big: number): void {
    const random = this.random;
    const frames = this.host.textures;
    const total = BETWEEN_DURATION_MS / 1000;
    const hit = BETWEEN_PHASES.hit * total;
    const floor = { x: center.x, y: center.y + big * 0.35 };
    for (let index = 0; index < BETWEEN_DROPLETS; index += 1) {
      const angle = -Math.PI / 2 + (random() - 0.5) * 2.2;
      const speed = big * (8 + random() * 10);
      const size = big * (0.08 + random() * 0.08);
      this.water.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          x: floor.x + (random() - 0.5) * big,
          y: floor.y,
          vx: Math.cos(angle) * speed * 0.7,
          vy: Math.sin(angle) * speed,
          drag: 0.6,
          gravity: big * 16,
          born: hit + random() * 0.35,
          life: 0.8 + random() * 0.6,
        },
        look: {
          size: (l) => size * 3.2 * (1 - l * 0.5),
          height: () => size * 0.7,
          alpha: (l) => 0.9 * (1 - l),
          tint: (l) =>
            mixStops(
              [BETWEEN_COLORS.white, BETWEEN_COLORS.ice, BETWEEN_COLORS.sky, BETWEEN_COLORS.blue],
              l,
            ),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    for (let index = 0; index < BETWEEN_SPRAY; index += 1) {
      const size = big * (0.3 + random() * 0.4);
      const sway = random() * Math.PI * 2;
      this.water.add({
        texture: frames.glow,
        spawn: {
          x: floor.x + (random() - 0.5) * big * 1.6,
          y: floor.y - random() * big,
          vx: 0,
          vy: -big * (6 + random() * 8),
          drag: 0.8,
          gravity: 0,
          born: hit + random() * (BETWEEN_PHASES.settle - BETWEEN_PHASES.hit) * total * 0.6,
          life: 0.6 + random() * 0.5,
        },
        look: {
          size: (l) => size * (1 + l),
          alpha: (l) => 0.5 * Math.sin(Math.PI * l),
          tint: (l) => mixColor(BETWEEN_COLORS.ice, BETWEEN_COLORS.blue, l),
          drift: (age) => ({ x: Math.sin(age * 6 + sway) * big * 0.3, y: 0 }),
        },
      });
    }
  }

  private flow(options: IEnergyFlowOptions): ArenaEnergyFlow {
    return new ArenaEnergyFlow(options);
  }

  private glow(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.glow);
    sprite.anchor.set(0.5);
    sprite.tint = tint;
    sprite.blendMode = "add";
    return sprite;
  }

  private beamSprite(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.beam);
    sprite.anchor.set(0.5, 0);
    sprite.rotation = Math.PI;
    sprite.tint = tint;
    sprite.blendMode = "add";
    sprite.visible = false;
    return sprite;
  }
}
