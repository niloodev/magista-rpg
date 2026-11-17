import { Container, Graphics, Sprite } from "pixi.js";

import {
  DIVINE_COLORS,
  DIVINE_FLUID_PALETTES,
} from "@/modules/arena/services/arenaDivineCallEffect";
import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
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
import {
  easeOutBack,
  phase,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  DIVINE_INVOCATION_DURATION_MS,
  DIVINE_INVOCATION_FIELD,
  DIVINE_INVOCATION_HIT_MS,
  DIVINE_INVOCATION_TENDRILS,
} from "./arenaDivineInvocationEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Squash of the rings around her (seen from above, at an angle). */
const SQUASH = 0.4;

/**
 * Heylel's part of "Chamado Divino", made like the call itself: a ring of flowing golden energy runs around her
 * feet, a crisp halo of light lights over her head with glints running around it, and threads of golden energy
 * rise from the ring to the sky, weaving around a soft beam; all of it pours golden mist into a fluid that curls
 * up around her and, when her part is over, keeps rising and fades by itself. She floats a little while she
 * calls.
 */
export class ArenaDivineInvocationEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly parts = new Container();
  private readonly aura: Sprite;
  private readonly beam: Sprite;
  private readonly ring: ArenaEnergyFlow;
  private readonly ringInk: ArenaEnergyFlow;
  private readonly halo = new Container();
  private readonly haloLines = new Graphics();
  private readonly glints: Sprite[] = [];
  private readonly fluid: ArenaEnergyFluid;
  private readonly tendrils: ArenaEnergyTendril[] = [];
  private readonly radius: number;
  private fluidSeconds = 0;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.radius = r * 0.62;
    const { side, above, below } = DIVINE_INVOCATION_FIELD;
    this.fluid = new ArenaEnergyFluid(host, {
      area: { x: -r * side, y: -r * above, width: r * side * 2, height: r * (above + below) },
      palette: ENERGY_PALETTES.holy,
      resolution: 360,
      simulation: 112,
      pressureSteps: 10,
      decay: 0.45,
      turbulence: { scale: r * 1.6, force: r * 5 },
      vorticity: 28,
      gain: 1.05,
      seed: options.seed,
    });
    this.aura = this.glow(DIVINE_COLORS.gold);
    this.beam = new Sprite(host.textures.beam);
    this.beam.anchor.set(0.5, 0);
    this.beam.rotation = Math.PI;
    this.beam.tint = DIVINE_COLORS.cream;
    this.beam.blendMode = "add";
    const feet = circlePath(r * 1.3, 56, SQUASH).map((point) => ({
      x: point.x,
      y: point.y + r * 0.45,
    }));
    this.ring = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.gold,
      speed: 200,
      sharpness: 3,
      strands: 5,
      closed: true,
      samples: 56,
      seed: options.seed,
    });
    this.ring.setPath(feet, r * 0.3);
    this.ringInk = new ArenaEnergyFlow({
      palette: ENERGY_PALETTES.holy,
      speed: 200,
      closed: true,
      samples: 56,
      seed: options.seed + 5,
    });
    this.ringInk.setPath(feet, r * 0.45);
    this.fluid.sources.addChild(this.ringInk.mesh);
    this.drawHalo(r);
    for (let index = 0; index < 2; index += 1) {
      const glint = this.glow(DIVINE_COLORS.white);
      this.glints.push(glint);
      this.halo.addChild(glint);
    }
    const flows = new Container();
    for (let index = 0; index < DIVINE_INVOCATION_TENDRILS; index += 1) {
      const share = index / (DIVINE_INVOCATION_TENDRILS - 1) - 0.5;
      const tendril = new ArenaEnergyTendril(this.fluid, {
        palette:
          DIVINE_FLUID_PALETTES[index % DIVINE_FLUID_PALETTES.length] ?? ENERGY_PALETTES.holy,
        from: { x: share * r * 2.2, y: r * 0.45 },
        to: { x: share * r * 0.6, y: -r * (above - 1) },
        bend: (index % 2 === 0 ? 1 : -1) * (0.08 + Math.abs(share) * 0.1),
        width: r * 0.3,
        speed: 360,
        grain: 100,
        strands: 3,
        seed: options.seed + index * 9,
      });
      this.tendrils.push(tendril);
      flows.addChild(tendril.view);
    }
    this.halo.position.set(0, -r * 1.4);
    this.container.eventMode = "none";
    this.parts.addChild(this.aura, this.beam, this.ring.mesh, flows, this.halo);
    this.container.addChild(this.fluid.view, this.parts);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    if (elapsed >= DIVINE_INVOCATION_DURATION_MS) {
      this.parts.visible = false;
      const since = elapsed - DIVINE_INVOCATION_DURATION_MS;
      this.fluid.update(delta, {
        inject: 0,
        decay: 0.42,
        alpha: 1 - phase(since, FLUID_LINGER_MS - 500, FLUID_LINGER_MS),
        bias: { drift: { x: 0, y: -r * 3 } },
      });
      return { done: since >= FLUID_LINGER_MS, frame: REST };
    }
    const t = elapsed / DIVINE_INVOCATION_DURATION_MS;
    const hit = DIVINE_INVOCATION_HIT_MS / DIVINE_INVOCATION_DURATION_MS;
    const fade = 1 - phase(t, hit, 1);
    const open = easeOutBack(phase(t, 0, 0.2));
    this.aura.width = this.aura.height = r * (3 + 0.3 * Math.sin(seconds * 6)) * Math.max(open, 0);
    this.aura.alpha = 0.45 * fade;
    this.beam.width = r * 2.2;
    this.beam.height = r * DIVINE_INVOCATION_FIELD.above;
    this.beam.y = r * 0.4;
    this.beam.alpha = 0.22 * phase(t, 0.15, 0.4) * fade;
    this.ring.update(seconds, { alpha: Math.min(open, 1) * fade });
    this.ringInk.update(seconds, { alpha: 0.6 * Math.min(open, 1) * fade });
    this.placeHalo(t, seconds, r, fade);
    this.tendrils.forEach((tendril, index) => {
      const start = 0.14 + index * 0.04;
      tendril.update(seconds, {
        head: phase(t, start, hit) ** 0.7,
        tail: phase(t, hit, 1),
        alpha: 0.95,
      });
    });
    this.fluid.update(delta, {
      inject: 3,
      bias: {
        center: { x: 0, y: -r * 2 },
        swirl: r * 2,
        drift: { x: 0, y: -r * 3.5 },
      },
    });
    const float = Math.sin(Math.PI * Math.min(t / hit, 1)) * r * 0.15;
    return { done: false, frame: { dx: 0, dy: -float, scaleX: 1, scaleY: 1 } };
  }

  destroy(): void {
    for (const tendril of this.tendrils) tendril.destroy();
    this.ringInk.mesh.removeFromParent();
    for (const flow of [this.ring, this.ringInk]) flow.destroy();
    this.fluid.destroy();
    this.container.destroy({ children: true });
  }

  /** The halo over her head opens, breathes and fades; two glints run around it. */
  private placeHalo(t: number, seconds: number, r: number, fade: number): void {
    const appear = easeOutBack(phase(t, 0.06, 0.26));
    this.halo.scale.set(Math.max(appear, 0));
    this.halo.alpha = fade;
    this.haloLines.alpha = 0.85 + 0.15 * Math.sin(seconds * 2.4);
    this.glints.forEach((glint, index) => {
      const angle = seconds * 1.6 + index * Math.PI;
      glint.position.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius * SQUASH);
      glint.rotation = Math.atan2(Math.cos(angle) * SQUASH, -Math.sin(angle));
      glint.width = r * 0.7;
      glint.height = r * 0.16;
      glint.alpha = 0.6 + 0.4 * Math.sin(seconds * 5 + index * 2);
    });
  }

  /** The crisp ring of the halo: layers of soft glow around a thin white-gold core, and a faint inner ring. */
  private drawHalo(r: number): void {
    const g = this.haloLines;
    const radius = this.radius;
    for (let layer = 0; layer < 5; layer += 1) {
      g.ellipse(0, 0, radius, radius * SQUASH).stroke({
        width: r * (0.24 - layer * 0.04),
        color: layer < 3 ? DIVINE_COLORS.gold : DIVINE_COLORS.light,
        alpha: 0.06 + layer * 0.04,
      });
    }
    g.ellipse(0, 0, radius, radius * SQUASH).stroke({
      width: Math.max(r * 0.03, 1),
      color: DIVINE_COLORS.white,
      alpha: 0.95,
    });
    g.ellipse(0, 0, radius * 0.84, radius * 0.84 * SQUASH).stroke({
      width: Math.max(r * 0.015, 1),
      color: DIVINE_COLORS.light,
      alpha: 0.6,
    });
    g.blendMode = "add";
    this.halo.addChild(g);
  }

  private glow(tint: number): Sprite {
    const sprite = new Sprite(this.host.textures.glow);
    sprite.anchor.set(0.5);
    sprite.tint = tint;
    sprite.blendMode = "add";
    return sprite;
  }
}
