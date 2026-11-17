import { Container, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
  type IEnergyPalette,
} from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
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
  VOODOO_BLAST_FLAMES,
  VOODOO_COLORS,
  VOODOO_DURATION_MS,
  VOODOO_EMBERS,
  VOODOO_FIRE_FIELD,
  VOODOO_FLAME_STOPS,
  VOODOO_FLUID_KEY,
  VOODOO_FLUID_LIMIT,
  VOODOO_LINGER_MS,
  VOODOO_SHOCKWAVE,
  VOODOO_SLASH_IN_S,
  VOODOO_SLASH_OUT_S,
  VOODOO_SLASH_SPARKS,
  VOODOO_SLASHES,
  VOODOO_TONGUES,
} from "./arenaVoodooFireEffect.constants";
import type { VoodooVariant } from "./arenaVoodooFireEffect.types";
import { slashPath } from "./arenaVoodooFireEffect.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Where the blow comes from when there is no attacker (the example without one). */
const DEFAULT_INCOMING: IArenaPoint2 = { x: 1, y: 0.2 };

/** A cut of the axe: its curve, the fire shown on it (a green blade and a white-hot edge) and what it pours. */
interface IVoodooSlash {
  points: IArenaPoint2[];
  delay: number;
  width: number;
  blade: ArenaEnergyFlow;
  edge: ArenaEnergyFlow;
  ink: ArenaEnergyFlow;
}

/**
 * Green and red voodoo fire on the target, made with the fire of the energy kit (a fluid in fire mode: white-hot
 * at its heart, lime, green and violet at its edges where it is green, orange, red and crimson where it is red,
 * the two blending as they rise in tongues). The axe variant (Ataque Vodu): blades of green fire
 * slash across the token, throwing sparks to both sides, and burst into flame. The fireball variant (Conjuração
 * Vodu): the ball bursts in a flash and a ring of fire racing out. Then, in both, the target burns: a ring of fire
 * at its feet and tongues climbing over it feed real flames that rise, curl and tear apart, embers fly up
 * flickering, and the token shudders in the heat; when it is over the last flames rise and fade by themselves.
 * At most `VOODOO_FLUID_LIMIT` targets burn in the fluid at once (an area spell); the others show the same fire
 * as ribbons of flame.
 */
