/** How long a fog cell takes to cover or clear (ms); the light mode is quicker. */
export const WORLD_FOG_FADE_MS = 1600;

export const WORLD_FOG_FADE_LITE_MS = 300;

/** How far the cloud sea past the edges of the map reaches into it, in world pixels. */
export const WORLD_EDGE_FEATHER = 240;

/** Size of the puffs that make the edge of the fog and of the sea, in world pixels. */
export const WORLD_PUFF_SCALE = 70;

/** Size of the big cloud masses, in world pixels. */
export const WORLD_CLOUD_SCALE = 520;

/** The wind that carries the clouds, in world pixels per second (the high puffs ride faster). */
export const WORLD_WIND = { x: 38, y: -12 } as const;

/** Where the sun is: the clouds are lit from the top left and cast their shadow to the bottom right. */
export const WORLD_SUN = { x: -0.62, y: -0.78 } as const;

/** How far the clouds' shadow falls on the map, in world pixels, and how dark it is. */
export const WORLD_SHADOW = { reach: 55, alpha: 0.5 } as const;

/** Colors of the clouds: sunlit tops, their lit body, the cool shade, the deep folds, and the shadow on the map. */
export const WORLD_CLOUD_COLORS = {
  sun: 0xffffff,
  light: 0xe9eef5,
  shade: 0xa9b6c8,
  deep: 0x66778f,
  shadow: 0x0b1424,
} as const;

/** Vertex shader of a cloud mesh: the usual transform, passing the position (world or screen) on. */
export const CLOUD_VERTEX = `
in vec2 aPosition;
out vec2 vPoint;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vPoint = aPosition;
}
`;

/** Value noise and fractal noise shared by the cloud shaders. */
export const CLOUD_NOISE = `
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
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

float fbm3(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 3; octave++) {
    value += amplitude * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}
`;

/**
 * A sea of clouds seen from above, at a point `p` (in cloud units) at time `t` carried by `drift`: big masses that
 * slowly change shape (noise warped by itself, evolving), with faster, smaller puffs riding over them. `cloudSea`
 * returns the thickness (0 to 1), and `cloudShade` lights it like cumulus in the sun: bright white tops on the side
 * facing the sun, a cool gray-blue body on the far side and blue folds where the clouds thin out.
 */
export const CLOUD_SEA = `
uniform vec3 uSun;
uniform vec3 uLight;
uniform vec3 uShade;
uniform vec3 uDeep;
uniform vec2 uSunDir;

vec2 cloudWarp(vec2 p, float t) {
  return vec2(fbm3(p * 0.55 + vec2(t * 0.045, t * 0.02)), fbm3(p * 0.55 + vec2(5.2, 1.3) - vec2(t * 0.03, t * 0.05)));
}

float cloudSea(vec2 p, vec2 warp, vec2 drift) {
  float masses = fbm(p + drift + warp * 1.35);
  float puffs = fbm3(p * 2.6 + drift * 1.7 + warp * 0.9);
  float tufts = fbm3(p * 7.5 + drift * 2.4 + warp * 0.6);
  return clamp(masses * 0.72 + puffs * 0.34 + tufts * 0.26 - 0.16, 0.0, 1.0);
}

vec3 cloudShade(vec2 p, float t, vec2 drift) {
  vec2 warp = cloudWarp(p, t);
  float thick = cloudSea(p, warp, drift);
  float toward = cloudSea(p + uSunDir * 0.09, warp, drift);
  float lit = clamp(0.5 + (thick - toward) * 7.0, 0.0, 1.0);
  float body = smoothstep(0.25, 0.7, thick);
  vec3 color = mix(uDeep, uShade, smoothstep(0.08, 0.42, thick));
  color = mix(color, uLight, body * (0.35 + 0.65 * lit));
  color = mix(color, uSun, smoothstep(0.5, 0.85, thick) * smoothstep(0.45, 0.9, lit));
  return color;
}
`;

