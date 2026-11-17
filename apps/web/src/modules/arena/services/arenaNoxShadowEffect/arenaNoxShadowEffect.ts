import { Container, Sprite } from "pixi.js";

import { coilWidth, tendrilPath } from "@/modules/arena/services/arenaDeathRebirthEffect";
import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaEnergyFlow, ENERGY_PALETTES } from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid, FLUID_LINGER_MS } from "@/modules/arena/services/arenaEnergyFluid";
import { NOX_COLORS } from "@/modules/arena/services/arenaSoulDrainEffect";
import {
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  NOX_SHADOW_DURATION_MS,
  NOX_SHADOW_FIELD,
  NOX_SHADOW_HIT_MS,
  NOX_SHADOW_PATH_POINTS,
  NOX_SHADOW_TENDRIL_POINTS,
  NOX_SHADOW_TENDRILS,
} from "./arenaNoxShadowEffect.constants";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** A shadow of his: its soft dark body, the violet energy on it, the darkness it pours, the glow at its point. */
interface INoxShade {
  body: ArenaEnergyFlow;
  energy: ArenaEnergyFlow;
  ink: ArenaEnergyFlow;
  tip: Sprite;
}

/** A tendril of shadow at his feet, and where it rises. */
interface INoxTendril extends INoxShade {
  angle: number;
}

/**
 * Talis's part of "Reencarnação da Morte", made with the same living shadow as the spell: a dark violet aura
 * swells around him and tendrils of shadow rise and writhe at his feet, violet energy running along them, then
 * his own shadow stretches along the ground to the target. All of it pours darkness into a fluid that smokes up
 * around him and along the way, and keeps drifting and fades by itself after his part is over; when the shadow
 * reaches the target, Death comes there.
 */