export class ArenaVoodooFireEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.35,
    bloomScale: 0.9,
    blur: 5,
    quality: 3,
  });
  private readonly fluid: ArenaEnergyFluid | null;
  private readonly feed: Container;
  private readonly parts = new Container();
  private readonly flash: Sprite;
  private readonly pyre: ArenaEnergyFlow;
  private readonly pyreRed: ArenaEnergyFlow;
  private readonly tongues: ArenaEnergyFlow[] = [];
  private readonly rings: ArenaEnergyFlow[] = [];
  private readonly ringInks: ArenaEnergyFlow[] = [];
  private readonly slashes: IVoodooSlash[] = [];
  private readonly sparks: ArenaFxParticles;
  private readonly amount: ArenaAmountText;
  private readonly direction: IArenaPoint2;
  private readonly heading: number;
  private readonly duration: number;
  private fluidSeconds = 0;
  private start: number | null = null;
  private rippled = false;

  constructor(
    private readonly options: IArenaEffectOptions,
    private readonly host: IArenaFxHost,
    private readonly variant: VoodooVariant,
  ) {
    const r = options.size / 2;
    const incoming = options.incoming ?? DEFAULT_INCOMING;
    const length = Math.hypot(incoming.x, incoming.y) || 1;
    this.direction = { x: incoming.x / length, y: incoming.y / length };
    this.heading = Math.atan2(this.direction.y, this.direction.x);
    this.duration = VOODOO_DURATION_MS[variant];
    const { side, above, below } = VOODOO_FIRE_FIELD;
    const burns = host.screen.reserve(
      VOODOO_FLUID_KEY,
      VOODOO_FLUID_LIMIT,
      (options.delayMs ?? 0) + this.duration + VOODOO_LINGER_MS,
    );
    this.fluid = !burns
      ? null
      : new ArenaEnergyFluid(host, {
          area: { x: -r * side, y: -r * above, width: r * side * 2, height: r * (above + below) },
          palette: ENERGY_PALETTES.voodoo,
          secondary: ENERGY_PALETTES.hellfire,
          mode: "fire",
          resolution: 320,
          simulation: 100,
          pressureSteps: 10,
          decay: 0.36,
          velocityDecay: 0.5,
          turbulence: { scale: r * 0.9, force: r * 7 },
          vorticity: 40,
          threads: 3,
          haze: 1,
          gain: 1.3,
          seed: options.seed,
        });
    this.feed = this.fluid?.sources ?? new Container();
    this.sparks = new ArenaFxParticles(r * 6, "add");
    this.flash = new Sprite(host.textures.glow);
    this.flash.anchor.set(0.5);
    this.flash.tint = VOODOO_COLORS.bright;
    this.flash.blendMode = "add";
    this.pyre = this.flow(ENERGY_PALETTES.voodoo, true, options.seed);
    this.pyre.setPath(
      circlePath(r * 0.85, 40, 0.42).map((point) => ({ x: point.x, y: point.y + r * 0.45 })),
      r * 0.55,
    );
    this.pyreRed = this.flow(ENERGY_PALETTES.hellfire, true, options.seed + 9);
    this.pyreRed.setPath(
      circlePath(r * 1.1, 40, 0.42).map((point) => ({ x: point.x, y: point.y + r * 0.4 })),
      r * 0.45,
    );
    this.feed.addChild(this.pyre.mesh, this.pyreRed.mesh);
    for (let index = 0; index < VOODOO_TONGUES; index += 1) {
      const tongue = this.flow(
        index % 2 === 0 ? ENERGY_PALETTES.voodooHot : ENERGY_PALETTES.hellfire,
        false,
        options.seed + index * 3,
      );
      this.tongues.push(tongue);
      this.feed.addChild(tongue.mesh);
    }
    if (variant === "fireball")
      for (let index = 0; index < 2; index += 1) {
        const ring = this.flow(
          index === 0 ? ENERGY_PALETTES.voodooHot : ENERGY_PALETTES.voodoo,
          true,
          options.seed + 20 + index,
        );
        const ink = this.flow(
          index === 0 ? ENERGY_PALETTES.voodoo : ENERGY_PALETTES.hellfire,
          true,
          options.seed + 30 + index,
        );
        this.rings.push(ring);
        this.ringInks.push(ink);
        this.parts.addChild(ring.mesh);
        this.feed.addChild(ink.mesh);
      }
    else this.planSlashes(r);
    this.amount = new ArenaAmountText(
      variant === "axe" ? "voodooAxe" : "voodooFire",
      options.kind,
      options.resource,
      options.amount,
      options.fontFamily,
    );
    this.plan(host, r);
    this.bloom.resolution = 1;
    this.parts.addChild(this.flash, this.sparks.container);
    this.parts.filters = [this.bloom];
    this.container.eventMode = "none";
    if (!this.fluid) this.parts.addChildAt(this.feed, 0);
    this.container.addChild(...(this.fluid ? [this.fluid.view] : []), this.parts, this.amount.text);
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
    if (elapsed >= this.duration) {
      this.parts.visible = false;
      this.amount.text.visible = false;
      const since = elapsed - this.duration;
      if (!this.fluid) return { done: true, frame: REST };
      this.fluid.update(delta, {
        inject: 0,
        alpha: 1 - phase(since, VOODOO_LINGER_MS * 0.4, VOODOO_LINGER_MS),
        bias: { drift: { x: 0, y: -r * 6 } },
      });
      return { done: since >= VOODOO_LINGER_MS, frame: REST };
    }
    const t = elapsed / this.duration;
    const scale = cameraScale > 0 ? cameraScale : 1;
    this.amount.place(t, scale, r + lift, false);
    if (!this.rippled) {
      this.rippled = true;
      const wave = VOODOO_SHOCKWAVE[this.variant];
      this.host.shockwave(this.container, r * scale * wave.radii, wave.durationMs, {
        amplitude: wave.amplitude,
        wavelength: wave.wavelength,
      });
    }
    const flash = 1 - phase(elapsed, 0, 220);
    this.flash.width = this.flash.height =
      r * (this.variant === "axe" ? 3 : 4.4) * (1.1 - 0.3 * flash);
    this.flash.alpha = 0.9 * flash;
    if (this.variant === "axe") this.runSlashes(seconds);
    else this.runRings(elapsed, seconds, r);
    const burn = this.burn(t, seconds, r);
    const blast = 1 - phase(elapsed, 0, 260);
    this.fluid?.update(delta, {
      inject: 10 * Math.max(burn, blast),
      bias: {
        center: { x: 0, y: 0 },
        radial: r * 6 * blast,
        drift: {
          x: this.direction.x * r * 3 * blast,
          y: -r * 5.5 * (1 - blast) + this.direction.y * r * 3 * blast,
        },
      },
    });
    this.sparks.update(seconds);
    return { done: false, frame: this.reel(t, r) };
  }

  destroy(): void {
    this.parts.filters = [];
    this.bloom.destroy();
    for (const flow of [this.pyre, this.pyreRed, ...this.tongues, ...this.ringInks])
      flow.mesh.removeFromParent();
    for (const slash of this.slashes) slash.ink.mesh.removeFromParent();
    for (const flow of [
      this.pyre,
      this.pyreRed,
      ...this.tongues,
      ...this.rings,
      ...this.ringInks,
      ...this.slashes.flatMap((slash) => [slash.blade, slash.edge, slash.ink]),
    ])
      flow.destroy();
    this.fluid?.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The target burning: a ring of fire at its feet and tongues of fire climbing over it pour into the flames,
   * strongest right after the hit, dying down at the end. Returns how strongly it burns.
   */
  private burn(t: number, seconds: number, r: number): number {
    const strength = phase(t, 0.02, 0.12) * (1 - phase(t, 0.6, 1));
    this.pyre.update(seconds, { alpha: strength });
    this.pyreRed.update(seconds, { alpha: strength * (0.8 + 0.2 * Math.sin(seconds * 9)) });
    this.tongues.forEach((tongue, index) => {
      const share = index / Math.max(VOODOO_TONGUES - 1, 1) - 0.5;
      const sway = Math.sin(seconds * 7 + index * 1.9) * r * 0.25;
      const base = { x: share * r * 1.7, y: r * 0.55 };
      tongue.setPath(
        [base, { x: base.x + sway * 0.5, y: -r * 0.2 }, { x: base.x + sway, y: -r * 1.1 }],
        (along) => r * 0.55 * (1 - along * 0.8),
      );
      tongue.update(seconds, { alpha: strength * (0.7 + 0.3 * Math.sin(seconds * 11 + index)) });
    });
    return strength;
  }

  /**
   * The cuts of the axe: blades of green fire slash across the token one after the other, each flaring from its
   * start to its end (a white-hot edge on a green blade) and burning out from the start, bursting into flame.
   */
  private runSlashes(seconds: number): void {
    for (const slash of this.slashes) {
      const since = seconds - slash.delay;
      const head = since <= 0 ? 0 : 1 - (1 - Math.min(since / VOODOO_SLASH_IN_S, 1)) ** 3;
      const tail = Math.min(Math.max((since - VOODOO_SLASH_IN_S) / VOODOO_SLASH_OUT_S, 0), 1);
      const frame = { head, tail, alpha: since <= 0 || tail >= 1 ? 0 : 1 - tail * 0.5 };
      slash.blade.update(seconds, frame);
      slash.edge.update(seconds, frame);
      slash.ink.update(seconds, { ...frame, alpha: frame.alpha * 1.2 });
    }
  }

  /** The fireball's burst: rings of fire racing out from the target, the first hot and fast. */
  private runRings(elapsed: number, seconds: number, r: number): void {
    this.rings.forEach((ring, index) => {
      const life = (elapsed - index * 70) / 460;
      const ink = this.ringInks[index];
      if (life <= 0 || life >= 1) {
        ring.update(seconds, { alpha: 0 });
        ink?.update(seconds, { alpha: 0 });
        return;
      }
      const radius = r * (0.4 + (index === 0 ? 2.8 : 3.8) * (1 - (1 - life) ** 3));
      const path = circlePath(radius, 48, 0.62);
      ring.setPath(path, r * (0.5 * (1 - life) + 0.06));
      ring.update(seconds, { alpha: 1 - life });
      ink?.setPath(path, r * 0.7 * (1 - life));
      ink?.update(seconds, { alpha: 1 - life });
    });
  }

  /** Still until the hit, then a hard jolt along the blow, a squash and a shudder while it burns. */
  private reel(t: number, r: number): IArenaEffectFrame {
    const jolt = r * 0.24 * Math.exp(-t * 14);
    const tremble = shake(t, r * 0.05, 18, 0.8);
    const squash = 0.13 * Math.exp(-t * 10);
    return {
      dx: this.direction.x * jolt + tremble,
      dy: this.direction.y * jolt,
      scaleX: 1 + squash,
      scaleY: 1 - squash + 0.03 * Math.sin(t * 60) * (1 - t),
    };
  }

  /** A ribbon of fire: closed (a ring) or open (a cut, a tongue). */
  private flow(palette: IEnergyPalette, closed: boolean, seed: number): ArenaEnergyFlow {
    return new ArenaEnergyFlow({
      palette,
      speed: 320,
      grain: 50,
      sharpness: 3,
      strands: 3,
      feather: closed ? 0.4 : 0.6,
      closed,
      samples: closed ? 48 : 24,
      seed,
    });
  }

  /** Lays out the cuts of the axe across the token, from the side the blow came from. */
  private planSlashes(r: number): void {
    VOODOO_SLASHES.forEach((cut, index) => {
      const angle = this.heading + cut.angle;
      const half = r * cut.length;
      const points = slashPath(
        { x: -Math.cos(angle) * half, y: -Math.sin(angle) * half },
        { x: Math.cos(angle) * half, y: Math.sin(angle) * half },
        cut.bend,
      );
      const width = r * cut.width;
      const slash: IVoodooSlash = {
        points,
        delay: cut.delay,
        width,
        blade: this.flow(ENERGY_PALETTES.voodoo, false, this.options.seed + index * 5),
        edge: new ArenaEnergyFlow({
          palette: ENERGY_PALETTES.voodooHot,
          speed: 500,
          grain: 40,
          sharpness: 5,
          strands: 2,
          samples: 24,
          seed: this.options.seed + index * 5 + 1,
        }),
        ink: this.flow(
          index === 0 ? ENERGY_PALETTES.voodoo : ENERGY_PALETTES.hellfire,
          false,
          this.options.seed + index * 5 + 2,
        ),
      };
      const blade = (along: number) => Math.sin(Math.PI * along);
      slash.blade.setPath(points, (along) => width * 2.4 * blade(along));
      slash.edge.setPath(points, (along) => width * 0.8 * blade(along));
      slash.ink.setPath(points, (along) => width * 3 * blade(along) ** 0.6);
      this.slashes.push(slash);
      this.parts.addChild(slash.blade.mesh, slash.edge.mesh);
      this.feed.addChild(slash.ink.mesh);
    });
  }

  /** Embers flying up off the burning target, and the sparks of the hit (along each cut, or all around). */
  private plan(host: IArenaFxHost, r: number): void {
    const random = seededRandom(this.options.seed);
    const frames = host.textures;
    const seconds = this.duration / 1000;
    const emberColors = [VOODOO_COLORS.gold, VOODOO_COLORS.bright, VOODOO_COLORS.violet];
    for (let index = 0; index < VOODOO_EMBERS; index += 1) {
      const size = r * (0.05 + random() * 0.06);
      const hue = emberColors[index % emberColors.length] ?? VOODOO_COLORS.bright;
      const flicker = random() * 10;
      this.sparks.add({
        texture: frames.spark,
        spawn: {
          x: (random() - 0.5) * r * 1.6,
          y: (random() - 0.2) * r,
          vx: (random() - 0.5) * r * 1.5,
          vy: -r * (2.5 + random() * 3),
          drag: 1.2,
          gravity: -r * 0.6,
          born: random() * seconds * 0.6,
          life: 0.5 + random() * 0.5,
        },
        look: {
          size: () => size,
          alpha: (l) => (1 - l) * (0.5 + 0.5 * Math.sin(l * 30 + flicker)),
          tint: (l) => mixColor(hue, VOODOO_COLORS.purple, l),
        },
      });
    }
    if (this.variant === "fireball") this.planBlast(frames, r, random);
    else this.planSparks(frames, r, random);
  }

  /** The fireball's burst: sparks and flames thrown out all around, falling back as embers. */
  private planBlast(frames: IArenaFxHost["textures"], r: number, random: () => number): void {
    for (let index = 0; index < VOODOO_BLAST_FLAMES; index += 1) {
      const angle = random() * Math.PI * 2;
      const speed = r * (5 + random() * 7);
      const size = r * (0.08 + random() * 0.08);
      this.sparks.add({
        texture: frames.streak,
        anchorX: 1,
        spawn: {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.7,
          drag: 4,
          gravity: r * 3,
          born: 0,
          life: 0.35 + random() * 0.3,
        },
        look: {
          size: (l) => size * 4 * (1 - l * 0.6),
          height: () => size * 0.7,
          alpha: (l) => 1 - l,
          tint: (l) => mixStops(VOODOO_FLAME_STOPS, l * 0.9),
          rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
        },
      });
    }
  }

  /** Sparks thrown off along each cut, flying out to both sides of it. */
  private planSparks(frames: IArenaFxHost["textures"], r: number, random: () => number): void {
    for (const slash of VOODOO_SLASHES) {
      const angle = this.heading + slash.angle;
      for (let index = 0; index < VOODOO_SLASH_SPARKS; index += 1) {
        const along = (random() - 0.5) * 2 * r * slash.length * 0.8;
        const side = (random() > 0.5 ? 1 : -1) * (Math.PI / 2) + (random() - 0.5) * 0.9;
        const out = angle + side;
        const speed = r * (3 + random() * 5);
        const size = r * (0.08 + random() * 0.07);
        this.sparks.add({
          texture: frames.streak,
          anchorX: 1,
          spawn: {
            x: Math.cos(angle) * along,
            y: Math.sin(angle) * along,
            vx: Math.cos(out) * speed,
            vy: Math.sin(out) * speed,
            drag: 4,
            gravity: r * 3,
            born: slash.delay + (Math.abs(along) / (r * slash.length)) * VOODOO_SLASH_IN_S,
            life: 0.3 + random() * 0.25,
          },
          look: {
            size: (l) => size * 3.5 * (1 - l * 0.6),
            height: () => size * 0.6,
            alpha: (l) => 1 - l,
            tint: (l) => mixStops(VOODOO_FLAME_STOPS, l * 0.9),
            rotation: (_, velocity) => Math.atan2(velocity.y, velocity.x),
          },
        });
      }
    }
  }
}
