import { ColorMatrixFilter, Container, Graphics, Sprite, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  BETWEEN_COLORS,
  BETWEEN_FLOOR_TILT,
  BETWEEN_HELD_MATRIX,
  BETWEEN_IDENTITY_MATRIX,
  spiralPoint,
} from "@/modules/arena/services/arenaBetweenWorldsEffect";
import {
  ArenaButterflySwarm,
  curvePoint,
  easeInOut,
} from "@/modules/arena/services/arenaButterflySwarm";
import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
  type IEnergyPalette,
} from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import { paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import { ArenaSoundWaveFilter } from "@/modules/arena/services/arenaSoundWave";
import {
  ArenaAmountText,
  bump,
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
  PASSING_ARM_POINTS,
  PASSING_BUTTERFLIES,
  PASSING_DROPLETS,
  PASSING_DURATION_MS,
  PASSING_FIELD,
  PASSING_FLUID_KEY,
  PASSING_FLUID_LIMIT,
  PASSING_IMPACT_MS,
  PASSING_LINGER_MS,
  PASSING_RINGS,
  PASSING_RIPPLE_KEY,
  PASSING_SHOCKWAVE,
  PASSING_SLAM_DROPLETS,
  PASSING_SPOUT,
  PASSING_SPOUT_POINTS,
  PASSING_SPRAY,
  PASSING_TIMES,
  PASSING_WAVE_POINTS,
} from "./arenaPassingFlowEffect.constants";
import type { IPassingWater } from "./arenaPassingFlowEffect.types";
import { passingRipples, spoutPath, wavePath } from "./arenaPassingFlowEffect.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Where the blow comes from when there is no attacker (the example without one). */
const DEFAULT_INCOMING: IArenaPoint2 = { x: 1, y: 0.2 };

/**
 * "Fluxo do passar", Antropozohl's attack, on the target, made with the energy kit and water in the fluid's water
 * mode (glossy, with highlights, caustics and foam): the torrent crashes into the target and splits around it,
 * throwing drops, rings of water racing over the floor and over the map itself; a waterspout winds up around it
 * and lifts it, drowned and spinning, with the butterflies that came with the water whirling up inside; then the
 * spout collapses and slams it into the floor in a second, bigger crash, and the water drains into a dark whirlpool
 * under it while the swarm scatters. The status changes at the slam. At most `PASSING_FLUID_LIMIT` targets get the
 * fluid at once (an area attack); the others show the water as ribbons.
 */
export class ArenaPassingFlowEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly impactMs = PASSING_IMPACT_MS;
  readonly tokenFilters: readonly Filter[];
  private readonly tone = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.4,
    bloomScale: 0.8,
    blur: 5,
    quality: 3,
  });
  private readonly fluid: ArenaEnergyFluid | null;
  private readonly feed: Container;
  private readonly parts = new Container();
  private readonly flash: Sprite;
  private readonly column: Sprite;
  private readonly maw = new Graphics();
  private readonly waves: IPassingWater[] = [];
  private readonly spout: IPassingWater[] = [];
  private readonly drain: IPassingWater[] = [];
  private readonly rings: ArenaEnergyFlow[] = [];
  private readonly swarm: ArenaButterflySwarm;
  private readonly drops: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly ripples: ArenaSoundWaveFilter | null;
  private readonly direction: IArenaPoint2;
  private readonly heading: number;
  private fluidSeconds = 0;
  private start: number | null = null;
  private rippling = false;
  private crashed = false;
  private slammed = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const incoming = options.incoming ?? DEFAULT_INCOMING;
    const length = Math.hypot(incoming.x, incoming.y) || 1;
    this.direction = { x: incoming.x / length, y: incoming.y / length };
    this.heading = Math.atan2(this.direction.y, this.direction.x);
    const lasts = (options.delayMs ?? 0) + PASSING_DURATION_MS + PASSING_LINGER_MS;
    const { side, above, below } = PASSING_FIELD;
    this.fluid = !host.screen.reserve(PASSING_FLUID_KEY, PASSING_FLUID_LIMIT, lasts)
      ? null
      : new ArenaEnergyFluid(host, {
          area: { x: -r * side, y: -r * above, width: r * side * 2, height: r * (above + below) },
          palette: ENERGY_PALETTES.abyss,
          mode: "water",
          resolution: 340,
          simulation: 104,
          pressureSteps: 10,
          decay: 0.5,
          velocityDecay: 0.6,
          turbulence: { scale: r * 1.2, force: r * 6 },
          vorticity: 36,
          gain: 1.1,
          seed: options.seed,
        });
    this.ripples = host.screen.claim(PASSING_RIPPLE_KEY, lasts)
      ? new ArenaSoundWaveFilter({ tint: BETWEEN_COLORS.sky, push: 0.6 })
      : null;
    this.feed = this.fluid?.sources ?? new Container();
    this.flash = this.glow(BETWEEN_COLORS.ice);
    this.column = this.glow(BETWEEN_COLORS.blue);
    this.swarm = new ArenaButterflySwarm(host.textures, r * 8);
    this.drops = new ArenaFxParticles(r * 8, "add");
    for (const sideOf of [1, -1] as const) {
      const path = wavePath(this.heading, sideOf, r * 1.15, PASSING_WAVE_POINTS);
      const wave = this.water(
        sideOf === 1 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
        false,
        sideOf * 3,
      );
      const swell = (along: number) => Math.sin(Math.PI * Math.min(along * 1.15, 1));
      wave.water.setPath(path, (along) => r * 0.42 * swell(along));
      wave.ink.setPath(path, (along) => r * 1.3 * swell(along));
      this.waves.push(wave);
    }
    for (let index = 0; index < PASSING_SPOUT.arms; index += 1)
      this.spout.push(
        this.water(
          index % 2 === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
          false,
          10 + index,
        ),
      );
    for (let index = 0; index < 2; index += 1)
      this.drain.push(
        this.water(index === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss, false, 20 + index),
      );
    for (let index = 0; index < PASSING_RINGS * 2; index += 1) {
      const ring = this.flow(
        index % 2 === 0 ? ENERGY_PALETTES.tide : ENERGY_PALETTES.abyss,
        true,
        options.seed + 30 + index,
      );
      this.rings.push(ring);
      this.parts.addChild(ring.mesh);
    }
    paintGlow(this.maw, 0, 0, 1, BETWEEN_COLORS.abyss, 12);
    this.maw.visible = false;
    this.amount = new ArenaAmountText(
      "passingFlow",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.plan(r);
    this.bloom.resolution = 1;
    this.parts.addChildAt(this.maw, 0);
    this.parts.addChildAt(this.column, 1);
    this.parts.addChild(this.flash);
    this.parts.filters = [this.bloom];
    this.tokenFilters = [this.tone];
    this.container.eventMode = "none";
    if (!this.fluid) this.parts.addChildAt(this.feed, 2);
    this.container.addChild(
      ...(this.fluid ? [this.fluid.view] : []),
      this.parts,
      this.drops.container,
      this.swarm.container,
      this.amount.text,
    );
  }

  step(now: number, cameraScale: number, lift = 0): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now + (this.options.delayMs ?? 0);
    if (now < this.start) {
      this.container.visible = false;
      return { done: false, frame: REST };
    }
    this.container.visible = true;
    const elapsed = now - this.start;
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const scale = cameraScale > 0 ? cameraScale : 1;
    if (elapsed >= PASSING_DURATION_MS) {
      this.parts.visible = false;
      this.drops.container.visible = false;
      this.swarm.container.visible = false;
      this.amount.text.visible = false;
      this.quiet();
      this.tone.enabled = false;
      const since = elapsed - PASSING_DURATION_MS;
      if (!this.fluid) return { done: true, frame: REST };
      this.fluid.update(delta, {
        inject: 0,
        alpha: 1 - phase(since, PASSING_LINGER_MS * 0.4, PASSING_LINGER_MS),
        bias: { drift: { x: 0, y: r * 1.5 } },
      });
      return { done: since >= PASSING_LINGER_MS, frame: REST };
    }
    const t = elapsed / PASSING_DURATION_MS;
    const slamT = PASSING_IMPACT_MS / PASSING_DURATION_MS;
    if (t < slamT) this.amount.text.visible = false;
    else this.amount.place(phase(t, slamT, 1), scale, r + lift, false);
    this.quake(seconds, r, scale);
    this.runRipples(seconds, r, scale);
    const flash =
      1 -
      phase(seconds, 0, 0.2) +
      (seconds >= PASSING_TIMES.slam
        ? 1 - phase(seconds, PASSING_TIMES.slam, PASSING_TIMES.slam + 0.25)
        : 0);
    this.flash.width = this.flash.height = r * (seconds >= PASSING_TIMES.slam ? 6 : 4.2);
    this.flash.alpha = 0.85 * Math.min(flash, 1);
    this.runWaves(seconds);
    const rising = this.runSpout(seconds, r);
    this.runRings(seconds, r);
    const draining = this.runDrain(seconds, r);
    this.runFluid(delta, seconds, r, rising, draining);
    const drowned =
      phase(seconds, PASSING_TIMES.spout, PASSING_TIMES.spoutFull) *
      (1 - phase(seconds, PASSING_TIMES.slam, PASSING_TIMES.drain));
    this.tone.enabled = drowned > 0;
    this.tone.matrix = BETWEEN_IDENTITY_MATRIX.map(
      (value, index) => value + ((BETWEEN_HELD_MATRIX[index] ?? 0) - value) * drowned,
    ) as ColorMatrixFilter["matrix"];
    this.drops.update(seconds);
    this.swarm.update(seconds);
    return { done: false, frame: this.reel(seconds, r) };
  }

  destroy(): void {
    this.quiet();
    this.ripples?.destroy();
    this.parts.filters = [];
    this.bloom.destroy();
    this.tone.destroy();
    const all = [...this.waves, ...this.spout, ...this.drain];
    for (const water of all) water.ink.mesh.removeFromParent();
    for (const flow of [...all.flatMap((water) => [water.water, water.ink]), ...this.rings])
      flow.destroy();
    this.swarm.destroy();
    this.fluid?.destroy();
    this.container.destroy({ children: true });
  }

  /** The two blows on the board: the crash of the torrent and, harder, the slam of the spout. */
  private quake(seconds: number, r: number, scale: number): void {
    const hit = (wave: (typeof PASSING_SHOCKWAVE)[keyof typeof PASSING_SHOCKWAVE]) =>
      this.host.shockwave(this.container, r * scale * wave.radii, wave.durationMs, {
        amplitude: wave.amplitude,
        wavelength: wave.wavelength,
      });
    if (!this.crashed) {
      this.crashed = true;
      hit(PASSING_SHOCKWAVE.crash);
    }
    if (!this.slammed && seconds >= PASSING_TIMES.slam) {
      this.slammed = true;
      hit(PASSING_SHOCKWAVE.slam);
    }
  }

  /** The rings of water rippling the map (a filter on the world, once per cast), only while one lives. */
  private runRipples(seconds: number, r: number, scale: number): void {
    if (!this.ripples) return;
    const waves = passingRipples(seconds, 0, PASSING_TIMES.slam);
    if (waves.length === 0) {
      this.quiet();
      return;
    }
    if (!this.rippling) {
      this.rippling = true;
      this.host.screen.addWorldFilter(this.ripples);
    }
    this.host.screen.fitWorldFilters();
    const origin = this.host.screen.toScreen(this.container);
    this.ripples.update({
      origin: { x: origin.x, y: origin.y + r * scale * 0.45 },
      direction: this.direction,
      unit: r * scale,
      waves,
    });
  }

  private quiet(): void {
    if (!this.rippling || !this.ripples) return;
    this.rippling = false;
    this.host.screen.removeWorldFilter(this.ripples);
  }

  /** The torrent splitting around the target: each wave runs from the side facing the blow around it and on, then drains. */
  private runWaves(seconds: number): void {
    const head = 1 - (1 - phase(seconds, 0, PASSING_TIMES.crashIn)) ** 3;
    const tail = phase(seconds, PASSING_TIMES.crashIn * 0.6, PASSING_TIMES.crashOut);
    const alpha = tail >= 1 ? 0 : 1;
    for (const wave of this.waves) {
      wave.water.update(seconds, { head, tail, alpha });
      wave.ink.update(seconds, { head, tail, alpha });
    }
  }

  /**
   * The waterspout: its arms wind up around the target from the floor, spinning faster as it rises, then it
   * collapses down onto it. Returns how strongly it rises (negative while it falls).
   */
  private runSpout(seconds: number, r: number): number {
    const grow = phase(seconds, PASSING_TIMES.spout, PASSING_TIMES.spoutFull);
    const fall = phase(seconds, PASSING_TIMES.collapse, PASSING_TIMES.slam);
    const shown = grow * (1 - phase(seconds, PASSING_TIMES.slam, PASSING_TIMES.slam + 0.12));
    const height = r * PASSING_SPOUT.height * grow ** 0.7 * (1 - fall ** 2);
    this.column.visible = shown > 0;
    this.column.position.set(0, r * 0.45 - height * 0.5);
    this.column.width = r * 2.6 * (1 + fall);
    this.column.height = Math.max(height, r) * 1.4;
    this.column.alpha = 0.35 * shown;
    this.spout.forEach((arm, index) => {
      if (shown <= 0) {
        arm.water.update(seconds, { alpha: 0 });
        arm.ink.update(seconds, { alpha: 0 });
        return;
      }
      const start = -seconds * (7 + 5 * grow) + (index / PASSING_SPOUT.arms) * Math.PI * 2;
      const points = spoutPath(
        start,
        r * (1.05 + 0.6 * fall),
        Math.max(height, r * 0.3),
        r * 0.45,
        PASSING_SPOUT.turns,
        PASSING_SPOUT_POINTS,
      );
      const taper = (along: number) => Math.min(along * 8, 1);
      arm.water.setPath(points, (along) => r * (0.16 + 0.26 * along) * taper(along));
      arm.ink.setPath(points, (along) => r * (0.3 + 0.45 * along) * taper(along));
      arm.water.update(seconds, { alpha: shown });
      arm.ink.update(seconds, { alpha: shown });
    });
    return fall > 0 ? -fall : grow * (1 - fall);
  }

  /** Rings of water racing over the floor: three at the crash, three bigger at the slam. */
  private runRings(seconds: number, r: number): void {
    this.rings.forEach((ring, index) => {
      const slam = index >= PASSING_RINGS;
      const order = index % PASSING_RINGS;
      const born = (slam ? PASSING_TIMES.slam : 0) + order * 0.08;
      const life = phase(seconds, born, born + (slam ? 0.7 : 0.55));
      if (life <= 0 || life >= 1) {
        ring.update(seconds, { alpha: 0 });
        return;
      }
      const reach = (slam ? 4.8 : 2.8) - order * 0.8;
      ring.setPath(
        circlePath(r * (0.9 + reach * life ** 0.6), 48, BETWEEN_FLOOR_TILT).map((point) => ({
          x: point.x,
          y: point.y + r * 0.45,
        })),
        r * ((slam ? 0.5 : 0.34) * (1 - life) + 0.05),
      );
      ring.update(seconds, { alpha: 1 - life });
    });
  }

  /** The whirlpool left under the target after the slam, draining the water. Returns how hard it pulls. */
  private runDrain(seconds: number, r: number): number {
    const open = phase(seconds, PASSING_TIMES.slam, PASSING_TIMES.slam + 0.2);
    const close = phase(seconds, PASSING_TIMES.drain - 0.4, PASSING_TIMES.drain);
    const pull = open * (1 - close);
    this.maw.visible = pull > 0;
    if (pull <= 0) {
      for (const arm of this.drain) {
        arm.water.update(seconds, { alpha: 0 });
        arm.ink.update(seconds, { alpha: 0 });
      }
      return 0;
    }
    const radius = r * 1.3 * pull;
    this.maw.position.set(0, r * 0.45);
    this.maw.scale.set(radius, radius * BETWEEN_FLOOR_TILT);
    this.maw.alpha = 0.9 * pull;
    this.drain.forEach((arm, index) => {
      const start = -seconds * 6 + index * Math.PI;
      const points = Array.from({ length: PASSING_ARM_POINTS }, (_, step) => {
        const point = spiralPoint(
          step / (PASSING_ARM_POINTS - 1),
          radius * 2.6,
          radius * 0.18,
          0.85,
          start,
          BETWEEN_FLOOR_TILT,
        );
        return { x: point.x, y: point.y + r * 0.45 };
      });
      arm.water.setPath(points, (along) => r * 0.26 * Math.sin(Math.PI * Math.min(along * 1.2, 1)));
      arm.ink.setPath(points, (along) => r * 0.8 * (1 - along * 0.6));
      arm.water.update(seconds, { alpha: pull });
      arm.ink.update(seconds, { alpha: pull });
    });
    return pull;
  }

  /** The water: pushed along the blow at the crash, whirled up the spout, thrown down and out at the slam, drained. */
  private runFluid(
    delta: number,
    seconds: number,
    r: number,
    rising: number,
    draining: number,
  ): void {
    const crash = 1 - phase(seconds, 0, PASSING_TIMES.crashOut);
    const slam =
      seconds >= PASSING_TIMES.slam
        ? 1 - phase(seconds, PASSING_TIMES.slam, PASSING_TIMES.slam + 0.35)
        : 0;
    const floor = { x: 0, y: r * 0.45 };
    const bias =
      crash > 0.5
        ? { drift: { x: this.direction.x * r * 6, y: this.direction.y * r * 6 - r } }
        : rising > 0
          ? {
              center: floor,
              swirl: -r * 6 * rising,
              radial: -r * 0.8,
              drift: { x: 0, y: -r * 5 * rising },
            }
          : slam > 0
            ? { center: floor, radial: r * 9 * slam, drift: { x: 0, y: r * 6 * slam } }
            : { center: floor, swirl: r * 4 * draining, radial: -r * 2.5 * draining };
    this.fluid?.update(delta, {
      inject: seconds < PASSING_TIMES.slam + 0.3 ? 4.5 : 3 * draining,
      bias,
    });
  }

  /**
   * The target: knocked back along the blow by the crash, then lifted by the spout, drowned and spinning, and
   * slammed into the floor by the collapse, flattened, before it springs back.
   */
  private reel(seconds: number, r: number): IArenaEffectFrame {
    const jolt = r * 0.3 * Math.exp(-seconds * 9);
    const knock = 0.14 * Math.exp(-seconds * 9);
    const lift = phase(seconds, PASSING_TIMES.spout, PASSING_TIMES.spoutFull) ** 1.4;
    const fall = phase(seconds, PASSING_TIMES.collapse, PASSING_TIMES.slam) ** 2;
    const held = lift * (1 - fall);
    const spin = Math.cos(seconds * 26) * 0.35 * held;
    const since = seconds - PASSING_TIMES.slam;
    const crush = since >= 0 ? 0.42 * Math.exp(-since * 6) : 0;
    const wobble = since >= 0 ? 0.08 * Math.exp(-since * 4) * Math.sin(since * 30) : 0;
    return {
      dx:
        this.direction.x * jolt +
        shake(Math.min(seconds, 1), r * 0.04 * held, 20, 1) +
        (since >= 0 ? shake(Math.min(since, 1), r * 0.12, 10, 0.4) : 0),
      dy:
        this.direction.y * jolt -
        r * 1.1 * held +
        (since >= 0 ? r * 0.2 * Math.exp(-since * 5) : 0),
      scaleX: 1 + knock - Math.abs(spin) * 0.9 + crush * 0.75 + wobble,
      scaleY:
        1 -
        knock +
        0.08 * held -
        crush -
        wobble +
        0.04 * bump(seconds, PASSING_TIMES.spout, PASSING_TIMES.collapse),
    };
  }

  /** The butterflies that came with the water, the drops thrown by the crash and by the slam, and the spray. */
  private plan(r: number): void {
    const random = seededRandom(this.options.seed * 3 + 11);
    const frames = this.host.textures;
    const total = PASSING_DURATION_MS / 1000;
    const dir = this.direction;
    const floor = r * 0.45;
    for (let index = 0; index < PASSING_BUTTERFLIES; index += 1) {
      const spread = (random() - 0.5) * 1.6;
      const start = {
        x: -Math.cos(this.heading + spread) * r * 3.5,
        y: -Math.sin(this.heading + spread) * r * 3.5 - r * 0.5,
      };
      const arrive = 0.08 + random() * 0.18;
      const spot = {
        angle: Math.atan2(start.y, start.x),
        radius: r * (1.1 + random() * 0.7),
        speed: 6 + random() * 3,
        climb: random(),
      };
      const inSpout = (time: number) => {
        const grow = phase(time, PASSING_TIMES.spout, PASSING_TIMES.spoutFull) ** 0.7;
        const angle = spot.angle + spot.speed * (time - arrive);
        const height = r * PASSING_SPOUT.height * grow * (0.15 + 0.8 * spot.climb);
        const reach = spot.radius * (1 + 0.5 * spot.climb * grow);
        return {
          x: Math.cos(angle) * reach,
          y: floor - height + Math.sin(angle) * reach * 0.32,
        };
      };
      const entry = inSpout(arrive);
      const control = { x: (start.x + entry.x) / 2, y: Math.min(start.y, entry.y) - r };
      const scatter = PASSING_TIMES.collapse + random() * 0.15;
      const leaving = inSpout(scatter);
      const away = Math.atan2(leaving.y - floor * 3, leaving.x);
      const reach = r * (4 + random() * 3);
      const path = (time: number) => {
        if (time < arrive) return curvePoint(start, control, entry, easeInOut(time / arrive));
        if (time < scatter) return inSpout(time);
        const out = 1 - Math.exp(-(time - scatter) * 2.5);
        return {
          x: leaving.x + Math.cos(away) * reach * out,
          y: leaving.y + Math.sin(away) * reach * out - r * 2 * out,
        };
      };
      const glowing = index % 3 === 0;
      const color = glowing
        ? mixColor(BETWEEN_COLORS.white, BETWEEN_COLORS.ice, random())
        : mixColor(BETWEEN_COLORS.deep, BETWEEN_COLORS.blue, random());
      this.swarm.add({
        path,
        born: 0,
        life: total - random() * 0.3,
        size: r * (0.3 + random() * 0.2),
        flap: 9 + random() * 4,
        glowing,
        tint: () => color,
        seed: random() * 100,
      });
    }
    const drop = (born: number, from: IArenaPoint2, angle: number, speed: number, up: number) => {
      const size = r * (0.06 + random() * 0.07);
      this.drops.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          x: from.x,
          y: from.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.7 - up,
          drag: 1,
          gravity: r * 14,
          born,
          life: 0.55 + random() * 0.45,
        },
        look: {
          size: (l) => size * 3.4 * (1 - l * 0.5),
          height: () => size * 0.7,
          alpha: (l) => 0.95 * (1 - l),
          tint: (l) =>
            mixStops(
              [BETWEEN_COLORS.white, BETWEEN_COLORS.ice, BETWEEN_COLORS.sky, BETWEEN_COLORS.blue],
              l,
            ),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    };
    for (let index = 0; index < PASSING_DROPLETS; index += 1)
      drop(
        random() * 0.12,
        { x: -dir.x * r * 0.8, y: -dir.y * r * 0.8 },
        this.heading + (random() - 0.5) * 2.4,
        r * (4 + random() * 7),
        r * (2 + random() * 5),
      );
    for (let index = 0; index < PASSING_SLAM_DROPLETS; index += 1) {
      const angle = random() * Math.PI * 2;
      drop(
        PASSING_TIMES.slam + random() * 0.1,
        { x: Math.cos(angle) * r * 0.9, y: floor + Math.sin(angle) * r * 0.3 },
        angle,
        r * (5 + random() * 7),
        r * (4 + random() * 7),
      );
    }
    for (let index = 0; index < PASSING_SPRAY; index += 1) {
      const angle = random() * Math.PI * 2;
      const size = r * (0.5 + random() * 0.5);
      const slam = index % 2 === 0;
      this.drops.add({
        texture: frames.glow,
        spawn: {
          x: Math.cos(angle) * r * 0.8,
          y: floor + Math.sin(angle) * r * 0.3,
          vx: Math.cos(angle) * r * 4,
          vy: -r * (2 + random() * 3),
          drag: 2.5,
          gravity: 0,
          born: (slam ? PASSING_TIMES.slam : 0) + random() * 0.15,
          life: 0.5 + random() * 0.4,
        },
        look: {
          size: (l) => size * (0.8 + l * 1.2),
          alpha: (l) => 0.45 * Math.sin(Math.PI * l),
          tint: (l) => mixColor(BETWEEN_COLORS.ice, BETWEEN_COLORS.blue, l),
        },
      });
    }
  }

  /** A ribbon of water shown in the scene, with the wider water it pours into the fluid along the same path. */
  private water(palette: IEnergyPalette, closed: boolean, seed: number): IPassingWater {
    const water = this.flow(palette, closed, this.options.seed + seed);
    const ink = this.flow(ENERGY_PALETTES.abyss, closed, this.options.seed + seed + 50);
    this.parts.addChild(water.mesh);
    this.feed.addChild(ink.mesh);
    return { water, ink };
  }

  private flow(palette: IEnergyPalette, closed: boolean, seed: number): ArenaEnergyFlow {
    return new ArenaEnergyFlow({
      palette,
      speed: closed ? 320 : 640,
      grain: 50,
      sharpness: 3,
      strands: 3,
      feather: closed ? 0.45 : 0.6,
      closed,
      samples: closed ? 48 : PASSING_SPOUT_POINTS,
      seed,
    });
  }

  private glow(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.glow);
    sprite.anchor.set(0.5);
    sprite.tint = tint;
    sprite.blendMode = "add";
    return sprite;
  }
}