export class ArenaNoxShadowEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly parts = new Container();
  private readonly aura: Sprite;
  private readonly fluid: ArenaEnergyFluid;
  private readonly tendrils: INoxTendril[] = [];
  private readonly shadow: INoxShade;
  private readonly path: IArenaPoint2[];
  private fluidSeconds = 0;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    const distance = Math.hypot(options.toward.x, options.toward.y) || 1;
    const direction = { x: options.toward.x / distance, y: options.toward.y / distance };
    const from = { x: direction.x * r * 0.5, y: direction.y * r * 0.5 + r * 0.4 };
    const to = { x: options.toward.x, y: options.toward.y + options.targetRadius * 0.4 };
    this.path = tendrilPath(
      from,
      to,
      r * 0.5,
      seededRandom(options.seed)() * 6,
      NOX_SHADOW_PATH_POINTS,
    );
    const { side, above, below } = NOX_SHADOW_FIELD;
    const left = Math.min(0, options.toward.x) - r * side;
    const top = Math.min(0, options.toward.y) - r * above;
    this.fluid = new ArenaEnergyFluid(host, {
      area: {
        x: left,
        y: top,
        width: Math.max(0, options.toward.x) + r * side - left,
        height: Math.max(0, options.toward.y) + r * below - top,
      },
      palette: ENERGY_PALETTES.nox,
      mode: "shadow",
      resolution: 400,
      simulation: 112,
      pressureSteps: 10,
      decay: 0.5,
      turbulence: { scale: r * 1.5, force: r * 4.5 },
      vorticity: 28,
      haze: 0.9,
      gain: 1.2,
      seed: options.seed,
    });
    this.aura = new Sprite(host.textures.glow);
    this.aura.anchor.set(0.5);
    this.aura.tint = NOX_COLORS.purple;
    this.aura.blendMode = "add";
    const bodies = new Container();
    const energies = new Container();
    this.shadow = this.shade(options.seed, bodies, energies);
    const ground = (along: number) => 1 - 0.75 * Math.max(0, (along - 0.8) / 0.2) ** 2;
    this.shadow.body.setPath(this.path, (along) => r * (1 - 0.35 * along) * ground(along));
    this.shadow.energy.setPath(this.path, (along) => r * (0.3 - 0.1 * along) * ground(along));
    this.shadow.ink.setPath(this.path, (along) => r * (1.4 - 0.5 * along));
    for (let index = 0; index < NOX_SHADOW_TENDRILS; index += 1)
      this.tendrils.push({
        angle: (index / NOX_SHADOW_TENDRILS) * Math.PI * 2 + 0.3,
        ...this.shade(options.seed + index * 4 + 2, bodies, energies),
      });
    this.container.eventMode = "none";
    this.parts.addChild(bodies, this.aura, energies);
    this.container.addChild(this.fluid.view, this.parts);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    if (elapsed >= NOX_SHADOW_DURATION_MS) {
      this.parts.visible = false;
      const since = elapsed - NOX_SHADOW_DURATION_MS;
      this.fluid.update(delta, {
        inject: 0,
        decay: 0.42,
        alpha: 1 - phase(since, FLUID_LINGER_MS - 500, FLUID_LINGER_MS),
        bias: { drift: { x: 0, y: -r * 1.5 } },
      });
      return { done: since >= FLUID_LINGER_MS, frame: REST };
    }
    const t = elapsed / NOX_SHADOW_DURATION_MS;
    const hit = NOX_SHADOW_HIT_MS / NOX_SHADOW_DURATION_MS;
    const fade = 1 - phase(t, hit, 1);
    const swell = phase(t, 0, 0.25);
    this.aura.width = this.aura.height = r * (3 + 0.5 * Math.sin(seconds * 6)) * swell;
    this.aura.alpha = 0.55 * fade;
    this.runTendrils(seconds, r, swell * fade);
    const reach = phase(t, 0.2, hit);
    const tail = phase(t, hit, 1);
    this.shadow.body.update(seconds, { head: reach, tail, alpha: 0.9 });
    this.shadow.energy.update(seconds, { head: reach, tail, alpha: 0.95 });
    this.shadow.ink.update(seconds, { head: reach, alpha: 0.8 * fade });
    const front = this.path[Math.round(reach * (this.path.length - 1))];
    this.shadow.tip.visible = reach > 0 && fade > 0 && front !== undefined;
    if (front) {
      this.shadow.tip.position.set(front.x, front.y);
      this.shadow.tip.width = this.shadow.tip.height = r * (0.9 + 0.15 * Math.sin(seconds * 9));
      this.shadow.tip.alpha = 0.5 * fade;
    }
    this.fluid.update(delta, {
      inject: 2.6,
      bias: { center: { x: 0, y: r * 0.3 }, swirl: r * 1.6, drift: { x: 0, y: -r * 1.4 } },
    });
    const rise = Math.sin(Math.PI * Math.min(t / hit, 1)) * 0.06;
    return {
      done: false,
      frame: { dx: 0, dy: -r * rise, scaleX: 1 + rise * 0.5, scaleY: 1 + rise },
    };
  }

  destroy(): void {
    for (const shade of [this.shadow, ...this.tendrils]) {
      shade.ink.mesh.removeFromParent();
      for (const flow of [shade.body, shade.energy, shade.ink]) flow.destroy();
    }
    this.fluid.destroy();
    this.container.destroy({ children: true });
  }

  /** The tendrils rise from his edge and writhe, violet energy on them, pouring darkness as they move. */
  private runTendrils(seconds: number, r: number, strength: number): void {
    this.tendrils.forEach(({ angle, body, energy, ink, tip: glow }, index) => {
      const base = { x: Math.cos(angle) * r * 0.9, y: Math.sin(angle) * r * 0.9 * 0.6 + r * 0.3 };
      const height = r * (1.1 + 0.4 * Math.sin(seconds * 2 + index)) * Math.max(strength, 0.05);
      const tip = { x: base.x + Math.cos(angle) * r * 0.5, y: base.y - height };
      const points = tendrilPath(
        base,
        tip,
        r * 0.3,
        seconds * 5 + index * 1.3,
        NOX_SHADOW_TENDRIL_POINTS,
      );
      body.setPath(points, (along) => r * 0.3 * coilWidth(along));
      energy.setPath(points, (along) => r * 0.11 * coilWidth(along));
      ink.setPath(points, (along) => r * (0.5 - 0.3 * along));
      body.update(seconds, { alpha: 0.95 * strength });
      energy.update(seconds, { alpha: strength });
      ink.update(seconds, { alpha: 0.8 * strength });
      const end = points[points.length - 1];
      glow.visible = strength > 0 && end !== undefined;
      if (end) {
        glow.position.set(end.x, end.y);
        glow.width = glow.height = r * 0.35;
        glow.alpha = 0.5 * strength;
      }
    });
  }

  /**
   * One shadow of his: a soft dark body (black at its heart, a violet rim), thin violet energy running on it, a
   * glow at its point, and the wider darkness it pours into the living shadow.
   */
  private shade(seed: number, bodies: Container, energies: Container): INoxShade {
    const flow = (part: "body" | "energy" | "ink") =>
      new ArenaEnergyFlow({
        palette:
          part === "body"
            ? ENERGY_PALETTES.shade
            : seed % 3 === 0
              ? ENERGY_PALETTES.dusk
              : ENERGY_PALETTES.nox,
        blend: part === "body" ? "normal" : "add",
        density: part === "body" ? 3.5 : 1,
        speed: part === "energy" ? 260 : part === "ink" ? 140 : 90,
        grain: part === "energy" ? 45 : 60,
        sharpness: part === "energy" ? 4.5 : part === "ink" ? 1.5 : 1.2,
        strands: 2,
        feather: part === "energy" ? 0.25 : part === "ink" ? 1 : 0.85,
        samples: NOX_SHADOW_PATH_POINTS + 1,
        seed: seed + (part === "body" ? 0 : part === "energy" ? 1 : 2),
      });
    const tip = new Sprite(this.host.textures.glow);
    tip.anchor.set(0.5);
    tip.tint = NOX_COLORS.lavender;
    tip.blendMode = "add";
    const shade = { body: flow("body"), energy: flow("energy"), ink: flow("ink"), tip };
    bodies.addChild(shade.body.mesh);
    energies.addChild(shade.energy.mesh, tip);
    this.fluid.sources.addChild(shade.ink.mesh);
    return shade;
  }
}
