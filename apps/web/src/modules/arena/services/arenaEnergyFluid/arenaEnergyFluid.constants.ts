export const FLUID_DEFAULTS = {
  resolution: 640,
  simulation: 192,
  decay: 0.45,
  velocityDecay: 0.55,
  turbulence: { scale: 180, force: 260 },
  vorticity: 28,
  threads: 4,
  haze: 0.95,
  pressureSteps: 18,
  gain: 1,
} as const;

/** A tendril: how many threads weave it, how far apart they bow, and how wide the stream of ink it pours is. */
export const TENDRIL_DEFAULTS = {
  threads: 3,
  twist: 0.11,
  thread: 0.42,
  wake: 1.5,
  sharpness: 5,
  strands: 2,
} as const;

/** How long the fluid keeps flowing after its effect ends, fading by itself, in milliseconds. */
export const FLUID_LINGER_MS = 1800;

/** The vertex shader shared by the fluid passes: the usual mesh transform, passing the UVs on. */
export const FLUID_VERTEX = `
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

const NOISE = `
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
  for (int octave = 0; octave < 4; octave++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}
`;

/** Curl of the velocity at each cell (how much it turns there). */
export const FLUID_CURL = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUV - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUV + vec2(uTexel.x, 0.0)).y;
  float b = texture(uVelocity, vUV - vec2(0.0, uTexel.y)).x;
  float t = texture(uVelocity, vUV + vec2(0.0, uTexel.y)).x;
  finalColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}
`;

/**
 * The forces on the fluid: vorticity confinement (it feeds the swirls so they keep spinning, which makes it look
 * liquid), a turbulent push (curl noise, swirling without piling up) and the effect's own bias (a drift, a pour
 * from or into a point, a swirl around it).
 */
export const FLUID_FORCES = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform vec2 uAspect;
uniform float uDt;
uniform float uTime;
uniform float uSeed;
uniform float uVorticity;
uniform float uTurbScale;
uniform float uTurbForce;
uniform vec2 uDrift;
uniform vec2 uCenter;
uniform float uRadial;
uniform float uSwirl;
${NOISE}
float potential(vec2 p) {
  return fbm(p * uTurbScale + vec2(uTime * 0.21 + uSeed, -uTime * 0.17));
}

void main() {
  float l = texture(uCurl, vUV - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUV + vec2(uTexel.x, 0.0)).x;
  float b = texture(uCurl, vUV - vec2(0.0, uTexel.y)).x;
  float t = texture(uCurl, vUV + vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUV).x;
  vec2 grow = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  grow /= length(grow) + 0.0001;
  vec2 confine = grow * uVorticity * c;
  confine.y *= -1.0;
  vec2 p = vUV * uAspect;
  float e = 0.6 / uTurbScale;
  vec2 swirl = vec2(potential(p + vec2(0.0, e)) - potential(p - vec2(0.0, e)), -(potential(p + vec2(e, 0.0)) - potential(p - vec2(e, 0.0)))) / (2.0 * e * uTurbScale);
  vec2 d = (vUV - uCenter) * uAspect;
  float dist = length(d) + 0.0001;
  vec2 bias = uDrift + d / dist * uRadial + vec2(-d.y, d.x) / dist * uSwirl;
  vec2 velocity = texture(uVelocity, vUV).xy;
  velocity += (confine + swirl * uTurbForce + bias) * uDt;
  finalColor = vec4(velocity, 0.0, 1.0);
}
`;

/** How much the velocity spreads out or gathers at each cell. */
export const FLUID_DIVERGENCE = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUV - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUV + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUV - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUV + vec2(0.0, uTexel.y)).y;
  finalColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`;

/** One relaxation step of the pressure that keeps the fluid from piling up (Jacobi). */
export const FLUID_PRESSURE = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
uniform float uKeep;
void main() {
  float l = texture(uPressure, vUV - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUV + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUV - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUV + vec2(0.0, uTexel.y)).x;
  float divergence = texture(uDivergence, vUV).x;
  finalColor = vec4((l + r + b + t - divergence) * 0.25 * uKeep, 0.0, 0.0, 1.0);
}
`;

/** Takes the pressure's push out of the velocity, so what is left only swirls. */
export const FLUID_GRADIENT = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUV - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUV + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUV - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUV + vec2(0.0, uTexel.y)).x;
  vec2 velocity = texture(uVelocity, vUV).xy - vec2(r - l, t - b);
  finalColor = vec4(velocity, 0.0, 1.0);
}
`;

