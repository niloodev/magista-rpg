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
import { paintGlow } from "@/modules/arena/services/arenaFxScreen";
import { ArenaFxParticles } from "@/modules/arena/services/arenaFxParticles";
import {
  ARENA_FX_FADE_FROM,
  easeOutBack,
  groupShape,
  mixColor,
  phase,
  type IArenaFxField,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  DIVINE_COLORS,
  DIVINE_DESCENT_CHANNELS,
  DIVINE_DURATION_MS,
  DIVINE_FLUID_PALETTES,
  DIVINE_GOLDEN_MATRIX,
  DIVINE_GROUP_GROWTH,
  DIVINE_GROUP_MAX,
  DIVINE_HALO,
  DIVINE_IDENTITY_MATRIX,
  DIVINE_PHASES,
  DIVINE_PLUMES,
  DIVINE_RELEASE_CHANNELS,
} from "../../arenaDivineCallEffect.constants";
import type { DivineMood, IDivineScreen } from "../../arenaDivineCallEffect.types";

/** The screen part is drawn around the target: it follows it on the screen and with the zoom. */
const HERE: IArenaPoint2 = { x: 0, y: 0 };

/**
 * The screen part of "Chamado Divino": the heavens open (the world turns golden and spotlights pour down), a
 * halo of flowing golden energy forms above the target, channels of flowing energy pour down from it
 * onto the target, and the call lands: a column
 * of light and energy comes down, a flash, a ring of energy racing over the ground; a blessing lifts motes of light, a judgment throws sparks and flares white. Then the halo rises
 * away, the flow fades, and feathers of light drift down.
 */