/**
 * The cover of the world map: the cloud sea wherever the map is hidden. Past the edges of the map it is whole; over
 * the fog it follows the painted cells (blurred and read through the cloud thickness, so the edge is made of
 * puffs that boil as the clouds move, and a cell covering or clearing grows or melts in cloud shapes). Where the
 * map shows, the clouds cast a soft shadow on it, down and to the right. Pixels with no cloud and no shadow stop
 * before the costly shading.
 */
export const WORLD_COVER_FRAGMENT = `
in vec2 vPoint;
out vec4 finalColor;
uniform sampler2D uFog;
uniform vec2 uBoard;
uniform vec2 uCell;
uniform float uTime;
uniform float uFogAlpha;
uniform float uFeather;
uniform float uScale;
uniform float uSeed;
uniform vec2 uWind;
uniform float uShadowReach;
uniform float uShadowAlpha;
uniform vec3 uShadow;
uniform float uPuff;
${CLOUD_NOISE}
${CLOUD_SEA}
float fogAt(vec2 uv) {
  return texture(uFog, uv).r;
}

float blurredFog(vec2 uv, float spread) {
  vec2 dx = vec2(uCell.x * spread, 0.0);
  vec2 dy = vec2(0.0, uCell.y * spread);
  return (fogAt(uv) * 2.0 + fogAt(uv + dx) + fogAt(uv - dx) + fogAt(uv + dy) + fogAt(uv - dy)) / 6.0;
}

float outsideDistance(vec2 world) {
  vec2 d = max(-world, world - uBoard);
  return max(d.x, d.y);
}

float edgeOf(vec2 world) {
  return smoothstep(-uFeather, uFeather * 0.15, outsideDistance(world));
}

float fogField(vec2 world) {
  vec2 uv = world / uBoard;
  return blurredFog(uv, 1.3) * 0.3 + blurredFog(uv, 3.5) * 0.3 + blurredFog(uv, 6.5) * 0.4;
}

float coverAt(float edge, float field, bool inside, float lump) {
  float outside = smoothstep(0.34, 0.66, edge * 1.6 - 0.3 + lump);
  if (!inside) return outside;
  float fog = smoothstep(0.34, 0.66, field * 1.6 - 0.3 + lump);
  return max(outside, fog * uFogAlpha);
}

float shadowAt(vec2 world) {
  vec2 caster = world + uSunDir * uShadowReach;
  float occluded = edgeOf(caster);
  if (outsideDistance(caster) <= 0.0) occluded = max(occluded, blurredFog(caster / uBoard, 3.0) * uFogAlpha);
  return smoothstep(0.15, 0.85, occluded) * uShadowAlpha;
}

void main() {
  float edge = edgeOf(vPoint);
  bool inside = outsideDistance(vPoint) <= 0.0;
  float field = inside ? fogField(vPoint) : 0.0;
  if (inside && max(edge, field) < 0.025) {
    float clear = shadowAt(vPoint);
    finalColor = vec4(uShadow * clear, clear);
    return;
  }
  float t = uTime;
  vec2 drift = -uWind * t / uScale;
  vec2 p = vPoint / uScale + vec2(uSeed, uSeed * 0.37);
  vec2 puffDrift = -uWind * t / uPuff * 1.3;
  float big = fbm3(p + drift + vec2(fbm3(p * 0.55 + t * 0.03), 0.0) * 1.2);
  float puff = fbm(vPoint / (uPuff * 1.8) + puffDrift * 0.55 + vec2(0.0, t * 0.06));
  float lump = clamp((big - 0.5) * 0.6 + (puff - 0.5) * 2.0, -0.6, 0.6);
  float cover = coverAt(edge, field, inside, lump);
  float shadow = cover < 0.999 ? shadowAt(vPoint) * (1.0 - cover) : 0.0;
  if (cover <= 0.002) {
    finalColor = vec4(uShadow * shadow, shadow);
    return;
  }
  vec3 color = cloudShade(p, t, drift);
  float fringe = 1.0 - smoothstep(0.55, 1.0, cover);
  color = mix(color, uSun, fringe * 0.35);
  finalColor = vec4(color * cover + uShadow * shadow, cover + shadow);
}
`;
