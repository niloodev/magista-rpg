import { ColorMatrixFilter, Container, Graphics, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
} from "@/modules/arena/services/arenaEnergyFlow";
import {
  ArenaEnergyFluid,
  ArenaEnergyTendril,
  FLUID_LINGER_MS,
} from "@/modules/arena/services/arenaEnergyFluid";
import { ENTROPIA_RUNES } from "@/modules/arena/services/arenaEntropiaEffect";
import { paintFalloff, paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import { NOX_COLORS, NOX_IDENTITY_MATRIX } from "@/modules/arena/services/arenaSoulDrainEffect";
import {
  ARENA_FX_FADE_FROM,
  easeOutBack,
  groupShape,
  mixStops,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  DEATH_COIL_POINTS,
  DEATH_DURATION_MS,
  DEATH_FLAMES,
  DEATH_FLOOR_TILT,
  DEATH_GROUP_GROWTH,
  DEATH_GROUP_MAX,
  DEATH_MOON_LIFT,
  DEATH_NIGHT_MATRIX,
  DEATH_PHASES,
  DEATH_PILLAR_RINGS,
  DEATH_RISING,
  DEATH_SHADOWS,
  DEATH_SHADOWS_MAX,
  DEATH_SLAM_RINGS,
  DEATH_SLAM_SPARKS,
  DEATH_SOULS,
  DEATH_SPADE,
} from "../../arenaDeathRebirthEffect.constants";
import type { IDeathScreen, IDeathShadow } from "../../arenaDeathRebirthEffect.types";
import { coilPath, coilWidth, crescent } from "../../arenaDeathRebirthEffect.utils";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

/**
 * The screen part of "Reencarnação da Morte", made with the energy kit: night falls in violet and a waning moon
 * rises above the target in a soft halo; a seal of Nox draws in on the floor, its runes glowing softly with
 * energy running around its rings; shadows rise out of the ground and coil onto the target (soft black bodies
 * with a violet rim, violet energy running along them, tapering to a glowing point) and pour a living shadow
 * that swirls around it and rises from the seal; the spectral shovel of Death is raised, drawn back and slams it,
 * its blade leaving a trail of energy, rings of energy racing over the floor and the living shadow blown out;
 * then a pillar of Nox fire bursts from the target to the sky, a column of energy and rings climbing it, threads
 * of energy carrying the shadow up, while the released souls rise. The living shadow keeps rising and fades by
 * itself after the spell (`linger`).
 */
export class DeathScreen implements IDeathScreen {
  private readonly root = new Container();
  private readonly fluidLayer = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.42,
    bloomScale: 0.75,
    blur: 6,
    quality: 3,
  });
  private readonly shade = new Graphics();
  private readonly moon = new Container();
  private readonly corona: Sprite;
  private readonly halo = new Graphics();
  private readonly disk = new Graphics();
  private readonly seal = new Container();
  private readonly sealGlow: Sprite;
  private readonly sealLines = new Graphics();
  private readonly sealRings: ArenaEnergyFlow[];
  private readonly sealInk: ArenaEnergyFlow;
  private readonly bodies = new Container();
  private readonly energies = new Container();
  private readonly spade = new Container();
  private readonly spadeGlow: Sprite;
  private readonly swing: ArenaEnergyFlow;
  private readonly slamRings: ArenaEnergyFlow[] = [];
  private readonly pillar: Sprite;
  private readonly pillarCore: Sprite;
  private readonly column: ArenaEnergyFlow;
  private readonly pillarRings: ArenaEnergyFlow[] = [];
  private readonly risingLayer = new Container();
  private readonly rising: ArenaEnergyTendril[] = [];
  private readonly flash = new Graphics();
  private readonly fire: ArenaFxParticles;
  private readonly souls: ArenaFxParticles;
  private readonly night = new ColorMatrixFilter();
  private readonly shadows: IDeathShadow[] = [];
  private fluid: ArenaEnergyFluid | null = null;
  private fluidSeconds = 0;
  private planned = false;
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
    this.fire = new ArenaFxParticles(diagonal, "add");
    this.souls = new ArenaFxParticles(diagonal, "add");
    this.corona = this.glow(NOX_COLORS.violet);
    this.sealGlow = this.glow(NOX_COLORS.purple);
    this.spadeGlow = this.glow(NOX_COLORS.purple);
    this.pillar = this.beam(NOX_COLORS.purple);
    this.pillarCore = this.beam(NOX_COLORS.soul);
    this.sealRings = [ENERGY_PALETTES.nox, ENERGY_PALETTES.dusk].map(
      (palette, index) =>
        new ArenaEnergyFlow({
          palette,
          speed: index === 0 ? 150 : -110,
          sharpness: 3,
          strands: 4,
          closed: true,
          samples: 72,
          seed: 30 + index * 7,
        }),
    );
    this.sealRings[0]?.setPath(circlePath(1, 72, 1), 0.07);
    this.sealRings[1]?.setPath(circlePath(0.62, 72, 1), 0.045);
    this.sealInk = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.nox,
      speed: 120,
      closed: true,
      samples: 64,
      seed: 21,
    });
    this.swing = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.dusk,
      speed: 600,
      grain: 60,
      sharpness: 3.5,
      strands: 3,
      feather: 0.6,
      samples: 32,
      seed: 61,
    });
    for (let index = 0; index < DEATH_SLAM_RINGS; index += 1)
      this.slamRings.push(
        new ArenaEnergyFlow({
          palette: index === 0 ? ENERGY_PALETTES.dusk : ENERGY_PALETTES.nox,
          speed: 260,
          sharpness: 3,
          strands: 4,
          closed: true,
          samples: 64,
          seed: 70 + index * 5,
        }),
      );
    this.column = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.nox,
      speed: 700,
      grain: 120,
      sharpness: 2.4,
      strands: 6,
      feather: 0.5,
      samples: 24,
      seed: 81,
    });
    for (let index = 0; index < DEATH_PILLAR_RINGS; index += 1)
      this.pillarRings.push(
        new ArenaEnergyFlow({
          palette: ENERGY_PALETTES.nox,
          speed: 200,
          sharpness: 3,
          strands: 3,
          closed: true,
          samples: 48,
          seed: 90 + index * 3,
        }),
      );
    this.flash.blendMode = "add";
    this.halo.blendMode = "add";
    this.sealLines.blendMode = "add";
    this.moon.addChild(this.corona, this.halo, this.disk);
    this.moon.visible = false;
    this.seal.addChild(this.sealGlow, this.sealLines, ...this.sealRings.map((ring) => ring.mesh));
    this.seal.visible = false;
    this.spade.addChild(this.spadeGlow);
    this.spade.visible = false;
    this.root.addChild(
      this.shade,
      this.seal,
      ...this.slamRings.map((ring) => ring.mesh),
      this.bodies,
      this.energies,
      this.moon,
      this.pillar,
      this.column.mesh,
      this.pillarCore,
      ...this.pillarRings.map((ring) => ring.mesh),
      this.risingLayer,
      this.fire.container,
      this.swing.mesh,
      this.spade,
      this.souls.container,
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
      this.host.screen.addWorldFilter(this.night);
      this.size = r;
      const shape = groupShape(this.group);
      this.grow = Math.min(Math.max(shape.spread * DEATH_GROUP_GROWTH, 1), DEATH_GROUP_MAX);
      this.middle = { x: shape.center.x * r, y: shape.center.y * r };
      const targets = (this.group ?? [HERE]).map((point) => ({ x: point.x * r, y: point.y * r }));
      const field = this.host.screen.field();
      this.plan(targets, { ...field, x: field.x - anchor.x, y: field.y - anchor.y });
    }
    for (const layer of [this.root, this.fluidLayer]) {
      layer.position.set(anchor.x, anchor.y);
      layer.scale.set(r / this.size);
    }
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const center = this.middle;
    const big = this.size * this.grow;
    const seconds = (t * DEATH_DURATION_MS) / 1000;
    const dusk = phase(t, 0, DEATH_PHASES.dusk) * (1 - phase(t, DEATH_PHASES.settle, 1));
    this.night.matrix = NOX_IDENTITY_MATRIX.map(
      (value, index) => value + ((DEATH_NIGHT_MATRIX[index] ?? 0) - value) * 0.85 * dusk,
    ) as ColorMatrixFilter["matrix"];
    this.shade.alpha = dusk;
    this.placeMoon(t, seconds, center, big);
    this.placeSeal(t, seconds, center, big);
    this.runShadows(t, seconds);
    this.placeSpade(t, seconds, center, big);
    this.runSwing(t, seconds, center, big);
    this.runSlam(t, seconds, center, big);
    this.placePillar(t, seconds, center, big);
    this.runRising(t, seconds);
    this.runFluid(t, seconds, center, big);
    this.flash.alpha =
      t >= DEATH_PHASES.hit ? 0.7 * (1 - phase(t, DEATH_PHASES.hit, DEATH_PHASES.hit + 0.06)) : 0;
    this.fire.update(seconds);
    this.souls.update(seconds);
  }

  linger(origin: Container, r: number, since: number): boolean {
    const fluid = this.fluid;
    if (!fluid || this.ended) return false;
    if (this.root.visible) {
      this.root.visible = false;
      this.host.screen.removeWorldFilter(this.night);
    }
    const anchor = this.host.screen.toScreen(origin);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    const seconds = DEATH_DURATION_MS / 1000 + since / 1000;
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
    this.host.screen.removeWorldFilter(this.night);
    this.night.destroy();
    this.root.filters = [];
    this.bloom.destroy();
    for (const shadow of this.shadows) {
      shadow.ink.mesh.removeFromParent();
      for (const flow of [shadow.body, shadow.energy, shadow.ink]) flow.destroy();
    }
    for (const tendril of this.rising) tendril.destroy();
    this.sealInk.mesh.removeFromParent();
    for (const flow of [
      ...this.sealRings,
      this.sealInk,
      this.swing,
      ...this.slamRings,
      this.column,
      ...this.pillarRings,
    ])
      flow.destroy();
    this.fluid?.destroy();
    this.fluidLayer.destroy({ children: true });
    this.root.destroy({ children: true });
  }

  /** The waning moon rising above the target in its violet halo, flaring at the rebirth. */
  private placeMoon(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const rise = easeOutBack(phase(t, DEATH_PHASES.moon, DEATH_PHASES.shadows + 0.08));
    const fade = 1 - phase(t, DEATH_PHASES.settle - 0.04, 0.97);
    this.moon.visible = rise > 0 && fade > 0;
    if (!this.moon.visible) return;
    const flare =
      t >= DEATH_PHASES.rebirth ? 1 - phase(t, DEATH_PHASES.rebirth, DEATH_PHASES.settle) : 0;
    this.moon.position.set(
      center.x,
      center.y - r * DEATH_MOON_LIFT - r * 0.6 * (1 - Math.min(rise, 1)),
    );
    this.moon.scale.set(Math.max(rise, 0) * (1 + 0.2 * flare));
    this.moon.alpha = fade;
    this.halo.rotation = seconds * 0.25;
    this.corona.width = this.corona.height = r * (4 + 0.4 * Math.sin(seconds * 3) + 2.5 * flare);
    this.corona.alpha = 0.55 + 0.25 * flare;
  }

  /**
   * The seal of Nox on the floor: it draws in, turns, breathes with a soft glow, energy runs around its rings,
   * and it flares when the shovel falls; it fades with the night.
   */
  private placeSeal(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const shown =
      phase(t, DEATH_PHASES.seal, DEATH_PHASES.seal + 0.08) *
      (1 - phase(t, DEATH_PHASES.settle, 0.97));
    this.seal.visible = shown > 0;
    if (!this.seal.visible) return;
    const flare =
      t >= DEATH_PHASES.hit ? 1 - phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth + 0.08) : 0;
    const breath = 0.5 + 0.5 * Math.sin(seconds * 2.2);
    const size = r * 2.6 * (0.7 + 0.3 * shown) * (1 + 0.12 * flare);
    this.seal.position.set(center.x, center.y + r * 0.35);
    this.seal.scale.set(size, size * DEATH_FLOOR_TILT);
    this.seal.alpha = Math.min(0.85 * shown + 0.6 * flare, 1);
    this.sealLines.rotation = -seconds * 0.4;
    this.sealLines.alpha = 0.8 + 0.2 * breath + 0.3 * flare;
    this.sealGlow.width = this.sealGlow.height = 2.7 + 0.15 * breath;
    this.sealGlow.alpha = (0.22 + 0.1 * breath + 0.5 * flare) * shown;
    this.sealRings.forEach((ring, index) => {
      ring.mesh.rotation = (index === 0 ? 1 : -1) * seconds * 0.3;
      ring.update(seconds, { alpha: (0.6 + 0.2 * breath + 0.4 * flare) * shown });
    });
  }

  /**
   * The shadows: they rise out of the ground around the target one after the other and coil onto it, winding
   * and writhing. Each is a soft black body with a violet rim, violet energy running along it, tapering to a
   * glowing point; they tighten while the target is held and are thrown back and fade at the rebirth, pouring
   * the living shadow all the while.
   */
  private runShadows(t: number, seconds: number): void {
    const r = this.size;
    const gone = phase(t, DEATH_PHASES.rebirth, DEATH_PHASES.rebirth + 0.08);
    const tight = phase(t, DEATH_PHASES.cracks, DEATH_PHASES.reap);
    for (const shadow of this.shadows) {
      const grow = phase(
        t,
        DEATH_PHASES.shadows + shadow.delay,
        DEATH_PHASES.seal + 0.1 + shadow.delay,
      );
      const alpha = Math.min(grow * 3, 1) * (1 - gone);
      if (alpha <= 0) {
        for (const flow of [shadow.body, shadow.energy, shadow.ink])
          flow.update(seconds, { alpha: 0 });
        shadow.tip.visible = false;
        continue;
      }
      const reach = (1 - (1 - grow) ** 3) * (1 - gone * 0.5);
      const base = { x: shadow.target.x, y: shadow.target.y + r * 0.35 };
      const points = coilPath(
        shadow.angle,
        shadow.wrap,
        r * (3.4 + gone * 1.5),
        r * (0.95 - 0.2 * tight),
        r * (1.3 - 0.5 * tight),
        DEATH_FLOOR_TILT,
        seconds * shadow.speed,
        Math.max(reach, 0.02),
        DEATH_COIL_POINTS,
      ).map((point) => ({ x: base.x + point.x, y: base.y + point.y }));
      shadow.body.setPath(points, (along) => r * 0.62 * coilWidth(along));
      shadow.energy.setPath(points, (along) => r * 0.2 * coilWidth(along));
      shadow.ink.setPath(points, (along) => r * (1.1 - 0.5 * along));
      shadow.body.update(seconds, { alpha: 0.95 * alpha });
      shadow.energy.update(seconds, { alpha });
      shadow.ink.update(seconds, { alpha: alpha * (1 - tight * 0.4) });
      const tip = points[points.length - 1];
      shadow.tip.visible = tip !== undefined;
      if (tip) {
        shadow.tip.position.set(tip.x, tip.y);
        shadow.tip.width = shadow.tip.height =
          r * (0.45 + 0.1 * Math.sin(seconds * 9 + shadow.speed));
        shadow.tip.alpha = 0.55 * alpha;
      }
    }
  }

  /**
   * The shovel of Death: a purple spectral shadow of Talis's shovel fades in raised high beside the target, is
   * drawn back, then comes down and slams it flat, bounces a little and fades.
   */
  private placeSpade(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const shown =
      phase(t, DEATH_PHASES.raise, DEATH_PHASES.raise + 0.05) *
      (1 - phase(t, DEATH_PHASES.hit + 0.04, DEATH_PHASES.rebirth + 0.05));
    this.spade.visible = shown > 0;
    if (!this.spade.visible) return;
    this.spade.position.set(center.x + DEATH_SPADE.hold.x * r, center.y + DEATH_SPADE.hold.y * r);
    this.spade.scale.set(r);
    this.spade.alpha = shown * (0.88 + 0.12 * Math.sin(seconds * 9));
    this.spade.rotation = this.spadeAngle(t);
  }

  /** Angle of the shovel: drawn back while it is raised, slammed down onto the target, a small bounce after. */
  private spadeAngle(t: number): number {
    const back = DEATH_SPADE.raised - 0.3;
    if (t < DEATH_PHASES.reap)
      return DEATH_SPADE.raised - 0.3 * phase(t, DEATH_PHASES.raise, DEATH_PHASES.reap) ** 0.5;
    if (t < DEATH_PHASES.hit)
      return (
        back + (DEATH_SPADE.slam - back) * phase(t, DEATH_PHASES.reap, DEATH_PHASES.hit) ** 2.4
      );
    const since = phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth + 0.05);
    return DEATH_SPADE.slam - 0.22 * Math.sin(Math.PI * Math.min(since * 2, 1)) * (1 - since);
  }

  /** The trail of the blade as it comes down: a ribbon of energy along the arc, thick at the blade, fading after. */
  private runSwing(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const fade = 1 - phase(t, DEATH_PHASES.hit, DEATH_PHASES.hit + 0.04);
    if (t < DEATH_PHASES.reap || fade <= 0) {
      this.swing.update(seconds, { alpha: 0 });
      return;
    }
    const pivot = { x: center.x + DEATH_SPADE.hold.x * r, y: center.y + DEATH_SPADE.hold.y * r };
    const from = DEATH_SPADE.raised - 0.3;
    const to = this.spadeAngle(Math.min(t, DEATH_PHASES.hit));
    const radius = r * (DEATH_SPADE.tip - 0.45);
    const arc = Array.from({ length: 24 }, (_, index) => {
      const a = from + ((to - from) * index) / 23;
      return { x: pivot.x + Math.cos(a) * radius, y: pivot.y + Math.sin(a) * radius };
    });
    this.swing.setPath(arc, (along) => r * 0.9 * along ** 1.6);
    this.swing.update(seconds, { alpha: 0.9 * fade });
  }

  /** The slam: rings of energy racing out over the floor from the target, one after the other. */
  private runSlam(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const since = phase(t, DEATH_PHASES.hit, DEATH_PHASES.settle);
    this.slamRings.forEach((ring, index) => {
      const delay = index * 0.1;
      const life = phase(since, delay, delay + 0.55);
      if (since <= 0 || life <= 0 || life >= 1) {
        ring.update(seconds, { alpha: 0 });
        return;
      }
      const radius = r * (0.9 + (6 - index * 1.4) * life ** 0.6);
      ring.setPath(
        circlePath(radius, 64, DEATH_FLOOR_TILT).map((point) => ({
          x: point.x + center.x,
          y: point.y + center.y + r * 0.35,
        })),
        r * (0.55 * (1 - life) + 0.08),
      );
      ring.update(seconds, { alpha: (1 - life) * (1 - index * 0.25) });
    });
  }

  /**
   * The rebirth: a pillar of Nox fire from the target to the sky, a column of energy running up it around a
   * flickering white core, and rings of energy climbing along it, then fading.
   */
  private placePillar(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const rise = phase(t, DEATH_PHASES.rebirth, DEATH_PHASES.rebirth + 0.04);
    const fade = 1 - phase(t, DEATH_PHASES.settle - 0.06, 0.96);
    const visible = rise > 0 && fade > 0;
    this.pillar.visible = this.pillarCore.visible = visible;
    if (!visible) {
      this.column.update(seconds, { alpha: 0 });
      for (const ring of this.pillarRings) ring.update(seconds, { alpha: 0 });
      return;
    }
    const reach = (center.y - this.top + r) * rise;
    for (const [beam, width, alpha] of [
      [this.pillar, 4, 0.7],
      [this.pillarCore, 1.4, 0.85],
    ] as const) {
      beam.position.set(center.x, center.y + r * 0.6);
      beam.height = reach + r * 0.6;
      beam.width = r * width * (1 + 0.06 * Math.sin(seconds * 30)) * (0.6 + 0.4 * fade);
      beam.alpha = alpha * fade;
    }
    this.column.setPath(
      [
        { x: center.x, y: center.y + r * 0.4 },
        { x: center.x, y: center.y + r * 0.4 - reach },
      ],
      (along) => r * 2.2 * (1 - 0.45 * along),
    );
    this.column.update(seconds, { alpha: 0.85 * fade });
    this.pillarRings.forEach((ring, index) => {
      const climb = (seconds * 0.8 + index / DEATH_PILLAR_RINGS) % 1;
      const radius = r * (1.9 - climb * 0.9);
      const y = center.y + r * 0.4 - climb * reach * 0.8;
      ring.setPath(
        circlePath(radius, 48, 0.3).map((point) => ({ x: point.x + center.x, y: point.y + y })),
        r * 0.14,
      );
      ring.update(seconds, { alpha: 0.85 * Math.sin(Math.PI * climb) * fade });
    });
  }

  /**
   * The rebirth sends threads of violet energy up from the target along the pillar, each leaving a wake of
   * shadow that rises with it and comes apart.
   */
  private runRising(t: number, seconds: number): void {
    this.rising.forEach((tendril, index) => {
      const start = DEATH_PHASES.rebirth + index * 0.012;
      tendril.update(seconds, {
        head: phase(t, start, start + 0.08) ** 0.7,
        tail: phase(t, DEATH_PHASES.settle - 0.06, DEATH_PHASES.settle + 0.08),
        alpha: 0.95,
      });
    });
  }

  /**
   * The living shadow: the shadows and the seal pour darkness into a fluid that swirls around the target and
   * rises from the floor while it is held, is blown out at the slam, and climbs away with the pillar.
   */
  private runFluid(t: number, seconds: number, center: IArenaPoint2, r: number): void {
    const fluid = this.fluid;
    if (!fluid) return;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const seal =
      phase(t, DEATH_PHASES.seal, DEATH_PHASES.seal + 0.08) *
      (1 - phase(t, DEATH_PHASES.hit, DEATH_PHASES.rebirth));
    this.sealInk.update(seconds, { alpha: 0.7 * seal });
    const floor = { x: center.x, y: center.y + r * 0.35 };
    const slam = t >= DEATH_PHASES.hit && t < DEATH_PHASES.rebirth + 0.04;
    const reborn = t >= DEATH_PHASES.rebirth + 0.04;
    fluid.update(delta, {
      inject: 3.4,
      decay: reborn ? 0.58 : 0.55,
      bias: slam
        ? { center: floor, radial: r * 7, swirl: r * 1.2 }
        : reborn
          ? { center: floor, radial: r * 1.4, swirl: r * 1.4, drift: { x: 0, y: -r * 4.5 } }
          : { center: floor, radial: -r * 0.8, swirl: r * 2.6, drift: { x: 0, y: -r * 1 } },
    });
  }

  /**
   * Plans what is drawn once (the darkness, the moon, the seal, the shovel, the flash), the living shadow and
   * what feeds it (the shadows, the seal, the rising threads), and the particles.
   */
  private plan(targets: IArenaPoint2[], field: IArenaFxField): void {
    const center = this.middle;
    const r = this.size * this.grow;
    const random = this.random;
    this.top = field.y;
    paintFalloff(
      this.shade,
      center.x,
      center.y - r,
      r * 6.5,
      field.diagonal * 1.1,
      NOX_COLORS.void,
      0.6,
    );
    this.shade.alpha = 0;
    paintGlow(this.flash, center.x, center.y, r * 3.2, NOX_COLORS.soul);
    this.flash.alpha = 0;
    this.drawMoon(r);
    this.drawSeal();
    this.drawSpade();
    const fluid = new ArenaEnergyFluid(this.host, {
      area: { x: field.x, y: field.y, width: field.width, height: field.height },
      palette: ENERGY_PALETTES.nox,
      mode: "shadow",
      decay: 0.55,
      turbulence: { scale: r * 2, force: r * 6 },
      vorticity: 30,
      haze: 0.9,
      gain: 1.1,
      seed: 13,
    });
    this.fluid = fluid;
    this.fluidLayer.addChild(fluid.view);
    this.sealInk.setPath(
      circlePath(r * 2.3, 64, DEATH_FLOOR_TILT).map((point) => ({
        x: point.x + center.x,
        y: point.y + center.y + r * 0.35,
      })),
      r * 0.6,
    );
    fluid.sources.addChild(this.sealInk.mesh);
    const count = Math.min(Math.max(DEATH_SHADOWS, targets.length * 3), DEATH_SHADOWS_MAX);
    for (let index = 0; index < count; index += 1) {
      const target = targets[index % targets.length] ?? center;
      const turn = Math.floor(index / targets.length) / Math.ceil(count / targets.length);
      const shadow: IDeathShadow = {
        target,
        angle: turn * Math.PI * 2 + (index % targets.length) * 0.7 + (random() - 0.5) * 0.4,
        wrap: index % 2 === 0 ? 1 : -1,
        delay: random() * 0.08,
        speed: 2.5 + random() * 2,
        body: this.coilFlow(index, "body"),
        energy: this.coilFlow(index, "energy"),
        ink: this.coilFlow(index, "ink"),
        tip: this.glow(NOX_COLORS.lavender),
      };
      this.shadows.push(shadow);
      this.bodies.addChild(shadow.body.mesh);
      this.energies.addChild(shadow.energy.mesh, shadow.tip);
      fluid.sources.addChild(shadow.ink.mesh);
    }
    for (let index = 0; index < DEATH_RISING; index += 1) {
      const share = index / (DEATH_RISING - 1) - 0.5;
      const tendril = new ArenaEnergyTendril(fluid, {
        palette: index % 2 === 0 ? ENERGY_PALETTES.nox : ENERGY_PALETTES.dusk,
        from: { x: center.x + share * r * 1.4, y: center.y + r * 0.3 },
        to: { x: center.x + share * r * 3, y: field.y - r },
        bend: (index % 2 === 0 ? 1 : -1) * (0.06 + Math.abs(share) * 0.12),
        width: r * 0.32,
        speed: 520,
        grain: 110,
        strands: 4,
        seed: index * 11 + 3,
      });
      this.rising.push(tendril);
      this.risingLayer.addChild(tendril.view);
    }
    this.planParticles(center, r);
  }

  /** One shadow's ribbons: its soft dark body, the violet energy on it, or the wider ink it pours. */
  private coilFlow(index: number, part: "body" | "energy" | "ink"): ArenaEnergyFlow {
    if (part === "body")
      return new ArenaEnergyFlow({
        palette: ENERGY_PALETTES.shade,
        blend: "normal",
        density: 3.5,
        speed: 90,
        grain: 70,
        sharpness: 1.2,
        strands: 2,
        feather: 0.85,
        samples: DEATH_COIL_POINTS + 1,
        seed: index * 5 + 80,
      });
    const ink = part === "ink";
    return new ArenaEnergyFlow({
      palette: index % 3 === 0 ? ENERGY_PALETTES.dusk : ENERGY_PALETTES.nox,
      speed: ink ? 140 : 260,
      grain: ink ? 60 : 45,
      sharpness: ink ? 1.5 : 4.5,
      strands: 2,
      feather: ink ? 1 : 0.25,
      samples: DEATH_COIL_POINTS + 1,
      seed: index * 5 + (ink ? 40 : 0),
    });
  }

  /** Sparks of the slam, flames of the pillar and the released souls rising. */
  private planParticles(center: IArenaPoint2, r: number): void {
    const random = this.random;
    const frames = this.host.textures;
    const seconds = DEATH_DURATION_MS / 1000;
    const hit = DEATH_PHASES.hit * seconds;
    for (let index = 0; index < DEATH_SLAM_SPARKS; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (5 + random() * 6);
      const size = r * (0.1 + random() * 0.1);
      this.fire.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          x: center.x,
          y: center.y + r * 0.35,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * DEATH_FLOOR_TILT - r * 2,
          drag: 3,
          gravity: r * 6,
          born: hit,
          life: 0.4 + random() * 0.3,
        },
        look: {
          size: (l) => size * 3 * (1 - l * 0.6),
          height: () => size * 0.5,
          alpha: (l) => 1 - l,
          tint: (l) => mixStops([NOX_COLORS.white, NOX_COLORS.lavender, NOX_COLORS.violet], l),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
    const rebirth = DEATH_PHASES.rebirth * seconds;
    for (let index = 0; index < DEATH_FLAMES; index += 1) {
      const size = r * (0.35 + random() * 0.45);
      const sway = random() * Math.PI * 2;
      const life = 0.5 + random() * 0.4;
      this.fire.add({
        texture: frames.glow,
        spawn: {
          x: center.x + (random() - 0.5) * r * 1.6,
          y: center.y + r * 0.3,
          vx: 0,
          vy: -r * (12 + random() * 10),
          drag: 0.3,
          gravity: 0,
          born: rebirth + random() * (DEATH_PHASES.settle * seconds - rebirth - life * 0.5),
          life,
        },
        look: {
          size: (l) => size * (1 - l * 0.6),
          height: (l) => size * (1.6 - l),
          alpha: (l) => 0.85 * Math.sin(Math.PI * Math.min(l * 1.3, 1)),
          tint: (l) =>
            mixStops(
              [
                NOX_COLORS.white,
                NOX_COLORS.lavender,
                NOX_COLORS.violet,
                NOX_COLORS.purple,
                NOX_COLORS.deep,
              ],
              l,
            ),
          drift: (age) => ({ x: Math.sin(age * 10 + sway) * r * 0.25, y: 0 }),
        },
      });
    }
    const release = (DEATH_PHASES.rebirth + 0.03) * seconds;
    for (let index = 0; index < DEATH_SOULS; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = r * (0.6 + random() * 3.6);
      const size = r * (0.12 + random() * 0.16);
      const sway = random() * Math.PI * 2;
      const flicker = random() * 10;
      this.souls.add({
        texture: index % 4 === 0 ? frames.spark : frames.glow,
        spawn: {
          x: center.x + Math.cos(angle) * distance,
          y: center.y + r * 0.35 + Math.sin(angle) * distance * DEATH_FLOOR_TILT,
          vx: 0,
          vy: -r * (1.2 + random() * 1.4),
          drag: 0,
          gravity: -r * 0.4,
          born: release + random() * 0.9,
          life: 0.9 + random() * 0.7,
        },
        look: {
          size: (l) => size * (1 - l * 0.4),
          height: (l) => size * (1.3 - l * 0.3),
          alpha: (l, age) => Math.sin(Math.PI * l) * (0.65 + 0.35 * Math.sin(age * 14 + flicker)),
          tint: (l) =>
            mixStops(
              [NOX_COLORS.white, NOX_COLORS.soul, NOX_COLORS.lavender, NOX_COLORS.violet],
              l,
            ),
          drift: (age) => ({ x: Math.sin(age * 3 + sway) * r * 0.35, y: 0 }),
        },
      });
    }
  }

  /**
   * The waning moon, drawn once: a halo of thin violet rings, the dark part of the disk faintly lit, and a
   * pale crescent with a white edge, as if cut out of the night.
   */
  private drawMoon(r: number): void {
    for (let ring = 0; ring < 3; ring += 1)
      this.halo.circle(0, 0, r * (1.35 + ring * 0.32)).stroke({
        width: r * 0.03,
        color: ring === 0 ? NOX_COLORS.lavender : NOX_COLORS.violet,
        alpha: 0.45 - ring * 0.12,
      });
    this.disk.circle(0, 0, r).fill({ color: NOX_COLORS.shadow, alpha: 0.85 });
    this.disk.poly(crescent(r, r * 0.9, { x: -r * 0.42, y: -r * 0.08 })).fill({
      color: NOX_COLORS.pale,
    });
    this.disk.poly(crescent(r * 0.97, r * 0.92, { x: -r * 0.36, y: -r * 0.07 })).fill({
      color: NOX_COLORS.white,
      alpha: 0.9,
    });
  }

  /**
   * The seal of Nox at unit size, glowing purple: double rings with a band of runes between them, an inner ring
   * of smaller runes, an inverted triangle and a crescent at the heart, and ticks; every line has a soft violet
   * glow under a bright core.
   */
  private drawSeal(): void {
    const seal = this.sealLines;
    const glowLine = (draw: () => void, width: number, alpha = 1) => {
      draw();
      seal.stroke({
        width: width * 3.2,
        color: NOX_COLORS.purple,
        alpha: 0.35 * alpha,
        cap: "round",
        join: "round",
      });
      draw();
      seal.stroke({
        width,
        color: NOX_COLORS.lavender,
        alpha: 0.95 * alpha,
        cap: "round",
        join: "round",
      });
    };
    for (const radius of [1, 0.84, 0.62, 0.48])
      glowLine(() => seal.circle(0, 0, radius), radius > 0.7 ? 0.025 : 0.018);
    glowLine(() => seal.poly([0, 0.48, -0.415, -0.24, 0.415, -0.24]), 0.02);
    glowLine(() => seal.arc(0.06, 0, 0.2, Math.PI * 0.55, Math.PI * 1.45), 0.03);
    const band = (count: number, radius: number, height: number) => {
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const shape = ENTROPIA_RUNES[(index * 5) % ENTROPIA_RUNES.length] ?? [];
        const cos = Math.cos(angle + Math.PI / 2);
        const sin = Math.sin(angle + Math.PI / 2);
        const at = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
        for (const stroke of shape) {
          const points: number[] = [];
          for (let point = 0; point < stroke.length; point += 2) {
            const x = (stroke[point] ?? 0) * height;
            const y = (stroke[point + 1] ?? 0) * height;
            points.push(at.x + x * cos - y * sin, at.y + x * sin + y * cos);
          }
          glowLine(() => seal.poly(points, false), height * 0.12);
        }
      }
    };
    band(20, 0.92, 0.11);
    band(12, 0.55, 0.08);
    for (let index = 0; index < 36; index += 1) {
      const angle = (index / 36) * Math.PI * 2;
      const inner = index % 3 === 0 ? 0.66 : 0.69;
      seal
        .moveTo(Math.cos(angle) * 0.72, Math.sin(angle) * 0.72)
        .lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      seal.stroke({ width: 0.012, color: NOX_COLORS.lavender, alpha: 0.8 });
    }
  }

  /**
   * The spectral shovel at unit size (one token radius), held at the origin and pointing along +x: only the
   * shadow of it, a deep purple silhouette with a soft violet glow, a bright rim and a lighter face on the blade.
   */
  private drawSpade(): void {
    const g = new Graphics();
    const { neck, tip } = DEATH_SPADE;
    const handle: number[] = [-0.35, -0.08, neck, -0.08, neck, 0.08, -0.35, 0.08];
    const grip: number[] = [-0.35, -0.2, -0.75, -0.2, -0.75, 0.2, -0.35, 0.2];
    const half = 0.6;
    const blade: number[] = [neck, -half * 0.55, neck + 0.12, -half];
    for (let step = 0; step <= 14; step += 1) {
      const a = -Math.PI / 2 + (step / 14) * Math.PI;
      blade.push(neck + 0.12 + (tip - neck - 0.12) * (0.5 + 0.5 * Math.cos(a)), half * Math.sin(a));
    }
    blade.push(neck + 0.12, half, neck, half * 0.55);
    const face: number[] = [];
    for (let step = 0; step <= 14; step += 1) {
      const a = -Math.PI / 2 + (step / 14) * Math.PI;
      face.push(
        neck + 0.3 + (tip - neck - 0.45) * (0.5 + 0.5 * Math.cos(a)),
        half * 0.62 * Math.sin(a),
      );
    }
    for (const shape of [handle, blade])
      g.poly(shape).stroke({ width: 0.22, color: NOX_COLORS.purple, alpha: 0.28, join: "round" });
    g.poly(grip).stroke({ width: 0.1, color: NOX_COLORS.purple, alpha: 0.3, join: "round" });
    for (const shape of [handle, blade])
      g.poly(shape).fill({ color: NOX_COLORS.deep, alpha: 0.78 });
    g.poly(grip).stroke({ width: 0.07, color: NOX_COLORS.deep, alpha: 0.85, join: "round" });
    g.poly(face).fill({ color: NOX_COLORS.violet, alpha: 0.35 });
    for (const shape of [handle, blade])
      g.poly(shape).stroke({ width: 0.04, color: NOX_COLORS.lavender, alpha: 0.95, join: "round" });
    g.poly(grip).stroke({ width: 0.025, color: NOX_COLORS.lavender, alpha: 0.9, join: "round" });
    g.moveTo(tip - 0.02, -half * 0.5)
      .quadraticCurveTo(tip + 0.06, 0, tip - 0.02, half * 0.5)
      .stroke({ width: 0.06, color: NOX_COLORS.white, alpha: 0.85 });
    g.blendMode = "add";
    this.spadeGlow.position.set((neck + tip) / 2, 0);
    this.spadeGlow.width = this.spadeGlow.height = 2.6;
    this.spadeGlow.alpha = 0.6;
    this.spade.addChild(g);
  }

  private glow(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.glow);
    sprite.anchor.set(0.5);
    sprite.tint = tint;
    sprite.blendMode = "add";
    return sprite;
  }

  private beam(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.beam);
    sprite.anchor.set(0.5, 0);
    sprite.rotation = Math.PI;
    sprite.tint = tint;
    sprite.blendMode = "add";
    sprite.visible = false;
    return sprite;
  }
}
