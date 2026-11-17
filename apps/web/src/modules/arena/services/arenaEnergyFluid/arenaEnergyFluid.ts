import { Container, Matrix, Mesh, MeshGeometry, RenderTexture, Shader } from "pixi.js";

import { colorChannels } from "@/modules/arena/services/arenaEnergyFlow";
import type { IArenaFxHost } from "@/modules/arena/services/arenaTokenEffects";

import {
  FLUID_ADVECT,
  FLUID_CURL,
  FLUID_DEFAULTS,
  FLUID_DISPLAY,
  FLUID_DIVERGENCE,
  FLUID_FIRE_DISPLAY,
  FLUID_FORCES,
  FLUID_GRADIENT,
  FLUID_PRESSURE,
  FLUID_SHADOW_DISPLAY,
  FLUID_VERTEX,
} from "./arenaEnergyFluid.constants";
import type { IEnergyFluidFrame, IEnergyFluidOptions } from "./arenaEnergyFluid.types";
import { biasToCells, decayOver, fluidTexels } from "./arenaEnergyFluid.utils";

type Uniforms = Record<string, unknown>;

interface IPass {
  mesh: Mesh<MeshGeometry, Shader>;
  resources: Record<string, unknown>;
  uniforms: Uniforms;
}

/** A pair of textures read from and written to in turn. */
class PingPong {
  read: RenderTexture;
  write: RenderTexture;

  constructor(first: RenderTexture, second: RenderTexture) {
    this.read = first;
    this.write = second;
  }

  swap(): void {
    [this.read, this.write] = [this.write, this.read];
  }

  destroy(): void {
    this.read.destroy(true);
    this.write.destroy(true);
  }
}

