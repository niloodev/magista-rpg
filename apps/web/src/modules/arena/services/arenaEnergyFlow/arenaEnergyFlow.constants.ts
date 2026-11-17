import type { IEnergyPalette } from "./arenaEnergyFlow.types";

/**
 * Ready palettes of energy: the divine gold of Lux (`gold`, `holy`, `ember`), the blue of hextech and the reds of
 * the villain's chaos magic (`blood`, `scarlet`, `crimson`), the violet of Nox (`nox`, `dusk`), the green voodoo fire
 * (`voodoo`, `voodooHot`), a red fire to mix with it (`hellfire`) and the body of a shadow (`shade`: black at its heart, a violet rim; use it with `blend: "normal"`).
 */
export const ENERGY_PALETTES = {
  gold: { core: 0xfffbe6, mid: 0xffc93c, deep: 0xb45309 },
  holy: { core: 0xffffff, mid: 0xffe9a8, deep: 0xd99a1c },
  hextech: { core: 0xe6fbff, mid: 0x38bdf8, deep: 0x1e3a8a },
  blood: { core: 0xffe4ea, mid: 0xe42a63, deep: 0x7f0d1e },
  scarlet: { core: 0xffd6f0, mid: 0xff2d6f, deep: 0x8a0a3c },
  crimson: { core: 0xffb3b3, mid: 0xc8102e, deep: 0x4a0010 },
  ember: { core: 0xfff1c2, mid: 0xff9a1f, deep: 0x8a3a00 },
  nox: { core: 0xede9fe, mid: 0x8b5cf6, deep: 0x4c1d95 },
  dusk: { core: 0xe9d5ff, mid: 0xc026d3, deep: 0x581c87 },
  shade: { core: 0x030106, mid: 0x12061f, deep: 0x7c3aed },
  voodoo: { core: 0xd8ff5a, mid: 0x22c94a, deep: 0x7c3aed },
  voodooHot: { core: 0xfdffe0, mid: 0x7dff3a, deep: 0x14b8a6 },
  hellfire: { core: 0xffd27a, mid: 0xff3b1f, deep: 0x7a0a2e },
} as const satisfies Record<string, IEnergyPalette>;

export const ENERGY_DEFAULTS = {
  samples: 48,
  speed: 220,
  grain: 120,
  sharpness: 3,
  strands: 5,
} as const;

/** The vertex shader: the usual mesh transform, passing the ribbon UVs on. */
export const ENERGY_VERTEX = `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

/**
 * The energy: a procedural fluid. Noise is warped through itself twice while it drifts and evolves, stretched
 * along the ribbon so it streams, giving a soft glowing body; the contour lines of the warped field are lit as
 * thin luminous veins that bend and braid with it. Tone-mapped so the densest energy burns white and the rest
 * glows in the palette, fading softly across the ribbon (or, feathered, tearing into wisps at its sides). Premultiplied for additive blending.
 */
export const ENERGY_FRAGMENT = `
in vec2 vUV;
out vec4 finalColor;
uniform float uTime;
uniform float uSpeed;
uniform float uGrain;
uniform float uLength;
uniform float uWidth;
uniform float uHead;
uniform float uTail;
uniform float uAlpha;
uniform float uSharp;
uniform float uSeed;
uniform float uClosed;
uniform float uStrands;
uniform float uFeather;
uniform float uDensity;
uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uDeep;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int octave = 0; octave < 4; octave++) {
    value += amplitude * noise(p);
    p = turn * p * 2.02 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float along = vUV.x;
  float across = vUV.y * 2.0 - 1.0;
  float t = uTime * uSpeed / uGrain;
  vec2 s = vec2(along * uLength / uGrain * 0.45 - t, across * uWidth * 0.5 / uGrain * 1.6) + uSeed;
  vec2 q = vec2(fbm(s + vec2(0.0, t * 0.15)), fbm(s + vec2(4.1, 1.7) - t * 0.12));
  vec2 w = vec2(fbm(s + 2.2 * q + vec2(1.7, 9.2) + t * 0.1), fbm(s + 2.2 * q + vec2(8.3, 2.8) - t * 0.08));
  float f = fbm(s + 2.6 * w);
  float body = smoothstep(0.3, 0.85, f);
  float contour = fract(f * (2.0 + uStrands * 0.5) + t * 0.05);
  float centered = (contour - 0.5) * (3.0 + uSharp * 1.6);
  float vein = exp(-centered * centered) * smoothstep(0.2, 0.55, f);
  float tatter = fbm(vec2(along * uLength / uGrain * 0.8 - t * 0.6, across * 1.4) + uSeed * 1.3);
  float warped = across + (tatter - 0.5) * 0.9 * uFeather;
  float profile = exp(-warped * warped * (2.4 + uFeather * 1.8));
  float rim = 1.0 - smoothstep(0.8 - uFeather * 0.4, 1.0, abs(across));
  float wisps = mix(1.0, smoothstep(0.1, 0.6, tatter + 0.55 - abs(across) * 0.7), uFeather * 0.7);
  float reveal = uClosed > 0.5 ? 1.0 : smoothstep(uTail, uTail + 0.06, along) * (1.0 - smoothstep(uHead - 0.06, uHead, along));
  float energy = (body * 0.5 + vein * 0.85 + body * vein * 0.5) * profile * rim * wisps * reveal;
  float light = 1.0 - exp(-energy * 1.9 * uDensity);
  float hot = smoothstep(0.6, 1.0, light);
  vec3 color = mix(uDeep, uMid, smoothstep(0.0, 0.65, light));
  color = mix(color, uCore, hot) * (1.0 + hot * 0.25);
  float alpha = light * uAlpha;
  finalColor = vec4(color * alpha, alpha);
}
`;
