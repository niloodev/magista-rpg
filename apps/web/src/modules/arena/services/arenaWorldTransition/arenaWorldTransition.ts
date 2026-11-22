import { Container, Mesh, MeshGeometry, Shader } from "pixi.js";

import { CLOUD_VERTEX, cloudSeaUniforms } from "@/modules/arena/services/arenaWorldClouds";
import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

import {
  WORLD_TRANSITION_FRAGMENT,
  WORLD_TRANSITION_LITE_TIMING,
  WORLD_TRANSITION_SCALE,
  WORLD_TRANSITION_TIMING,
  WORLD_TRANSITION_ZOOM,
} from "./arenaWorldTransition.constants";
import type {
  IArenaWorldTransitionOptions,
  IWorldTransitionTiming,
  WorldFlight,
  WorldTransitionPhase,
} from "./arenaWorldTransition.types";
import { approachElapsedFor, stepCloudZoom, transitionDensity } from "./arenaWorldTransition.utils";

interface ITransitionUniforms {
  uCenter: Float32Array;
  uScreen: Float32Array;
  uDensity: number;
  uZoom: number;
  uTime: number;
}

/**
 * The flight through the clouds between a scene and the world map (like a game map pulling the camera up to the
 * sky and diving back down), drawn over the whole screen with the same white cloud sea as the world map.
 * `approach` thickens the clouds until the screen is white while the renderer speeds the camera up; the screen
 * stays white while the next map loads; `depart` thins them out while the camera settles on the new map. Flying
 * up (`out`) everything only shrinks; flying down (`in`) it only grows. The light mode plays it short.
 */
export class ArenaWorldTransition {
  readonly layer = new Container();
  readonly timing: IWorldTransitionTiming;
  private flightWay: WorldFlight;
  private readonly mesh: Mesh<MeshGeometry, Shader>;
  private readonly uniforms: ITransitionUniforms;
  private phase: WorldTransitionPhase = "idle";
  private phaseStart = 0;
  private center: IArenaPoint2 = { x: 0, y: 0 };
  private zoom: number;
  private density = 0;
  private lastStep: number | null = null;
  private readonly start = performance.now();
  private coveredWaiters: (() => void)[] = [];
  private readonly positions = new Float32Array(8);

  constructor(private readonly options: IArenaWorldTransitionOptions) {
    this.timing = options.lite ? WORLD_TRANSITION_LITE_TIMING : WORLD_TRANSITION_TIMING;
    this.flightWay = options.flight;
    this.zoom = WORLD_TRANSITION_ZOOM[options.flight].start;
    this.layer.eventMode = "none";
    const shader = Shader.from({
      gl: { vertex: CLOUD_VERTEX, fragment: WORLD_TRANSITION_FRAGMENT },
      resources: {
        transitionUniforms: {
          uCenter: { value: new Float32Array(2), type: "vec2<f32>" },
          uScreen: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
          uDensity: { value: 0, type: "f32" },
          uZoom: { value: 1, type: "f32" },
          uTime: { value: 0, type: "f32" },
          uScale: { value: WORLD_TRANSITION_SCALE, type: "f32" },
          uSeed: { value: (options.seed % 41) * 1.29, type: "f32" },
          ...cloudSeaUniforms(),
        },
      },
    });
    this.uniforms = (
      shader.resources.transitionUniforms as { uniforms: ITransitionUniforms }
    ).uniforms;
    this.mesh = new Mesh({
      geometry: new MeshGeometry({
        positions: new Float32Array(8),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
      }),
      shader,
    });
    this.mesh.eventMode = "none";
    this.layer.addChild(this.mesh);
  }

  /** The clouds gather around `center` (screen pixels) until the screen is white. */
  approach(center: IArenaPoint2, now: number): void {
    this.center = center;
    this.phase = "approach";
    this.phaseStart = now;
  }

