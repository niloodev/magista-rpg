import { defaultFilterVert, Filter, GlProgram } from "pixi.js";

import { colorChannels } from "@/modules/arena/services/arenaEnergyFlow";

import { GLASS_SHATTER_DEFAULTS, GLASS_SHATTER_FRAGMENT } from "./arenaGlassShatter.constants";
import type { IGlassShatterFrame, IGlassShatterOptions } from "./arenaGlassShatter.types";

type Uniforms = Record<string, unknown>;

/**
 * A filter that breaks what it is on like a pane of glass hit at one point: shards that shift the picture behind
 * them, cracks of light running outward, and gaps opening as it comes apart. Put it on the world
 * (`host.screen.addWorldFilter`) and move it every frame with `update` (all in screen pixels, so it follows the
 * camera).
 */
export class ArenaGlassShatterFilter extends Filter {
  private readonly values: Uniforms;

  constructor(options: IGlassShatterOptions) {
    super({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: GLASS_SHATTER_FRAGMENT,
        name: "arena-glass-shatter",
      }),
      resources: {
        glassUniforms: {
          uCenter: { value: new Float32Array(2), type: "vec2<f32>" },
          uUnit: { value: 1, type: "f32" },
          uReach: { value: 0, type: "f32" },
          uAmount: { value: 0, type: "f32" },
          uBreak: { value: 0, type: "f32" },
          uFlash: { value: 0, type: "f32" },
          uShift: { value: options.shift ?? GLASS_SHATTER_DEFAULTS.shift, type: "f32" },
          uLine: { value: options.line ?? GLASS_SHATTER_DEFAULTS.line, type: "f32" },
          uTime: { value: 0, type: "f32" },
          uSeed: { value: ((options.seed ?? 0) % 97) * 1.37, type: "f32" },
          uEdge: { value: new Float32Array(colorChannels(options.edge)), type: "vec3<f32>" },
          uGlow: { value: new Float32Array(colorChannels(options.glow)), type: "vec3<f32>" },
        },
      },
      resolution: 1,
    });
    this.values = (this.resources.glassUniforms as { uniforms: Uniforms }).uniforms;
  }

  /** Places the break on the screen and sets how far it has run, how much shows and how far it came apart. */
  update(frame: IGlassShatterFrame): void {
    const values = this.values;
    (values.uCenter as Float32Array).set([frame.center.x, frame.center.y]);
    values.uUnit = Math.max(frame.unit, 1);
    values.uReach = Math.max(frame.reach, 0);
    values.uAmount = frame.amount;
    values.uBreak = frame.breakup ?? 0;
    values.uFlash = frame.flash ?? 0;
    values.uTime = frame.seconds;
  }
}
