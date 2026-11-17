import { Container, Sprite } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import { castArc } from "@/modules/arena/services/arenaCastEffect";
import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
  type IEnergyPalette,
} from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import { VOODOO_COLORS } from "@/modules/arena/services/arenaVoodooFireEffect";
import {
  bump,
  phase,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  VOODOO_CAST_DURATION_MS,
  VOODOO_CAST_FIELD,
  VOODOO_CAST_HIT_MS,
  VOODOO_CAST_RELEASE_MS,
} from "./arenaVoodooCastEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * The caster's part of "Conjuração Vodu", made with the fire of the energy kit: green fire spirals up around the
 * caster as it gathers (a ring of fire at its feet pouring into a fluid in fire mode, swirled around it), then a
 * ball of fire (a white-hot heart in a spinning ring of fire) flies in an arc to the target, leaving a real tail of
 * flames that rise and tear apart behind it; the target bursts when it lands. The flames left behind fade by
 * themselves.
 */
export class ArenaVoodooCastEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.35,
    bloomScale: 0.9,
    blur: 5,
    quality: 3,
  });
  private readonly fluid: ArenaEnergyFluid;
  private readonly parts = new Container();
  private readonly aura: Sprite;
  private readonly halo: Sprite;
  private readonly heart: Sprite;
  private readonly gather: ArenaEnergyFlow;
  private readonly gatherInk: ArenaEnergyFlow;
  private readonly gatherRed: ArenaEnergyFlow;
  private readonly ball: ArenaEnergyFlow;
  private readonly ballInk: ArenaEnergyFlow;
  private readonly ballRed: ArenaEnergyFlow;
  private fluidSeconds = 0;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const { side, above, below } = VOODOO_CAST_FIELD;
    const peak = castArc(options.toward, 0.5);
    const left = Math.min(0, options.toward.x) - r * side;
    const top = Math.min(0, options.toward.y, peak.y) - r * above;
    this.fluid = new ArenaEnergyFluid(host, {
      area: {
        x: left,
        y: top,
        width: Math.max(0, options.toward.x) + r * side - left,
        height: Math.max(0, options.toward.y) + r * below - top,
      },
      palette: ENERGY_PALETTES.voodoo,
      secondary: ENERGY_PALETTES.hellfire,
      mode: "fire",
      resolution: 360,
      simulation: 104,
      pressureSteps: 10,
      decay: 0.4,
      turbulence: { scale: r * 0.8, force: r * 6 },
      vorticity: 40,
      threads: 3,
      gain: 1.15,
      seed: options.seed,
    });
    this.aura = this.glow(VOODOO_COLORS.lime);
    this.halo = this.glow(VOODOO_COLORS.green);
    this.heart = this.glow(VOODOO_COLORS.core);
    const feet = circlePath(r * 1.15, 40, 0.45).map((point) => ({
      x: point.x,
      y: point.y + r * 0.4,
    }));
    this.gather = this.ring(ENERGY_PALETTES.voodooHot, options.seed + 1);
    this.gatherInk = this.ring(ENERGY_PALETTES.voodoo, options.seed + 2);
    this.gather.setPath(feet, r * 0.22);
    this.gatherInk.setPath(feet, r * 0.6);
    this.gatherRed = this.ring(ENERGY_PALETTES.hellfire, options.seed + 5);
    this.gatherRed.setPath(
      circlePath(r * 1.45, 40, 0.45).map((point) => ({ x: point.x, y: point.y + r * 0.35 })),
      r * 0.5,
    );
    this.ball = this.ring(ENERGY_PALETTES.voodooHot, options.seed + 3);
    this.ballInk = this.ring(ENERGY_PALETTES.voodoo, options.seed + 4);
    this.ballRed = this.ring(ENERGY_PALETTES.hellfire, options.seed + 6);
    this.fluid.sources.addChild(
      this.gatherInk.mesh,
      this.gatherRed.mesh,
      this.ballInk.mesh,
      this.ballRed.mesh,
    );
    this.bloom.resolution = 1;
    this.parts.addChild(this.aura, this.gather.mesh, this.halo, this.ball.mesh, this.heart);
    this.parts.filters = [this.bloom];
    this.container.eventMode = "none";
    this.container.addChild(this.fluid.view, this.parts);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    if (elapsed >= VOODOO_CAST_DURATION_MS) return { done: true, frame: REST };
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const gathering = phase(elapsed, 0, VOODOO_CAST_RELEASE_MS * 0.6);
    const released = phase(elapsed, VOODOO_CAST_RELEASE_MS, VOODOO_CAST_RELEASE_MS + 120);
    const ring = gathering * (1 - released);
    this.aura.width = this.aura.height = r * (2.6 + 0.4 * Math.sin(seconds * 20)) * gathering;
    this.aura.alpha = 0.6 * (1 - phase(elapsed, VOODOO_CAST_RELEASE_MS, VOODOO_CAST_HIT_MS));
    this.gather.mesh.rotation = seconds * 2;
    this.gather.update(seconds, { alpha: ring });
    this.gatherInk.update(seconds, { alpha: ring });
    this.gatherRed.update(seconds, { alpha: ring * 0.9 });
    const flying = this.flyBall(elapsed, seconds, r);
    const after = phase(elapsed, VOODOO_CAST_HIT_MS, VOODOO_CAST_DURATION_MS);
    this.fluid.update(delta, {
      inject: elapsed < VOODOO_CAST_HIT_MS ? 11 : 0,
      alpha: 1 - phase(after, 0.5, 1),
      bias: flying
        ? { drift: { x: 0, y: -r * 3 } }
        : { center: { x: 0, y: 0 }, swirl: r * 4, radial: -r * 0.5, drift: { x: 0, y: -r * 3 } },
    });
    const pull = 0.06 * bump(elapsed, 0, VOODOO_CAST_RELEASE_MS + 100);
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + pull, scaleY: 1 + pull } };
  }

  destroy(): void {
    this.parts.filters = [];
    this.bloom.destroy();
    const inks = [this.gatherInk, this.gatherRed, this.ballInk, this.ballRed];
    for (const flow of inks) flow.mesh.removeFromParent();
    for (const flow of [this.gather, this.ball, ...inks]) flow.destroy();
    this.fluid.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The ball of fire in flight, from the release to the hit along the arc: a white-hot heart in a green halo
   * inside a spinning ring of fire, pouring its tail into the flames. False when it is not flying.
   */
  private flyBall(elapsed: number, seconds: number, r: number): boolean {
    const flight =
      (elapsed - VOODOO_CAST_RELEASE_MS) / (VOODOO_CAST_HIT_MS - VOODOO_CAST_RELEASE_MS);
    const flying = flight >= 0 && flight < 1;
    for (const sprite of [this.halo, this.heart]) sprite.visible = flying;
    if (!flying) {
      this.ball.update(seconds, { alpha: 0 });
      this.ballInk.update(seconds, { alpha: 0 });
      this.ballRed.update(seconds, { alpha: 0 });
      return false;
    }
    const at: IArenaPoint2 = castArc(this.options.toward, flight ** 1.3);
    const grow = Math.min(flight * 6, 1);
    const ring = circlePath(r * 0.5 * grow, 32, 1).map((point) => ({
      x: point.x + at.x,
      y: point.y + at.y,
    }));
    this.ball.setPath(ring, r * 0.35);
    this.ball.update(seconds * 3, { alpha: 1 });
    this.ballInk.setPath(ring, r * 0.7);
    this.ballInk.update(seconds, { alpha: 1 });
    this.ballRed.setPath(
      circlePath(r * 0.8 * grow, 32, 1).map((point) => ({ x: point.x + at.x, y: point.y + at.y })),
      r * 0.5,
    );
    this.ballRed.update(seconds, { alpha: 0.9 });
    this.halo.position.set(at.x, at.y);
    this.halo.width = this.halo.height = r * (2 + 0.3 * Math.sin(seconds * 30)) * grow;
    this.halo.alpha = 0.85;
    this.heart.position.set(at.x, at.y);
    this.heart.width = this.heart.height = r * 0.8 * grow;
    this.heart.alpha = 1;
    return true;
  }

  private ring(palette: IEnergyPalette, seed: number): ArenaEnergyFlow {
    return new ArenaEnergyFlow({
      palette,
      speed: 360,
      grain: 40,
      sharpness: 3,
      strands: 3,
      feather: 0.5,
      closed: true,
      samples: 40,
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
