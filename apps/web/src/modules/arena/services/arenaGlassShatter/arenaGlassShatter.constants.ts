export const GLASS_SHATTER_DEFAULTS = {
  shift: 0.2,
  line: 1.1,
} as const;

/**
 * Broken glass over whatever the filter is on: the picture is split into shards around the point of impact
 * (Voronoi cells in log-polar space, so they are long, radial and smaller near the impact, like a pane hit at one
 * point, their borders bent a little so no crack is a clean curve), each shard shifts the picture behind it and
 * catches the light at its own angle, the cracks between them are thin lines of light, the glass around the
 * impact is crushed into small pieces, and as it breaks the shards drift apart and thin gaps open between them.
 * The cracks run outward up to `uReach`.
 */
export const GLASS_SHATTER_FRAGMENT = `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uReach;
uniform float uAmount;
uniform float uBreak;
uniform float uFlash;
uniform float uShift;
uniform float uLine;
uniform float uTime;
uniform float uSeed;
uniform vec3 uEdge;
uniform vec3 uGlow;

const float TURN = 6.2831853;
const float SPOKES = 21.0;
const float RINGS = 1.25;
const float CORE = 0.22;
const float CRUSH = 2.6;

vec2 gCell;
vec2 gNormal;
vec2 gSite;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i).x, hash2(i + vec2(1.0, 0.0)).x, u.x), mix(hash2(i + vec2(0.0, 1.0)).x, hash2(i + vec2(1.0, 1.0)).x, u.x), u.y);
}

vec2 site(vec2 cell, float wrap) {
  vec2 key = wrap > 0.0 ? vec2(mod(cell.x, wrap), cell.y) : cell;
  return 0.06 + 0.88 * hash2(key + uSeed);
}

float border(vec2 x, float wrap) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 nearCell = vec2(0.0);
  vec2 nearOffset = vec2(0.0);
  float nearest = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + site(n + g, wrap) - f;
      float d = dot(r, r);
      if (d < nearest) {
        nearest = d;
        nearOffset = r;
        nearCell = g;
      }
    }
  }
  float edge = 8.0;
  gNormal = vec2(1.0, 0.0);
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = nearCell + vec2(float(i), float(j));
      vec2 r = g + site(n + g, wrap) - f;
      vec2 between = r - nearOffset;
      if (dot(between, between) > 0.00001) {
        vec2 normal = normalize(between);
        float d = dot(0.5 * (nearOffset + r), normal);
        if (d < edge) {
          edge = d;
          gNormal = normal;
        }
      }
    }
  }
  gCell = n + nearCell;
  gSite = nearOffset;
  return edge;
}

void main() {
  vec2 pos = vTextureCoord * uInputSize.xy;
  vec2 p = (pos - uCenter) / uUnit;
  float r = max(length(p), 0.0001);
  float inside = 1.0 - smoothstep(uReach * 0.8, uReach, r);
  float presence = inside * uAmount;
  float crushed = exp(-r * r / CRUSH);
  float fine = 0.0;
  if (crushed > 0.02) {
    float small = border(p * 3.4 + 11.0, 0.0) / 3.4 * uUnit;
    fine = (1.0 - smoothstep(uLine * 0.3, uLine * 1.1, small)) * crushed;
  }
  vec2 bent = p + (vec2(noise(p * 1.9 + uSeed), noise(p * 1.9 + 31.7 + uSeed)) - 0.5) * 0.22;
  float rb = max(length(bent), 0.0001);
  vec2 q = vec2(atan(bent.y, bent.x) / TURN * SPOKES, log(rb + CORE) * RINGS);
  float away = border(q, SPOKES);
  vec2 scale = vec2(TURN * rb / SPOKES, (rb + CORE) / RINGS);
  float edge = away / length(gNormal / scale) * uUnit;
  vec2 rnd = hash2(vec2(mod(gCell.x, SPOKES), gCell.y) + 3.7 + uSeed);
  float spin = rnd.x * TURN;
  vec2 lean = vec2(cos(spin), sin(spin));
  vec2 shift = (lean * (0.35 + 0.65 * rnd.y) + p / r * uBreak * 1.6 * rnd.y) * uShift * uUnit * presence;
  vec4 color = texture(uTexture, clamp((pos - shift) * uInputSize.zw, uInputClamp.xy, uInputClamp.zw));
  float thin = uLine * mix(1.25, 0.7, smoothstep(0.0, max(uReach, 0.001), r));
  float gap = uBreak * (0.3 + 1.5 * rnd.y) * thin;
  float open = (1.0 - smoothstep(gap, gap + 1.2, edge)) * step(0.001, uBreak) * presence;
  color *= 1.0 - open * 0.85;
  color.rgb *= 1.0 + (rnd.y - 0.5) * 0.36 * presence;
  float off = abs(edge - gap);
  float line = 1.0 - smoothstep(thin * 0.35, thin * 1.2, off);
  float glow = exp(-off / (thin * 3.0)) * 0.16;
  float front = smoothstep(uReach * 0.55, uReach * 0.9, r) * inside;
  float sheen = smoothstep(-0.5, 0.6, dot(gSite, lean)) * (0.02 + 0.07 * rnd.y * rnd.y);
  float glint = pow(max(0.0, sin(uTime * 1.8 + rnd.x * TURN + r * 0.5)), 14.0) * 0.14;
  vec3 light = uEdge * (line * (0.7 + 0.5 * front) + fine * 0.8 + sheen + glint) + uGlow * (glow * (1.0 + 2.0 * front) + open * 0.2);
  light *= presence;
  light += uEdge * uFlash * exp(-r * r / 3.0) * uAmount;
  finalColor = vec4(color.rgb + light, clamp(color.a + max(max(light.r, light.g), light.b), 0.0, 1.0));
}
`;
