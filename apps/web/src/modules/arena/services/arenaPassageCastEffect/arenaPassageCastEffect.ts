import { ColorMatrixFilter, Container, Sprite, type Filter } from "pixi.js";
import { AdvancedBloomFilter } from "pixi-filters";

import {
  BETWEEN_COLORS,
  BETWEEN_FLOOR_TILT,
} from "@/modules/arena/services/arenaBetweenWorldsEffect";
import {
  ArenaButterflySwarm,
  curvePoint,
  easeInOut,
} from "@/modules/arena/services/arenaButterflySwarm";
import { castArc } from "@/modules/arena/services/arenaCastEffect";
import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import {
  ArenaEnergyFlow,
  circlePath,
  ENERGY_PALETTES,
  type IEnergyPalette,
} from "@/modules/arena/services/arenaEnergyFlow";
import { ArenaEnergyFluid } from "@/modules/arena/services/arenaEnergyFluid";
import {
  bump,
  mixColor,
  phase,
  seededRandom,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
  type IArenaPoint2,
} from "@/modules/arena/services/arenaTokenEffects";

import {
  PASSAGE_CAST,
  PASSAGE_CAST_BOW,
  PASSAGE_CAST_FIELD,
  PASSAGE_IDENTITY_MATRIX,
  PASSAGE_UNDONE_MATRIX,
} from "./arenaPassageCastEffect.constants";
import type { IPassageCastPlan, PassageCastVariant } from "./arenaPassageCastEffect.types";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/** Points along the stream of water. */
const STREAM_POINTS = 28;

/**
 * Antropozohl's part of his spells, made with the energy kit. Water gathers in a ring at his feet over a deep blue
 * glow. In the ultimate ("call") he comes apart into his swarm: dark blue and white butterflies leave his body,
 * whirl up around him and fly in arcs to the target on a thin current of pale water, while he dims. In his attack
 * ("flow", "Fluxo do passar") the water he gathers leaves as a torrent that arcs to the target carrying his
 * butterflies, and drains after the hit. The water leaves a wake of glowing mist that fades by itself.
 */
