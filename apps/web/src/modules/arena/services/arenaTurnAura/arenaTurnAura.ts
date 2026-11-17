import { Container, Graphics, Sprite } from "pixi.js";

import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
} from "@/modules/arena/services/arenaEnergyFlow";

import {
  TURN_FLUID,
  TURN_FLUID_LINGER_MS,
  TURN_GLOW,
  TURN_LITE_RING,
  TURN_RING,
} from "./arenaTurnAura.constants";
import type {
  IAuraRig,
  IArenaTurnAuraFrame,
  IArenaTurnAuraOptions,
  IArenaTurnAuraShape,
} from "./arenaTurnAura.types";
import { auraPresence, breath, floatLift } from "./arenaTurnAura.utils";

/**
 * The mark of the token whose turn it is, built with the energy kit like the Chamado Divino: a sharp ring of red
 * energy turning on the ground (around a round token, an ellipse at a figure's feet) and a faint red fluid fed
 * by it that hugs the ring, turns with it and fades fast, so it never spreads. The token floats and bobs a
 * little; a soft glow sits behind its body.
 * `ground` stays on the floor (the renderer keeps it down while the token rises); `back` rises with the token.
 * When the turn moves on, the pieces fade and the fluid keeps drifting until it is gone. In the light mode it is
 * a still ring and glow, with no fluid, no shader and no motion.
 */
export class ArenaTurnAura {
  readonly ground = new Container();
  readonly back = new Container();
  private rig: IAuraRig | null = null;
  private readonly liteRing: Graphics | null;
  private readonly bodyGlow: Sprite;
  private readonly start = performance.now();
  private leftAt: number | null = null;
  private lastSeconds = 0;
  private size = 0;
  private shapeKey = "";

  constructor(private readonly options: IArenaTurnAuraOptions) {
    this.ground.eventMode = "none";
    this.back.eventMode = "none";
    this.bodyGlow = new Sprite(options.host.textures.glow);
    this.bodyGlow.anchor.set(0.5);
    this.bodyGlow.tint = TURN_GLOW.color;
    this.bodyGlow.blendMode = "add";
    this.bodyGlow.alpha = 0;
    this.back.addChild(this.bodyGlow);
    this.liteRing = options.lite ? new Graphics() : null;
    if (this.liteRing) this.ground.addChild(this.liteRing);
  }

  /**
   * Fits the aura to the token. Only a new style or image shape rebuilds the fluid; a new size (the GM dragging
   * the resize handle) just scales what is built, so it never restarts or allocates GPU memory per move.
   */
  layout({ size, style, halfWidth, halfHeight }: IArenaTurnAuraShape): void {
    const figure = style === "figure";
    const shapeKey = figure
      ? `${style}|${(halfWidth / Math.max(halfHeight, 1)).toFixed(3)}`
      : style;
    if (size === this.size && shapeKey === this.shapeKey) return;
    this.size = size;
    const radius = figure ? halfWidth * TURN_RING.figureRadius : size * TURN_RING.portraitRadius;
    const squash = figure ? TURN_RING.figureSquash : 1;
    const center = { x: 0, y: figure ? halfHeight * 0.94 : 0 };
    this.bodyGlow.width = (figure ? halfWidth * 2 : size) * TURN_GLOW.body;
    this.bodyGlow.height = (figure ? halfHeight * 2 : size) * TURN_GLOW.body;
    if (this.liteRing) {
      this.liteRing
        .clear()
        .ellipse(center.x, center.y, radius, radius * squash)
        .stroke({
          width: Math.max(2, size * TURN_LITE_RING.width),
          color: TURN_LITE_RING.color,
          alpha: TURN_LITE_RING.alpha,
        });
      this.shapeKey = shapeKey;
      return;
    }
    if (this.rig && shapeKey === this.shapeKey) {
      this.rig.layer.scale.set(size / this.rig.size);
      return;
    }
    this.shapeKey = shapeKey;
    this.destroyRig();
    this.rig = this.buildRig(size, radius, squash, center);
  }