/**
 * Carries a quantity (the velocity itself, or the ink) along the velocity: every cell looks back along the flow,
 * keeps a share of what it finds and adds what the sources pour in.
 */
export const FLUID_ADVECT = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uInject;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uKeep;
uniform float uInjectAmount;
void main() {
  vec2 back = vUV - uDt * texture(uVelocity, vUV).xy * uSimTexel;
  vec4 kept = texture(uSource, back) * uKeep;
  vec4 poured = texture(uInject, vUV) * uInjectAmount;
  finalColor = vec4(min(kept.rgb + poured.rgb, vec3(4.0)), 1.0);
}
`;

/**
 * What shows: not the ink itself (that reads as paint) but the mist of energy it stands for. The ink says where
 * the energy is and how strong; it shows as a translucent haze mottled into wisps by a drifting noise that the
 * ink bends (so the wisps flow and fold with it), with soft veins of light along the level lines. The color is
 * the ink's own hue, kept saturated and never burnt to white; only the hottest veins lean toward the rim color.
 * Premultiplied for additive blending.
 */
export const FLUID_DISPLAY = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform float uTime;
uniform float uGain;
uniform float uAlpha;
uniform float uSeed;
uniform float uGrain;
uniform float uThreads;
uniform float uHaze;
uniform vec2 uAspect;
uniform vec3 uRim;
${NOISE}
float border(vec2 uv) {
  return smoothstep(0.0, 0.07, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
}

float level(vec3 color) {
  return max(max(color.r, color.g), color.b);
}

void main() {
  vec3 ink = texture(uField, vUV).rgb * 2.0;
  ink += texture(uField, vUV - vec2(uTexel.x, 0.0)).rgb;
  ink += texture(uField, vUV + vec2(uTexel.x, 0.0)).rgb;
  ink += texture(uField, vUV - vec2(0.0, uTexel.y)).rgb;
  ink += texture(uField, vUV + vec2(0.0, uTexel.y)).rgb;
  ink /= 6.0;
  float density = level(ink);
  float energy = 1.0 - exp(-density * 1.4);
  vec3 hue = ink / max(density, 0.0001);
  hue = mix(hue, hue * hue, 0.5);
  vec2 p = vUV * uAspect * uGrain;
  float drift = fbm(p + vec2(uTime * 0.22 + uSeed, -uTime * 0.17) + energy * 1.6);
  float wisps = smoothstep(0.28, 0.72, drift);
  float band = energy * uThreads + drift * 3.4;
  float off = abs(fract(band) - 0.5);
  float vein = exp(-off * off * 60.0) * smoothstep(0.06, 0.4, energy);
  float light = energy * (0.3 + 0.7 * wisps) * uHaze + vein * (0.25 + 0.5 * energy);
  vec3 color = hue * light * uGain;
  color += uRim * vein * smoothstep(0.6, 0.95, energy) * 0.3 * uGain;
  float fade = uAlpha * border(vUV);
  float alpha = clamp(level(color), 0.0, 1.0) * fade;
  finalColor = vec4(color * fade, alpha);
}
`;

/**
 * What shows in shadow mode: the same mist, but dark. The ink becomes a living shadow (near black, faintly
 * tinted with its hue, thick where the energy is dense and torn into wisps at its edges) that covers what is under
 * it, with the veins of energy still glowing in the ink's color through it. Premultiplied for normal blending (the
 * glow adds on top of the darkness).
 */