export class ArenaPassageCastEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  readonly tokenFilters: readonly Filter[];
  private readonly plan: IPassageCastPlan;
  private readonly tone = new ColorMatrixFilter();
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.4,
    bloomScale: 0.8,
    blur: 5,
    quality: 3,
  });
  private readonly fluid: ArenaEnergyFluid;
  private readonly parts = new Container();
  private readonly aura: Sprite;
  private readonly ring: ArenaEnergyFlow;
  private readonly ringOuter: ArenaEnergyFlow;
  private readonly ringInk: ArenaEnergyFlow;
  private readonly stream: ArenaEnergyFlow;
  private readonly streamCore: ArenaEnergyFlow;
  private readonly streamInk: ArenaEnergyFlow;
  private readonly swarm: ArenaButterflySwarm;
  private readonly arc: IArenaPoint2[];
  private fluidSeconds = 0;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    host: IArenaFxHost,
    private readonly variant: PassageCastVariant,
  ) {
    this.plan = PASSAGE_CAST[variant];
    const r = options.size / 2;
    const { side, above, below } = PASSAGE_CAST_FIELD;
    const peak = castArc(options.toward, 0.5, PASSAGE_CAST_BOW);
    const left = Math.min(0, options.toward.x) - r * side;
    const top = Math.min(0, options.toward.y, peak.y) - r * above;
    this.fluid = new ArenaEnergyFluid(host, {
      area: {
        x: left,
        y: top,
        width: Math.max(0, options.toward.x) + r * side - left,
        height: Math.max(0, options.toward.y) + r * below - top,
      },
      palette: ENERGY_PALETTES.abyss,
      mode: "water",
      resolution: 360,
      simulation: 104,
      pressureSteps: 10,
      decay: 0.5,
      turbulence: { scale: r * 1.4, force: r * 6 },
      vorticity: 34,
      gain: 1.1,
      seed: options.seed,
    });
    this.aura = new Sprite(host.textures.glow);
    this.aura.anchor.set(0.5);
    this.aura.tint = BETWEEN_COLORS.blue;
    this.aura.blendMode = "add";
    const feet = (scale: number) =>
      circlePath(r * scale, 48, BETWEEN_FLOOR_TILT).map((point) => ({
        x: point.x,
        y: point.y + r * 0.45,
      }));
    this.ring = this.flow(ENERGY_PALETTES.tide, true, options.seed + 1);
    this.ring.setPath(feet(1.15), r * 0.18);
    this.ringOuter = this.flow(ENERGY_PALETTES.abyss, true, options.seed + 2);
    this.ringOuter.setPath(feet(1.55), r * 0.12);
    this.ringInk = this.flow(ENERGY_PALETTES.abyss, true, options.seed + 3);
    this.ringInk.setPath(feet(1.3), r * 0.55);
    this.arc = Array.from({ length: STREAM_POINTS }, (_, index) =>
      castArc(options.toward, index / (STREAM_POINTS - 1), PASSAGE_CAST_BOW),
    );
    const width = this.plan.stream * r;
    this.stream = this.flow(ENERGY_PALETTES.abyss, false, options.seed + 4);
    this.stream.setPath(this.arc, (along) => width * (1.4 + 0.4 * Math.sin(Math.PI * along)));
    this.streamCore = this.flow(ENERGY_PALETTES.tide, false, options.seed + 5);
    this.streamCore.setPath(this.arc, (along) => width * (0.55 + 0.2 * Math.sin(Math.PI * along)));
    this.streamInk = this.flow(ENERGY_PALETTES.abyss, false, options.seed + 6);
    this.streamInk.setPath(this.arc, (along) => width * (2.2 + 1.2 * along));
    this.fluid.sources.addChild(this.ringInk.mesh, this.streamInk.mesh);
    this.swarm = new ArenaButterflySwarm(
      host.textures,
      Math.hypot(options.toward.x, options.toward.y) + r * 8,
    );
    this.planSwarm(r);
    this.bloom.resolution = 1;
    this.parts.addChild(
      this.aura,
      this.ringOuter.mesh,
      this.ring.mesh,
      this.stream.mesh,
      this.streamCore.mesh,
      this.swarm.container,
    );
    this.parts.filters = [this.bloom];
    this.tokenFilters = this.plan.undone > 0 ? [this.tone] : [];
    this.container.eventMode = "none";
    this.container.addChild(this.fluid.view, this.parts);
  }

  step(now: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const { durationMs, hitMs, releaseMs } = this.plan;
    if (elapsed >= durationMs) {
      this.tone.enabled = false;
      return { done: true, frame: REST };
    }
    const r = this.options.size / 2;
    const seconds = elapsed / 1000;
    const delta = seconds - this.fluidSeconds;
    this.fluidSeconds = seconds;
    const gathering = phase(elapsed, 0, releaseMs * 0.8);
    const fading = phase(elapsed, hitMs, durationMs);
    const ring = gathering * (1 - phase(elapsed, releaseMs, hitMs + 150));
    this.aura.width = this.aura.height = r * (3 + 0.3 * Math.sin(seconds * 9)) * gathering;
    this.aura.alpha = 0.5 * gathering * (1 - fading);
    this.ring.update(seconds, { alpha: ring });
    this.ringOuter.update(seconds, { alpha: ring * 0.8 });
    this.ringInk.update(seconds, { alpha: ring });
    const head = phase(elapsed, releaseMs, hitMs) ** 0.8;
    const tail = phase(elapsed, hitMs - 60, durationMs * 0.9) ** 0.9;
    const shown = head > 0 && tail < 1 ? 1 : 0;
    const streamAlpha = this.plan.streamAlpha;
    this.stream.update(seconds, { head, tail, alpha: shown * streamAlpha });
    this.streamCore.update(seconds, { head, tail, alpha: shown * streamAlpha });
    this.streamInk.update(seconds, { head, tail, alpha: shown });
    this.fluid.update(delta, {
      inject: elapsed < hitMs + 200 ? 4.5 : 0,
      alpha: 1 - phase(fading, 0.5, 1),
      bias:
        elapsed < releaseMs
          ? {
              center: { x: 0, y: r * 0.45 },
              swirl: r * 3,
              radial: -r * 0.6,
              drift: { x: 0, y: -r * 1.5 },
            }
          : { drift: { x: this.options.toward.x * 0.6, y: this.options.toward.y * 0.6 - r * 1.5 } },
    });
    this.swarm.update(seconds);
    const undone = this.plan.undone * bump(elapsed, 0, hitMs + 200);
    this.tone.enabled = undone > 0;
    this.tone.matrix = PASSAGE_IDENTITY_MATRIX.map(
      (value, index) => value + ((PASSAGE_UNDONE_MATRIX[index] ?? 0) - value) * undone,
    ) as ColorMatrixFilter["matrix"];
    const length = Math.hypot(this.options.toward.x, this.options.toward.y) || 1;
    const lean = r * this.plan.lean * bump(elapsed, releaseMs - 120, releaseMs + 220);
    const shrink = 0.08 * undone;
    return {
      done: false,
      frame: {
        dx: (this.options.toward.x / length) * lean,
        dy: (this.options.toward.y / length) * lean,
        scaleX: 1 - shrink + 0.04 * Math.sin(seconds * 30) * undone,
        scaleY: 1 - shrink,
      },
    };
  }

  destroy(): void {
    this.parts.filters = [];
    this.bloom.destroy();
    this.tone.destroy();
    for (const ink of [this.ringInk, this.streamInk]) ink.mesh.removeFromParent();
    for (const flow of [
      this.ring,
      this.ringOuter,
      this.ringInk,
      this.stream,
      this.streamCore,
      this.streamInk,
    ])
      flow.destroy();
    this.swarm.destroy();
    this.fluid.destroy();
    this.container.destroy({ children: true });
  }

  /**
   * The butterflies of the cast: in the ultimate they leave his body and whirl up around him before flying off;
   * in the attack they gather around him from a little way off. Then each flies its own arc to the target,
   * reaching it around the hit.
   */
  private planSwarm(r: number): void {
    const random = seededRandom(this.options.seed * 7 + 1);
    const { hitMs, releaseMs, butterflies } = this.plan;
    const release = releaseMs / 1000;
    const hit = hitMs / 1000;
    const toward = this.options.toward;
    const call = this.variant === "call";
    for (let index = 0; index < butterflies; index += 1) {
      const angle = random() * Math.PI * 2;
      const born = call ? random() * release * 0.8 : random() * release * 0.5;
      const leave = release + (index / butterflies) * (hit - release) * 0.55;
      const arrive = Math.min(leave + (hit - release) * 0.7, hit + 0.05);
      const orbit = {
        radius: r * (call ? 0.9 + random() * 1.2 : 1.1 + random() * 0.6),
        speed: (index % 2 === 0 ? 1 : -1) * (2.5 + random() * 1.5),
        climb: r * (call ? 1.8 + random() * 1.4 : 0.6),
      };
      const origin = call
        ? { x: (random() - 0.5) * r * 0.9, y: (random() - 0.5) * r * 0.9 }
        : { x: Math.cos(angle) * r * 3, y: Math.sin(angle) * r * 1.5 - r };
      const circling = (time: number) => {
        const age = Math.max(time - born, 0);
        const out = Math.min(age / 0.45, 1);
        const turn = angle + orbit.speed * age;
        const ring = {
          x: Math.cos(turn) * orbit.radius,
          y:
            Math.sin(turn) * orbit.radius * BETWEEN_FLOOR_TILT -
            orbit.climb * Math.min(age / (hit - born + 0.01), 1),
        };
        const s = easeInOut(out);
        return { x: origin.x + (ring.x - origin.x) * s, y: origin.y + (ring.y - origin.y) * s };
      };
      const lift = circling(leave);
      const bow = (random() - 0.5) * 0.5;
      const control = {
        x: (lift.x + toward.x) / 2 - toward.y * bow,
        y:
          Math.min(lift.y, toward.y) -
          Math.hypot(toward.x, toward.y) * (PASSAGE_CAST_BOW + 0.1) +
          toward.x * bow,
      };
      const end = { x: toward.x + (random() - 0.5) * r, y: toward.y + (random() - 0.6) * r };
      const path = (time: number) =>
        time < leave
          ? circling(time)
          : curvePoint(lift, control, end, easeInOut((time - leave) / (arrive - leave)));
      const glowing = index % 3 === 0;
      const color = glowing
        ? mixColor(BETWEEN_COLORS.white, BETWEEN_COLORS.ice, random())
        : mixColor(BETWEEN_COLORS.deep, BETWEEN_COLORS.blue, random());
      this.swarm.add({
        path,
        born,
        life: arrive + 0.08 - born,
        size: r * (0.3 + random() * 0.2),
        flap: 8 + random() * 4,
        glowing,
        tint: () => color,
        alpha: (life) => Math.min(life * 6, 1) * Math.min((1 - life) * 6, 1),
        seed: random() * 100,
      });
    }
  }

  private flow(palette: IEnergyPalette, closed: boolean, seed: number): ArenaEnergyFlow {
    return new ArenaEnergyFlow({
      palette,
      speed: closed ? 320 : 620,
      grain: closed ? 50 : 70,
      sharpness: 3,
      strands: closed ? 3 : 4,
      feather: 0.55,
      closed,
      samples: closed ? 48 : STREAM_POINTS,
      seed,
    });
  }
}
