import { Mesh, MeshGeometry, Shader } from "pixi.js";

import { ENERGY_DEFAULTS, ENERGY_FRAGMENT, ENERGY_VERTEX } from "./arenaEnergyFlow.constants";
import type {
  EnergyPath,
  EnergyWidth,
  IEnergyFlowFrame,
  IEnergyFlowOptions,
} from "./arenaEnergyFlow.types";
import { buildRibbon, colorChannels, resamplePath } from "./arenaEnergyFlow.utils";

interface IEnergyUniforms {
  uTime: number;
  uSpeed: number;
  uGrain: number;
  uLength: number;
  uWidth: number;
  uHead: number;
  uTail: number;
  uAlpha: number;
  uSharp: number;
  uSeed: number;
  uClosed: number;
  uStrands: number;
  uFeather: number;
  uDensity: number;
  uCore: Float32Array;
  uMid: Float32Array;
  uDeep: Float32Array;
}

/**
 * A ribbon of flowing energy (like the energy that runs through hextech): a mesh along any path, open (a stream,
 * a bolt, a strand) or closed (a ring, a halo, a vortex), where a shader streams a procedural fluid of light
 * (warped noise, with luminous veins bending through it), burning white where it is densest, in its palette. Draw it by putting `mesh` in the scene; give it a path
 * with `setPath` (again whenever it moves) and run it with `update`. Additive by default; with `blend: "normal"`
 * and a dark palette whose `deep` is the bright one, it draws a soft shadow body with a glowing rim instead.
 */
export class ArenaEnergyFlow {
  readonly mesh: Mesh<MeshGeometry, Shader>;
  private readonly uniforms: IEnergyUniforms;
  private readonly samples: number;
  private readonly closed: boolean;

  constructor(options: IEnergyFlowOptions) {
    this.samples = options.samples ?? ENERGY_DEFAULTS.samples;
    this.closed = options.closed ?? false;
    const shader = Shader.from({
      gl: { vertex: ENERGY_VERTEX, fragment: ENERGY_FRAGMENT },
      resources: {
        energyUniforms: {
          uTime: { value: 0, type: "f32" },
          uSpeed: { value: options.speed ?? ENERGY_DEFAULTS.speed, type: "f32" },
          uGrain: { value: options.grain ?? ENERGY_DEFAULTS.grain, type: "f32" },
          uLength: { value: 1, type: "f32" },
          uWidth: { value: 1, type: "f32" },
          uHead: { value: 1, type: "f32" },
          uTail: { value: 0, type: "f32" },
          uAlpha: { value: 1, type: "f32" },
          uSharp: { value: options.sharpness ?? ENERGY_DEFAULTS.sharpness, type: "f32" },
          uSeed: { value: ((options.seed ?? 0) % 97) * 1.37, type: "f32" },
          uClosed: { value: this.closed ? 1 : 0, type: "f32" },
          uStrands: { value: options.strands ?? ENERGY_DEFAULTS.strands, type: "f32" },
          uFeather: { value: options.feather ?? 0, type: "f32" },
          uDensity: { value: options.density ?? 1, type: "f32" },
          uCore: {
            value: new Float32Array(colorChannels(options.palette.core)),
            type: "vec3<f32>",
          },
          uMid: { value: new Float32Array(colorChannels(options.palette.mid)), type: "vec3<f32>" },
          uDeep: {
            value: new Float32Array(colorChannels(options.palette.deep)),
            type: "vec3<f32>",
          },
        },
      },
    });
    this.uniforms = (shader.resources.energyUniforms as { uniforms: IEnergyUniforms }).uniforms;
    const empty = buildRibbon(resamplePath([{ x: 0, y: 0 }], this.samples), 0, this.closed);
    const geometry = new MeshGeometry({
      positions: empty.positions,
      uvs: empty.uvs,
      indices: empty.indices,
    });
    this.mesh = new Mesh({ geometry, shader });
    this.mesh.blendMode = options.blend === "normal" ? "normal" : "add";
    this.mesh.eventMode = "none";
  }

  /** Lays the ribbon along `path` (resampled), `width` wide (a number, or a function of the share along). */
  setPath(path: EnergyPath, width: EnergyWidth): void {
    const ribbon = buildRibbon(resamplePath(path, this.samples), width, this.closed);
    this.mesh.geometry.positions = ribbon.positions;
    this.mesh.geometry.uvs = ribbon.uvs;
    this.uniforms.uLength = Math.max(ribbon.length, 1);
    this.uniforms.uWidth =
      typeof width === "number" ? width : Math.max(width(0), width(0.5), width(1));
  }

  /** Runs the energy to `seconds` and shows the part from `tail` to `head` at `alpha`. */
  update(seconds: number, frame: IEnergyFlowFrame = {}): void {
    this.uniforms.uTime = seconds;
    this.uniforms.uHead = frame.head ?? 1;
    this.uniforms.uTail = frame.tail ?? 0;
    this.uniforms.uAlpha = frame.alpha ?? 1;
    this.mesh.visible = (frame.alpha ?? 1) > 0 && (frame.head ?? 1) > (frame.tail ?? 0);
  }

  destroy(): void {
    const { geometry, shader } = this.mesh;
    this.mesh.destroy();
    geometry.destroy();
    shader?.destroy();
  }
}