  /** Which way the camera flies now (it can turn: the next map decides how it lands). */
  get flight(): WorldFlight {
    return this.flightWay;
  }

  set flight(flight: WorldFlight) {
    this.flightWay = flight;
  }

  /** The clouds are clearing over the landed map (a new switch must gather them again). */
  get departing(): boolean {
    return this.phase === "depart";
  }

  /**
   * A new switch while the clouds clear: they thicken again from how thick they are now (never a jump), flying
   * `flight` from `center`, until the screen is white for the next map.
   */
  regather(flight: WorldFlight, center: IArenaPoint2, now: number): void {
    this.flightWay = flight;
    this.center = center;
    this.phase = "approach";
    this.phaseStart = now - approachElapsedFor(this.density, this.timing);
  }

  /** Starts with the screen already white (the first map waiting under the clouds). */
  cover(center: IArenaPoint2, now: number): void {
    this.center = center;
    this.phase = "covered";
    this.phaseStart = now;
    this.zoom = WORLD_TRANSITION_ZOOM.out.start * 0.6;
    this.releaseWaiters();
  }

  /** Resolves once the screen is white (at once if it already is, or when the transition is torn down). */
  whenCovered(): Promise<void> {
    if (this.phase === "covered" || this.phase === "done") return Promise.resolve();
    return new Promise((resolve) => this.coveredWaiters.push(resolve));
  }

  /** The clouds thin out around `center` (screen pixels), after the screen stayed white for a short beat. */
  depart(center: IArenaPoint2, now: number): void {
    this.center = center;
    const coveredFor = this.phase === "covered" ? now - this.phaseStart : 0;
    this.phase = "depart";
    this.phaseStart = now + Math.max(this.timing.hold - coveredFor, 0);
    this.releaseWaiters();
  }

  /** The clouds fill the whole screen (nothing under them shows, so the board need not be drawn). */
  get opaque(): boolean {
    return this.density >= 0.999;
  }

  /** When the departure really starts (after the white beat), for the camera to start with it. */
  get departStart(): number {
    return this.phaseStart;
  }

  /** Advances the clouds; `done` when the flight is over (then destroy it). */
  step(now: number): { done: boolean } {
    const { width, height } = this.options.size();
    const elapsed = Math.max(now - this.phaseStart, 0);
    if (this.phase === "approach" && elapsed >= this.timing.approach) {
      this.phase = "covered";
      this.phaseStart = now;
      this.releaseWaiters();
    } else if (this.phase === "depart" && elapsed >= this.timing.depart) {
      this.phase = "done";
    }
    const seconds = this.lastStep === null ? 0 : Math.max(now - this.lastStep, 0) / 1000;
    this.lastStep = now;
    this.zoom = stepCloudZoom(this.zoom, this.flightWay, seconds, this.timing);
    this.density = transitionDensity(this.phase, Math.max(now - this.phaseStart, 0), this.timing);
    if (this.positions[2] !== width || this.positions[5] !== height) {
      this.positions.set([0, 0, width, 0, width, height, 0, height]);
      this.mesh.geometry.positions = this.positions;
    }
    this.uniforms.uCenter[0] = this.center.x;
    this.uniforms.uCenter[1] = this.center.y;
    this.uniforms.uScreen[0] = width;
    this.uniforms.uScreen[1] = height;
    this.uniforms.uDensity = this.density;
    this.uniforms.uZoom = this.zoom;
    this.uniforms.uTime = (now - this.start) / 1000;
    return { done: this.phase === "done" };
  }

  destroy(): void {
    this.releaseWaiters();
    const { geometry, shader } = this.mesh;
    this.mesh.destroy();
    geometry.destroy();
    shader?.destroy();
    this.layer.destroy({ children: true });
  }

  private releaseWaiters(): void {
    const waiters = this.coveredWaiters;
    this.coveredWaiters = [];
    for (const resolve of waiters) resolve();
  }
}