/** A quad from (`x`, `y`) to (`x` + `width`, `y` + `height`), with UVs over the whole texture. */
function quad(x: number, y: number, width: number, height: number): MeshGeometry {
  return new MeshGeometry({
    positions: new Float32Array([x, y, x + width, y, x + width, y + height, x, y + height]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
}

/** One shader pass drawn over a quad, with its textures and its uniforms. */
function pass(
  geometry: MeshGeometry,
  fragment: string,
  textures: Record<string, RenderTexture>,
  uniforms: Record<string, { value: unknown; type: string }>,
): IPass {
  const resources: Record<string, unknown> = { passUniforms: uniforms };
  for (const [name, texture] of Object.entries(textures)) resources[name] = texture.source;
  const shader = Shader.from({ gl: { vertex: FLUID_VERTEX, fragment }, resources });
  return {
    mesh: new Mesh({ geometry, shader }),
    resources: shader.resources,
    uniforms: (shader.resources.passUniforms as { uniforms: Uniforms }).uniforms,
  };
}

/**
 * A real fluid of energy on the GPU (Stable Fluids): whatever the effect puts in `sources` (channels, rings,
 * shapes, in their own colors) is poured in as ink every frame. The fluid has a velocity of its own, carried by
 * itself, pushed by a turbulent swirl and the effect's bias, kept from piling up by its pressure and fed by
 * vorticity confinement so its swirls keep spinning: the ink streams, curls and folds like a liquid and slowly
 * dissolves. `view` shows it tone-mapped with the edges of every wisp lit; put it in the scene, keep `sources`
 * out of it, and step it with `update` (with `inject: 0` it keeps flowing and fades by itself).
 */
export class ArenaEnergyFluid {
  readonly sources = new Container();
  readonly view: Mesh<MeshGeometry, Shader>;
  private readonly inject: RenderTexture;
  private readonly dye: PingPong;
  private readonly velocity: PingPong;
  private readonly pressure: PingPong;
  private readonly divergence: RenderTexture;
  private readonly curl: RenderTexture;
  private readonly passes: {
    curl: IPass;
    forces: IPass;
    divergence: IPass;
    pressure: IPass;
    gradient: IPass;
    advectVelocity: IPass;
    advectDye: IPass;
  };
  private readonly display: IPass;
  private readonly toTexels: Matrix;
  private readonly cells: number;
  private seconds = 0;

  constructor(
    private readonly host: IArenaFxHost,
    private readonly options: IEnergyFluidOptions,
  ) {
    const { area } = options;
    const ink = fluidTexels(area, options.resolution ?? FLUID_DEFAULTS.resolution);
    const sim = fluidTexels(area, options.simulation ?? FLUID_DEFAULTS.simulation);
    this.cells = sim.width;
    const floats = (size: { width: number; height: number }) =>
      RenderTexture.create({
        width: size.width,
        height: size.height,
        resolution: 1,
        format: "rgba16float",
      });
    this.inject = RenderTexture.create({ width: ink.width, height: ink.height, resolution: 1 });
    this.dye = new PingPong(floats(ink), floats(ink));
    this.velocity = new PingPong(floats(sim), floats(sim));
    this.pressure = new PingPong(floats(sim), floats(sim));
    this.divergence = floats(sim);
    this.curl = floats(sim);
    this.toTexels = new Matrix(
      ink.width / area.width,
      0,
      0,
      ink.height / area.height,
      (-area.x * ink.width) / area.width,
      (-area.y * ink.height) / area.height,
    );
    const unit = Math.max(area.width, area.height, 1);
    const aspect = new Float32Array([area.width / unit, area.height / unit]);
    const simTexel = new Float32Array([1 / sim.width, 1 / sim.height]);
    const inkTexel = new Float32Array([1 / ink.width, 1 / ink.height]);
    const turbulence = options.turbulence ?? FLUID_DEFAULTS.turbulence;
    const seed = ((options.seed ?? 0) % 89) * 1.71;
    const simQuad = quad(0, 0, sim.width, sim.height);
    const inkQuad = quad(0, 0, ink.width, ink.height);
    const f32 = (value: number) => ({ value, type: "f32" });
    const vec2 = (value: Float32Array) => ({ value, type: "vec2<f32>" });
    const velocity = this.velocity.read;
    this.passes = {
      curl: pass(simQuad, FLUID_CURL, { uVelocity: velocity }, { uTexel: vec2(simTexel) }),
      forces: pass(
        simQuad,
        FLUID_FORCES,
        { uVelocity: velocity, uCurl: this.curl },
        {
          uTexel: vec2(simTexel),
          uAspect: vec2(aspect),
          uDt: f32(0),
          uTime: f32(0),
          uSeed: f32(seed),
          uVorticity: f32(options.vorticity ?? FLUID_DEFAULTS.vorticity),
          uTurbScale: f32(unit / turbulence.scale),
          uTurbForce: f32((turbulence.force * sim.width) / area.width),
          uDrift: vec2(new Float32Array(2)),
          uCenter: vec2(new Float32Array([0.5, 0.5])),
          uRadial: f32(0),
          uSwirl: f32(0),
        },
      ),
      divergence: pass(
        simQuad,
        FLUID_DIVERGENCE,
        { uVelocity: velocity },
        { uTexel: vec2(simTexel) },
      ),
      pressure: pass(
        simQuad,
        FLUID_PRESSURE,
        { uPressure: this.pressure.read, uDivergence: this.divergence },
        { uTexel: vec2(simTexel), uKeep: f32(1) },
      ),
      gradient: pass(
        simQuad,
        FLUID_GRADIENT,
        { uPressure: this.pressure.read, uVelocity: velocity },
        { uTexel: vec2(simTexel) },
      ),
      advectVelocity: pass(
        simQuad,
        FLUID_ADVECT,
        { uVelocity: velocity, uSource: velocity, uInject: this.inject },
        { uSimTexel: vec2(simTexel), uDt: f32(0), uKeep: f32(1), uInjectAmount: f32(0) },
      ),
      advectDye: pass(
        inkQuad,
        FLUID_ADVECT,
        { uVelocity: velocity, uSource: this.dye.read, uInject: this.inject },
        { uSimTexel: vec2(simTexel), uDt: f32(0), uKeep: f32(1), uInjectAmount: f32(0) },
      ),
    };
    const second = options.secondary ?? options.palette;
    this.display = pass(
      quad(area.x, area.y, area.width, area.height),
      options.mode === "shadow"
        ? FLUID_SHADOW_DISPLAY
        : options.mode === "fire"
          ? FLUID_FIRE_DISPLAY
          : FLUID_DISPLAY,
      { uField: this.dye.read },
      {
        uTexel: vec2(inkTexel),
        uTime: f32(0),
        uGain: f32(options.gain ?? FLUID_DEFAULTS.gain),
        uAlpha: f32(1),
        uSeed: f32(seed),
        uAspect: vec2(aspect),
        uGrain: f32((unit / turbulence.scale) * 1.3),
        uThreads: f32(options.threads ?? FLUID_DEFAULTS.threads),
        uHaze: f32(options.haze ?? FLUID_DEFAULTS.haze),
        uRim: { value: new Float32Array(colorChannels(options.palette.core)), type: "vec3<f32>" },
        uMid: { value: new Float32Array(colorChannels(options.palette.mid)), type: "vec3<f32>" },
        uDeep: { value: new Float32Array(colorChannels(options.palette.deep)), type: "vec3<f32>" },
        uRim2: { value: new Float32Array(colorChannels(second.core)), type: "vec3<f32>" },
        uMid2: { value: new Float32Array(colorChannels(second.mid)), type: "vec3<f32>" },
        uDeep2: { value: new Float32Array(colorChannels(second.deep)), type: "vec3<f32>" },
      },
    );
    this.view = this.display.mesh;
    this.view.blendMode = options.mode === "shadow" ? "normal" : "add";
    this.view.eventMode = "none";
    const empty = new Container();
    for (const target of [
      this.inject,
      this.dye.read,
      this.dye.write,
      this.velocity.read,
      this.velocity.write,
      this.pressure.read,
      this.pressure.write,
      this.divergence,
      this.curl,
    ])
      host.screen.renderTo(empty, target);
    empty.destroy();
  }

  /**
   * Moves the fluid on by `delta` seconds: pours in what the sources draw now (times `inject`), pushes it (the
   * turbulence, the swirls and the frame's `bias`), keeps it from piling up, carries the motion and the ink along
   * it, lets them fade, and shows the ink at `alpha`.
   */
  update(delta: number, frame: IEnergyFluidFrame = {}): void {
    const dt = Math.min(Math.max(delta, 0), 1 / 30);
    this.seconds += dt;
    const screen = this.host.screen;
    const inject = frame.inject ?? 1;
    if (inject > 0) screen.renderTo(this.sources, this.inject, this.toTexels);
    const run = (step: IPass, target: RenderTexture) => screen.renderTo(step.mesh, target);
    if (dt > 0) {
      const { curl, forces, divergence, pressure, gradient, advectVelocity, advectDye } =
        this.passes;
      curl.resources.uVelocity = this.velocity.read.source;
      run(curl, this.curl);
      const bias = biasToCells(frame.bias, this.options.area, this.cells);
      forces.resources.uVelocity = this.velocity.read.source;
      forces.uniforms.uDt = dt;
      forces.uniforms.uTime = this.seconds;
      (forces.uniforms.uDrift as Float32Array).set(bias.drift);
      (forces.uniforms.uCenter as Float32Array).set(bias.center);
      forces.uniforms.uRadial = bias.radial;
      forces.uniforms.uSwirl = bias.swirl;
      run(forces, this.velocity.write);
      this.velocity.swap();
      divergence.resources.uVelocity = this.velocity.read.source;
      run(divergence, this.divergence);
      const steps = this.options.pressureSteps ?? FLUID_DEFAULTS.pressureSteps;
      for (let index = 0; index < steps; index += 1) {
        pressure.resources.uPressure = this.pressure.read.source;
        pressure.uniforms.uKeep = index === 0 ? 0.8 : 1;
        run(pressure, this.pressure.write);
        this.pressure.swap();
      }
      gradient.resources.uPressure = this.pressure.read.source;
      gradient.resources.uVelocity = this.velocity.read.source;
      run(gradient, this.velocity.write);
      this.velocity.swap();
      advectVelocity.resources.uVelocity = this.velocity.read.source;
      advectVelocity.resources.uSource = this.velocity.read.source;
      advectVelocity.uniforms.uDt = dt;
      advectVelocity.uniforms.uKeep = decayOver(
        this.options.velocityDecay ?? FLUID_DEFAULTS.velocityDecay,
        dt,
      );
      run(advectVelocity, this.velocity.write);
      this.velocity.swap();
      advectDye.resources.uVelocity = this.velocity.read.source;
      advectDye.resources.uSource = this.dye.read.source;
      advectDye.uniforms.uDt = dt;
      advectDye.uniforms.uKeep = decayOver(
        frame.decay ?? this.options.decay ?? FLUID_DEFAULTS.decay,
        dt,
      );
      advectDye.uniforms.uInjectAmount = inject * dt;
      run(advectDye, this.dye.write);
      this.dye.swap();
    }
    this.display.resources.uField = this.dye.read.source;
    this.display.uniforms.uTime = this.seconds;
    this.display.uniforms.uAlpha = frame.alpha ?? 1;
  }

  destroy(): void {
    const geometries = new Set<MeshGeometry>();
    for (const step of [...Object.values(this.passes), this.display]) {
      const { geometry, shader } = step.mesh;
      step.mesh.destroy();
      geometries.add(geometry);
      shader?.destroy();
    }
    for (const geometry of geometries) geometry.destroy();
    for (const buffers of [this.dye, this.velocity, this.pressure]) buffers.destroy();
    for (const target of [this.inject, this.divergence, this.curl]) target.destroy(true);
    this.sources.destroy({ children: true });
  }
}
