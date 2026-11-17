/** Waves the filter can carry at once (older ones are dropped). */
export const SOUND_WAVE_SLOTS = 8;

export const SOUND_WAVE_DEFAULTS = {
  push: 0.34,
  split: 0.35,
} as const;

/**
 * Sound made visible: each wave is a band of compressed air running out from the source. Inside it the picture is
 * pushed outward then pulled back (one cycle of a pressure wave), so the map and the tokens ripple as the wave
 * passes; the colors split a little on the crest and it catches a faint light. The front opens around a direction
 * and fades softly at its sides.
 */
export const SOUND_WAVE_FRAGMENT = `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec2 uOrigin;
uniform vec2 uDirection;
uniform float uUnit;
uniform float uPush;
uniform float uSplit;
uniform vec3 uTint;
uniform vec4 uWaves[${SOUND_WAVE_SLOTS}];

vec4 sampleAt(vec2 pos) {
  return texture(uTexture, clamp(pos * uInputSize.zw, uInputClamp.xy, uInputClamp.zw));
}

void main() {
  vec2 pos = vTextureCoord * uInputSize.xy;
  vec2 d = (pos - uOrigin) / uUnit;
  float r = max(length(d), 0.0001);
  vec2 outward = d / r;
  float facing = dot(outward, uDirection);
  float push = 0.0;
  float crest = 0.0;
  for (int index = 0; index < ${SOUND_WAVE_SLOTS}; index++) {
    vec4 wave = uWaves[index];
    if (wave.y <= 0.0) continue;
    float edge = cos(min(wave.w, 3.1416));
    float cone = wave.w >= 3.1416 ? 1.0 : smoothstep(edge - 0.35, edge + 0.05, facing);
    float band = (r - wave.x) / max(wave.z, 0.001);
    float packet = exp(-band * band * 1.6);
    float cycle = sin(band * 3.1416) * packet;
    float near = smoothstep(0.0, 0.6, r);
    push += cycle * wave.y * cone * near;
    crest += max(-cycle, 0.0) * wave.y * cone * near;
  }
  vec2 offset = outward * push * uPush * uUnit;
  vec2 apart = offset * uSplit;
  vec4 color = sampleAt(pos - offset);
  color.r = sampleAt(pos - offset - apart).r;
  color.b = sampleAt(pos - offset + apart).b;
  color.rgb += uTint * crest * 0.3 * color.a;
  color.rgb *= 1.0 + crest * 0.12;
  finalColor = color;
}
`;