export class DivineScreen implements IDivineScreen {
  private readonly root = new Container();
  private readonly beams: Sprite[] = [];
  private readonly halo = new Container();
  private readonly haloGlow: Sprite;
  private readonly haloLines = new Graphics();
  private readonly glints: Sprite[] = [];
  private readonly haloRays: Sprite[] = [];
  private haloRadius = 1;
  private readonly rings: ArenaEnergyFlow[] = [];
  private fluid: ArenaEnergyFluid | null = null;
  private readonly fluidLayer = new Container();
  private readonly haloInk = new ArenaEnergyFlow({
    palette: ENERGY_PALETTES.holy,
    closed: true,
    samples: 72,
    speed: 150,
    seed: 61,
  });
  private fluidSeconds = 0;
  private readonly flows = new Container();
  private readonly descent: ArenaEnergyTendril[] = [];
  private readonly release: ArenaEnergyTendril[] = [];
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.45,
    bloomScale: 0.7,
    brightness: 1,
    blur: 6,
    quality: 3,
  });
  private readonly column: ArenaEnergyFlow;
  private readonly columnBeam: Sprite;
  private readonly ground: ArenaEnergyFlow;
  private readonly flash = new Graphics();
  private readonly plumes: ArenaFxParticles;
  private readonly golden = new ColorMatrixFilter();
  private planned = false;
  private ended = false;
  private size = 1;
  private grow = 1;
  private middle: IArenaPoint2 = HERE;
  private haloAt: IArenaPoint2 = HERE;
  private top = 0;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly random: () => number,
    private readonly mood: DivineMood,
    private readonly group?: IArenaPoint2[],
  ) {
    const { width, height } = host.screen.size();
    const diagonal = Math.hypot(width, height);
    this.plumes = new ArenaFxParticles(diagonal, "add");
    for (let index = 0; index < 5; index += 1) {
      const beam = new Sprite(host.textures.beam);
      beam.anchor.set(0.5, 0);
      beam.tint = index % 2 === 0 ? DIVINE_COLORS.cream : DIVINE_COLORS.gold;
      beam.blendMode = "add";
      beam.visible = false;
      this.beams.push(beam);
    }
    this.haloGlow = new Sprite(host.textures.glow);
    this.haloGlow.anchor.set(0.5);
    this.haloGlow.tint = DIVINE_COLORS.cream;
    this.haloGlow.blendMode = "add";
    this.haloLines.blendMode = "add";
    for (let index = 0; index < 2; index += 1) {
      const glint = new Sprite(host.textures.glow);
      glint.anchor.set(0.5);
      glint.tint = DIVINE_COLORS.white;
      glint.blendMode = "add";
      this.glints.push(glint);
    }
    for (let index = 0; index < 3; index += 1) {
      const ray = new Sprite(host.textures.beam);
      ray.anchor.set(0.5, 0);
      ray.tint = index === 1 ? DIVINE_COLORS.cream : DIVINE_COLORS.light;
      ray.blendMode = "add";
      this.haloRays.push(ray);
    }
    for (const [palette, speed, sharpness] of [
      [ENERGY_PALETTES.holy, 150, 2.6],
      [ENERGY_PALETTES.gold, -110, 3.2],
    ] as const)
      this.rings.push(
        new ArenaEnergyFlow({
          palette,
          speed,
          sharpness,
          closed: true,
          strands: 6,
          samples: 72,
          seed: this.rings.length * 7,
        }),
      );
    this.column = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.holy,
      speed: 520,
      strands: 8,
      grain: 120,
      sharpness: 2.4,
      samples: 24,
      seed: 41,
    });
    this.columnBeam = new Sprite(host.textures.beam);
    this.columnBeam.anchor.set(0.5, 0);
    this.columnBeam.rotation = Math.PI;
    this.columnBeam.tint = DIVINE_COLORS.cream;
    this.columnBeam.blendMode = "add";
    this.columnBeam.visible = false;
    this.ground = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.gold,
      speed: 170,
      strands: 5,
      sharpness: 2.8,
      closed: true,
      samples: 64,
      seed: 53,
    });
    this.flash.blendMode = "add";
    this.halo.addChild(
      ...this.haloRays,
      this.haloGlow,
      this.haloLines,
      ...this.rings.map((ring) => ring.mesh),
      ...this.glints,
    );
    this.halo.visible = false;
    this.root.addChild(
      ...this.beams,
      this.ground.mesh,
      this.flows,
      this.halo,
      this.columnBeam,
      this.column.mesh,
      this.plumes.container,
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
      this.host.screen.addWorldFilter(this.golden);
      this.size = r;
      const shape = groupShape(this.group);
      this.grow = Math.min(Math.max(shape.spread * DIVINE_GROUP_GROWTH, 1), DIVINE_GROUP_MAX);
      this.middle = { x: shape.center.x * r, y: shape.center.y * r };
      this.haloAt = { x: this.middle.x, y: this.middle.y - r * DIVINE_HALO.lift * this.grow };
      const targets = (this.group ?? [HERE]).map((point) => ({ x: point.x * r, y: point.y * r }));
      const field = this.host.screen.field();
      this.plan(targets, { ...field, x: field.x - anchor.x, y: field.y - anchor.y }, r);
    }
    this.root.position.set(anchor.x, anchor.y);
    this.root.scale.set(r / this.size);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    this.root.alpha = 1 - phase(t, ARENA_FX_FADE_FROM, 1);
    const seconds = (t * DIVINE_DURATION_MS) / 1000;
    const big = this.size * this.grow;
    const open = phase(t, 0, DIVINE_PHASES.open) * (1 - phase(t, DIVINE_PHASES.settle, 1));
    const flash =
      t >= DIVINE_PHASES.impact
        ? 1 - phase(t, DIVINE_PHASES.impact, DIVINE_PHASES.impact + 0.06)
        : 0;
    this.golden.matrix = DIVINE_IDENTITY_MATRIX.map(
      (value, index) =>
        value +
        ((DIVINE_GOLDEN_MATRIX[index] ?? 0) - value) * Math.min(0.9 * open + 0.6 * flash, 1.4),
    ) as ColorMatrixFilter["matrix"];
    this.placeBeams(seconds, open, big);
    this.placeHalo(t, seconds, big);
    this.runFlows(t, seconds);
    this.placeColumn(t, seconds, big);
    this.placeGround(t, seconds, big);
    this.flash.alpha = (this.mood === "damage" ? 0.85 : 0.6) * flash;
    this.plumes.update(seconds);
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    this.host.screen.removeWorldFilter(this.golden);
    this.golden.destroy();
    this.root.filters = [];
    this.bloom.destroy();
    for (const flow of [...this.rings, this.column, this.ground]) flow.destroy();
    for (const channel of [...this.descent, ...this.release]) channel.destroy();
    this.haloInk.destroy();
    this.fluid?.destroy();
    this.fluidLayer.destroy({ children: true });
    this.root.destroy({ children: true });
  }

  /** The heavens open: soft spotlights pour from above the screen onto the target, swaying and breathing. */
  private placeBeams(seconds: number, open: number, big: number): void {
    this.beams.forEach((beam, index) => {
      beam.visible = open > 0;
      if (!beam.visible) return;
      const share = index / (this.beams.length - 1) - 0.5;
      const top = {
        x: this.middle.x + share * big * 14 + Math.sin(seconds * 0.8 + index) * big * 0.6,
        y: this.top,
      };
      const toward = { x: this.middle.x - top.x, y: this.middle.y - top.y };
      beam.position.set(top.x, top.y);
      beam.rotation = Math.atan2(toward.y, toward.x) - Math.PI / 2;
      beam.height = Math.hypot(toward.x, toward.y) + big;
      beam.width = big * (2.4 + 0.8 * (index % 3));
      beam.alpha = (0.22 + 0.06 * Math.sin(seconds * 1.4 + index * 2)) * open;
    });
  }

  /**
   * The halo: a crisp ring of light with energy flowing in it, glints running around it and soft rays falling from it
   * onto the target, around a soft sun; it opens
   * out of nothing, flares at the call, and rises away and fades at the end.
   */
  private placeHalo(t: number, seconds: number, big: number): void {
    const appear = easeOutBack(phase(t, DIVINE_PHASES.halo, DIVINE_PHASES.descend));
    const leave = phase(t, DIVINE_PHASES.settle - 0.04, 1);
    this.halo.visible = appear > 0 && leave < 1;
    if (!this.halo.visible) return;
    const flare =
      t >= DIVINE_PHASES.impact ? 1 - phase(t, DIVINE_PHASES.impact, DIVINE_PHASES.settle) : 0;
    this.halo.position.set(this.haloAt.x, this.haloAt.y - big * 2.5 * leave ** 1.5);
    this.halo.scale.set(Math.max(appear, 0) * (1 + 0.2 * flare));
    this.halo.alpha = 1 - leave;
    this.haloGlow.width = this.haloGlow.height =
      big * (7 + 2 * flare + 0.4 * Math.sin(seconds * 3));
    this.haloGlow.alpha = 0.4 + 0.3 * flare;
    this.haloLines.alpha = 0.85 + 0.15 * Math.sin(seconds * 2.4) + 0.3 * flare;
    for (const ring of this.rings) ring.update(seconds, { alpha: 0.85 });
    const radius = this.haloRadius;
    this.glints.forEach((glint, index) => {
      const angle = seconds * 1.4 + index * Math.PI;
      const tangent = Math.atan2(Math.cos(angle) * DIVINE_HALO.squash, -Math.sin(angle));
      glint.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * DIVINE_HALO.squash);
      glint.rotation = tangent;
      glint.width = big * 1.4;
      glint.height = big * 0.32;
      glint.alpha = 0.6 + 0.4 * Math.sin(seconds * 5 + index * 2);
    });
    const down = this.middle.y - this.haloAt.y;
    this.haloRays.forEach((ray, index) => {
      const spread = (index - 1) * 0.22;
      ray.rotation = spread;
      ray.height = (down + big) / Math.cos(spread);
      ray.width = big * (index === 1 ? 2.6 : 1.8);
      ray.alpha = (0.16 + 0.05 * Math.sin(seconds * 1.6 + index)) * (1 + flare);
    });
  }

  /**
   * The flowing energy, in channels: from the halo down onto the targets until the call, and out of the target at
   * the call (rising as a blessing, spreading out as a judgment), each reaching out and then draining away.
   */
  private runFlows(t: number, seconds: number): void {
    this.descent.forEach((channel, index) => {
      const start = DIVINE_PHASES.descend + index * 0.025;
      channel.update(seconds, {
        head: phase(t, start, DIVINE_PHASES.call - 0.04 + index * 0.01),
        tail: phase(t, DIVINE_PHASES.impact + 0.02, DIVINE_PHASES.settle + 0.04),
        alpha: 0.95,
      });
    });
    this.release.forEach((channel, index) => {
      const start = DIVINE_PHASES.impact + index * 0.006;
      channel.update(seconds, {
        head: phase(t, start, start + 0.07),
        tail: phase(t, DIVINE_PHASES.impact + 0.1, DIVINE_PHASES.settle + 0.1),
        alpha: 1,
      });
    });
    this.runFluid(t, seconds);
  }

  /** The call: a column of light and energy coming down onto the target, then running out. */
  private placeColumn(t: number, seconds: number, big: number): void {
    const head = phase(t, DIVINE_PHASES.call, DIVINE_PHASES.impact);
    const tail = phase(t, DIVINE_PHASES.impact + 0.06, DIVINE_PHASES.settle + 0.08);
    this.column.update(seconds, { head, tail, alpha: 1 });
    const shown = head * (1 - tail);
    this.columnBeam.visible = shown > 0;
    if (!this.columnBeam.visible) return;
    this.columnBeam.position.set(this.middle.x, this.middle.y + big * 0.5);
    this.columnBeam.height = (this.middle.y - this.top + big) * head;
    this.columnBeam.width = big * (this.mood === "damage" ? 4.4 : 3.6) * (0.6 + 0.4 * shown);
    this.columnBeam.alpha = 0.9 * shown;
    this.columnBeam.tint = this.mood === "damage" ? DIVINE_COLORS.white : DIVINE_COLORS.cream;
  }

  /** A ring of energy racing out over the ground from the target at the call, then fading. */
  private placeGround(t: number, seconds: number, big: number): void {
    const life = phase(t, DIVINE_PHASES.impact, DIVINE_PHASES.settle + 0.06);
    this.ground.mesh.visible = life > 0 && life < 1;
    if (!this.ground.mesh.visible) return;
    const radius = big * (1 + 6 * life ** 0.6);
    this.ground.setPath(
      circlePath(radius, 64, 0.42).map((point) => ({
        x: point.x + this.middle.x,
        y: point.y + this.middle.y + big * 0.35,
      })),
      big * 0.7 * (1 - life * 0.6),
    );
    this.ground.update(seconds, { alpha: 1 - life });
  }

  /**
   * Plans what is laid once: the rings of the halo, the streams to the targets, the column, the flash, and the particles (sparks or motes at the call, feathers of light after).
   */
  private plan(targets: IArenaPoint2[], field: IArenaFxField, r: number): void {
    const random = this.random;
    const frames = this.host.textures;
    const seconds = DIVINE_DURATION_MS / 1000;
    const big = r * this.grow;
    this.top = field.y;
    const radius = big * DIVINE_HALO.radius;
    const squash = DIVINE_HALO.squash;
    this.haloRadius = radius;
    this.drawHaloLines(radius, squash, big);
    this.rings[0]?.setPath(circlePath(radius, 72, squash), big * 0.42);
    this.rings[1]?.setPath(circlePath(radius * 0.86, 72, squash, Math.PI), big * 0.18);
    this.fluid = new ArenaEnergyFluid(this.host, {
      area: { x: field.x, y: field.y, width: field.width, height: field.height },
      palette: ENERGY_PALETTES.holy,
      decay: 0.45,
      turbulence: { scale: big * 2, force: big * 6.5 },
      vorticity: 30,
      gain: 1.1,
      seed: 5,
    });
    this.fluidLayer.addChild(this.fluid.view);
    this.haloInk.setPath(
      circlePath(radius, 72, squash).map((point) => ({
        x: point.x + this.haloAt.x,
        y: point.y + this.haloAt.y,
      })),
      big * 0.5,
    );
    this.fluid.sources.addChild(this.haloInk.mesh);
    this.planFlows(targets, r, radius, squash);
    this.column.setPath(
      [
        { x: this.middle.x, y: field.y },
        { x: this.middle.x, y: this.middle.y },
      ],
      big * 1.7,
    );
    paintGlow(
      this.flash,
      this.middle.x,
      this.middle.y,
      field.diagonal,
      this.mood === "damage" ? DIVINE_COLORS.white : DIVINE_COLORS.cream,
    );
    this.flash.alpha = 0;
    const drift = (DIVINE_PHASES.impact + 0.05) * seconds;
    for (let index = 0; index < DIVINE_PLUMES; index += 1) {
      const size = r * (0.45 + random() * 0.4);
      const sway = random() * Math.PI * 2;
      const life = 1.4 + random() * 0.8;
      this.plumes.add({
        texture: frames.petal,
        spawn: {
          x: field.x + random() * field.width,
          y: field.y - random() * field.height * 0.25,
          vx: 0,
          vy: field.height * (0.18 + random() * 0.14),
          drag: 0,
          gravity: 0,
          born: drift + random() * 0.9,
          life,
        },
        look: {
          size: () => size * 0.45,
          height: (l) => size * (0.95 + 0.15 * Math.sin(l * 9 + sway)),
          alpha: (l) => Math.min(l * 6, 1) * (1 - phase(l, 0.65, 1)) * 0.85,
          tint: (l) =>
            mixColor(
              DIVINE_COLORS.cream,
              DIVINE_COLORS.gold,
              Math.abs(Math.sin(l * 3 + sway)) * 0.6,
            ),
          rotation: (age) => sway + Math.sin(age * 2.2 + sway) * 0.8,
          drift: (age) => ({ x: Math.sin(age * 1.8 + sway) * r * 1.5, y: 0 }),
        },
      });
    }
  }

  /** The channels of energy (see `runFlows`), laid out once the targets are known. */
  private planFlows(targets: IArenaPoint2[], r: number, radius: number, squash: number): void {
    const big = r * this.grow;
    const fluid = this.fluid;
    if (!fluid) return;
    for (let index = 0; index < DIVINE_DESCENT_CHANNELS; index += 1) {
      const angle = (index / DIVINE_DESCENT_CHANNELS) * Math.PI * 2 + 0.3;
      const from = {
        x: this.haloAt.x + Math.cos(angle) * radius,
        y: this.haloAt.y + Math.sin(angle) * radius * squash,
      };
      const channel = new ArenaEnergyTendril(fluid, {
        palette:
          DIVINE_FLUID_PALETTES[index % DIVINE_FLUID_PALETTES.length] ?? ENERGY_PALETTES.holy,
        from,
        to: targets[index % targets.length] ?? this.middle,
        bend: (index % 2 === 0 ? 1 : -1) * (0.16 + (index % 3) * 0.06),
        width: big * 0.34,
        speed: 240,
        grain: 120,
        strands: 4,
        seed: index * 13 + 2,
      });
      this.descent.push(channel);
      this.flows.addChild(channel.view);
    }
    const heal = this.mood === "heal";
    for (let index = 0; index < DIVINE_RELEASE_CHANNELS; index += 1) {
      const share = index / (DIVINE_RELEASE_CHANNELS - 1) - 0.5;
      const angle = heal ? -Math.PI / 2 + share * 2.2 : share * Math.PI * 2 * 0.92;
      const length = big * (heal ? 5 + (index % 2) * 1.5 : 4 + (index % 3));
      const to = {
        x: this.middle.x + Math.cos(angle) * length,
        y: this.middle.y + Math.sin(angle) * length * (heal ? 1 : 0.55),
      };
      const channel = new ArenaEnergyTendril(fluid, {
        palette:
          DIVINE_FLUID_PALETTES[(index + 1) % DIVINE_FLUID_PALETTES.length] ?? ENERGY_PALETTES.gold,
        from: this.middle,
        to,
        bend: (index % 2 === 0 ? 1 : -1) * 0.2,
        width: big * (heal ? 0.32 : 0.28),
        speed: heal ? 220 : 420,
        grain: 110,
        strands: 3,
        seed: index * 7 + 31,
      });
      this.release.push(channel);
      this.flows.addChild(channel.view);
    }
  }

  /**
   * The ring of the halo, drawn once: a crisp line of light (layers of soft glow around a thin white-gold core),
   * a thin inner ring and a faint outer one.
   */
  private drawHaloLines(radius: number, squash: number, big: number): void {
    const g = this.haloLines;
    for (let layer = 0; layer < 6; layer += 1) {
      g.ellipse(0, 0, radius, radius * squash).stroke({
        width: big * (0.55 - layer * 0.08),
        color: layer < 3 ? DIVINE_COLORS.gold : DIVINE_COLORS.light,
        alpha: 0.05 + layer * 0.035,
      });
    }
    g.ellipse(0, 0, radius, radius * squash).stroke({
      width: big * 0.06,
      color: DIVINE_COLORS.white,
      alpha: 0.95,
    });
    g.ellipse(0, 0, radius * 0.86, radius * 0.86 * squash).stroke({
      width: big * 0.025,
      color: DIVINE_COLORS.light,
      alpha: 0.7,
    });
    g.ellipse(0, 0, radius * 1.14, radius * 1.14 * squash).stroke({
      width: big * 0.02,
      color: DIVINE_COLORS.gold,
      alpha: 0.35,
    });
  }

  /**
   * The golden fluid: the halo ring and the channels pour ink into it, and it carries the ink away. While the
   * halo shines it swirls around it and rises a little; at the call it pours out of the target (up for a blessing,
   * outward for a judgment) and lingers a little longer.
   */
  private runFluid(t: number, seconds: number): void {
    const fluid = this.fluid;
    if (!fluid) return;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const big = this.size * this.grow;
    const halo =
      phase(t, DIVINE_PHASES.halo, DIVINE_PHASES.descend) *
      (1 - phase(t, DIVINE_PHASES.settle - 0.06, DIVINE_PHASES.settle));
    this.haloInk.update(seconds, { alpha: 0.7 * halo });
    const after = t >= DIVINE_PHASES.impact;
    const blessing = this.mood === "heal";
    fluid.update(delta, {
      inject: 3,
      alpha: 1,
      decay: after ? 0.58 : 0.45,
      bias: after
        ? {
            center: this.middle,
            radial: blessing ? big * 2 : big * 5,
            swirl: big * 1.8,
            drift: { x: 0, y: blessing ? -big * 4 : -big * 0.6 },
          }
        : {
            center: this.haloAt,
            swirl: big * 3,
            radial: big * 0.5,
            drift: { x: 0, y: -big * 0.8 },
          },
    });
  }

  linger(origin: Container, r: number, since: number): boolean {
    const fluid = this.fluid;
    if (!fluid || this.ended) return false;
    if (this.root.visible) {
      this.root.visible = false;
      this.host.screen.removeWorldFilter(this.golden);
    }
    const anchor = this.host.screen.toScreen(origin);
    this.fluidLayer.position.set(anchor.x, anchor.y);
    this.fluidLayer.scale.set(r / this.size);
    const seconds = DIVINE_DURATION_MS / 1000 + since / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    fluid.update(delta, {
      inject: 0,
      decay: 0.42,
      alpha: 1 - phase(since, FLUID_LINGER_MS - 500, FLUID_LINGER_MS),
    });
    return since < FLUID_LINGER_MS;
  }
}