  /** The turn moved on: the pieces fade, then the fluid drifts away (then `step` reports `done`). */
  leave(now: number): void {
    this.leftAt ??= now;
  }

  get leaving(): boolean {
    return this.leftAt !== null;
  }

  /** Advances the aura to `now` and says how high the token floats. */
  step(now: number): IArenaTurnAuraFrame {
    if (this.options.lite) {
      this.bodyGlow.alpha = TURN_GLOW.bodyAlpha;
      return { lift: 0, animating: false, done: this.leftAt !== null };
    }
    const elapsed = now - this.start;
    const seconds = elapsed / 1000;
    const delta = seconds - this.lastSeconds;
    this.lastSeconds = seconds;
    const presence = auraPresence(now, this.start, this.leftAt);
    this.bodyGlow.alpha = presence * (TURN_GLOW.bodyAlpha + TURN_GLOW.breath * breath(elapsed));
    const lingering = this.leftAt === null ? 0 : now - this.leftAt;
    const rig = this.rig;
    if (rig) {
      rig.ring.update(seconds, { alpha: presence * TURN_RING.alpha });
      rig.ringInk.update(seconds, { alpha: presence * TURN_RING.inkAlpha });
      const r = rig.radius;
      rig.fluid.update(delta, {
        inject: TURN_FLUID.inject * presence,
        alpha: 1 - Math.min(lingering / TURN_FLUID_LINGER_MS, 1),
        bias: {
          center: rig.center,
          radial: r * TURN_FLUID.outward,
          swirl: r * TURN_FLUID.swirl,
        },
      });
    }
    const done = this.leftAt !== null && lingering >= TURN_FLUID_LINGER_MS;
    return { lift: floatLift(this.size, elapsed, presence), animating: !done, done };
  }

  destroy(): void {
    this.destroyRig();
    this.ground.destroy({ children: true });
    this.back.destroy({ children: true });
  }

  private buildRig(
    size: number,
    radius: number,
    squash: number,
    center: { x: number; y: number },
  ): IAuraRig {
    const { host, seed } = this.options;
    const side = radius * TURN_FLUID.side;
    const fluid = new ArenaEnergyFluid(host, {
      area: { x: center.x - side, y: center.y - side, width: side * 2, height: side * 2 },
      palette: ENERGY_PALETTES.scarlet,
      resolution: TURN_FLUID.resolution,
      simulation: TURN_FLUID.simulation,
      pressureSteps: TURN_FLUID.pressureSteps,
      decay: TURN_FLUID.decay,
      turbulence: {
        scale: radius * TURN_FLUID.turbulence.scale,
        force: radius * TURN_FLUID.turbulence.force,
      },
      vorticity: TURN_FLUID.vorticity,
      gain: TURN_FLUID.gain,
      seed,
    });
    const ringPath = circlePath(radius, TURN_RING.samples, squash).map((point) => ({
      x: point.x + center.x,
      y: point.y + center.y,
    }));
    const ring = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.blood,
      speed: TURN_RING.speed,
      sharpness: TURN_RING.sharpness,
      strands: TURN_RING.strands,
      closed: true,
      samples: TURN_RING.samples,
      seed,
    });
    ring.setPath(ringPath, size * TURN_RING.width);
    const ringInk = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.scarlet,
      speed: TURN_RING.speed,
      closed: true,
      samples: TURN_RING.samples,
      seed: seed + 5,
    });
    ringInk.setPath(ringPath, size * TURN_RING.inkWidth);
    fluid.sources.addChild(ringInk.mesh);
    const layer = new Container();
    layer.addChild(fluid.view, ring.mesh);
    this.ground.addChildAt(layer, 0);
    return { fluid, ring, ringInk, layer, center, radius, size };
  }

  private destroyRig(): void {
    const rig = this.rig;
    if (!rig) return;
    this.rig = null;
    rig.ringInk.mesh.removeFromParent();
    rig.ring.destroy();
    rig.ringInk.destroy();
    rig.fluid.destroy();
    rig.layer.destroy({ children: true });
  }
}
