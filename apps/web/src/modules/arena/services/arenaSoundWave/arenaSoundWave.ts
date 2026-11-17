import { defaultFilterVert, Filter, GlProgram } from "pixi.js";

import { colorChannels } from "@/modules/arena/services/arenaEnergyFlow";

import {
  SOUND_WAVE_DEFAULTS,
  SOUND_WAVE_FRAGMENT,
  SOUND_WAVE_SLOTS,
} from "./arenaSoundWave.constants";
import type { ISoundWaveFrame, ISoundWaveOptions } from "./arenaSoundWave.types";

type Uniforms = Record<string, unknown>;

/**
 * A filter that makes sound visible: waves of compressed air running out of a source ripple the picture they
 * pass over, splitting its colors a little on the crest. Put it on the world (`host.screen.addWorldFilter`) and
 * give it the waves every frame with `update` (in screen pixels, so it follows the camera).
 */
export class ArenaSoundWaveFilter extends Filter {
  private readonly values: Uniforms;

  constructor(options: ISoundWaveOptions) {
    super({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment: SOUND_WAVE_FRAGMENT,
        name: "arena-sound-wave",
      }),
      resources: {
        soundUniforms: {
          uOrigin: { value: new Float32Array(2), type: "vec2<f32>" },
          uDirection: { value: new Float32Array([1, 0]), type: "vec2<f32>" },
          uUnit: { value: 1, type: "f32" },
          uPush: { value: options.push ?? SOUND_WAVE_DEFAULTS.push, type: "f32" },
          uSplit: { value: options.split ?? SOUND_WAVE_DEFAULTS.split, type: "f32" },
          uTint: { value: new Float32Array(colorChannels(options.tint)), type: "vec3<f32>" },
          uWaves: {
            value: new Float32Array(SOUND_WAVE_SLOTS * 4),
            type: "vec4<f32>",
            size: SOUND_WAVE_SLOTS,
          },
        },
      },
      resolution: 1,
    });
    this.values = (this.resources.soundUniforms as { uniforms: Uniforms }).uniforms;
  }

  update(frame: ISoundWaveFrame): void {
    const values = this.values;
    (values.uOrigin as Float32Array).set([frame.origin.x, frame.origin.y]);
    const length = Math.hypot(frame.direction.x, frame.direction.y) || 1;
    (values.uDirection as Float32Array).set([
      frame.direction.x / length,
      frame.direction.y / length,
    ]);
    values.uUnit = Math.max(frame.unit, 1);
    const waves = values.uWaves as Float32Array;
    waves.fill(0);
    frame.waves.slice(-SOUND_WAVE_SLOTS).forEach((wave, index) => {
      waves.set([wave.radius, wave.strength, wave.thickness, wave.spread], index * 4);
    });
  }
}