export const FLUID_SHADOW_DISPLAY = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform float uTime;
uniform float uGain;
uniform float uAlpha;
uniform float uSeed;
uniform float uGrain;
uniform float uThreads;
uniform float uHaze;
uniform vec2 uAspect;
uniform vec3 uRim;
${NOISE}
float border(vec2 uv) {
  return smoothstep(0.0, 0.07, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
}

float level(vec3 color) {
  return max(max(color.r, color.g), color.b);
}

void main() {
  vec2 step = uTexel * 2.6;
  vec3 c = texture(uField, vUV).rgb;
  vec3 l = texture(uField, vUV - vec2(step.x, 0.0)).rgb;
  vec3 r = texture(uField, vUV + vec2(step.x, 0.0)).rgb;
  vec3 b = texture(uField, vUV - vec2(0.0, step.y)).rgb;
  vec3 t = texture(uField, vUV + vec2(0.0, step.y)).rgb;
  vec3 ink = (c * 2.0 + l + r + b + t) / 6.0;
  float slope = length(vec2(level(r) - level(l), level(t) - level(b)));
  float density = level(ink);
  float energy = 1.0 - exp(-density * 1.4);
  vec3 hue = ink / max(density, 0.0001);
  vec2 p = vUV * uAspect * uGrain;
  float drift = fbm(p + vec2(uTime * 0.22 + uSeed, -uTime * 0.17) + energy * 1.6);
  float wisps = smoothstep(0.24, 0.7, drift);
  float band = energy * uThreads + drift * 3.4;
  float off = abs(fract(band) - 0.5);
  float vein = exp(-off * off * 40.0) * smoothstep(0.1, 0.5, energy);
  float cover = clamp(energy * (0.45 + 0.55 * wisps) * uHaze * 1.7, 0.0, 0.94);
  vec3 dark = hue * 0.05 * cover;
  float fringe = smoothstep(0.01, 0.3, slope) * (1.0 - smoothstep(0.55, 0.95, energy)) * (0.4 + 0.6 * wisps);
  vec3 glow = hue * (vein * (0.08 + 0.2 * energy) + fringe * 0.3) * uGain;
  glow += uRim * vein * smoothstep(0.6, 0.95, energy) * 0.25 * uGain;
  float fade = uAlpha * border(vUV);
  finalColor = vec4((dark + glow) * fade, cover * fade);
}
`;

/**
 * What shows in fire mode: the ink is heat, not color. Where it is dense the fire burns white-hot (`uCore` to
 * white), then through the palette's `uMid` to its `uDeep` edge as it cools and thins; drifting noise tears it into
 * tongues and licks, and the ink's level lines flicker through it. Premultiplied for additive blending.
 */
export const FLUID_FIRE_DISPLAY = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uField;
uniform vec2 uTexel;
uniform float uTime;
uniform float uGain;
uniform float uAlpha;
uniform float uSeed;
uniform float uGrain;
uniform float uThreads;
uniform float uHaze;
uniform vec2 uAspect;
uniform vec3 uRim;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform vec3 uRim2;
uniform vec3 uMid2;
uniform vec3 uDeep2;
${NOISE}
float border(vec2 uv) {
  return smoothstep(0.0, 0.07, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
}

float level(vec3 color) {
  return max(max(color.r, color.g), color.b);
}

void main() {
  vec3 ink = texture(uField, vUV).rgb * 2.0;
  ink += texture(uField, vUV - vec2(uTexel.x, 0.0)).rgb;
  ink += texture(uField, vUV + vec2(uTexel.x, 0.0)).rgb;
  ink += texture(uField, vUV - vec2(0.0, uTexel.y)).rgb;
  ink += texture(uField, vUV + vec2(0.0, uTexel.y)).rgb;
  ink /= 6.0;
  float density = level(ink);
  float energy = 1.0 - exp(-density * 1.3);
  float warm = smoothstep(-0.15, 0.25, (ink.r - ink.g) / max(density, 0.0001));
  vec2 p = vUV * uAspect * uGrain;
  float lick = fbm(p * vec2(1.0, 0.55) + vec2(uSeed, uTime * 1.4) + energy * 1.2);
  float tongues = smoothstep(0.2, 0.75, lick);
  float band = energy * uThreads + lick * 3.0;
  float off = abs(fract(band) - 0.5);
  float vein = exp(-off * off * 50.0) * smoothstep(0.1, 0.5, energy);
  float heat = clamp(energy * (0.8 + 0.7 * tongues) * uHaze * 1.7 + vein * 0.15, 0.0, 1.0);
  vec3 deep = mix(uDeep, uDeep2, warm);
  vec3 mid = mix(uMid, uMid2, warm);
  vec3 rim = mix(uRim, uRim2, warm);
  vec3 color = mix(deep, mid, smoothstep(0.02, 0.25, heat));
  color = mix(color, rim, smoothstep(0.42, 0.8, heat));
  color = mix(color, vec3(1.0), smoothstep(0.93, 1.0, heat) * 0.3);
  float alpha = smoothstep(0.03, 0.18, heat) * (0.55 + 0.45 * heat) * border(vUV);
  finalColor = vec4(color * alpha * uGain * uAlpha, alpha * uAlpha);
}
`;
