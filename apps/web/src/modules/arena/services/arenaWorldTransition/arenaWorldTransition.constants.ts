import { CLOUD_NOISE, CLOUD_SEA } from "@/modules/arena/services/arenaWorldClouds";

import type { IWorldTransitionTiming, WorldFlight } from "./arenaWorldTransition.types";

/** How long the camera flies into the clouds, how long the screen stays white, and how long it flies out (ms). */
export const WORLD_TRANSITION_TIMING: IWorldTransitionTiming = {
  approach: 950,
  hold: 120,
  depart: 1600,
};

/** The light mode: the same flight, short. */
export const WORLD_TRANSITION_LITE_TIMING: IWorldTransitionTiming = {
  approach: 380,
  hold: 60,
  depart: 600,
};

/**
 * How the clouds are scaled along the flight: flying up they only shrink (from close to far below), flying down
 * they only grow (rushing past the camera), from `start` to `end` at one steady pace.
 */
export const WORLD_TRANSITION_ZOOM: Record<
  WorldFlight,
  { start: number; middle: number; end: number }
> = {
  out: { start: 2.8, middle: 1.25, end: 0.4 },
  in: { start: 0.4, middle: 1.25, end: 3.2 },
};

/** Size of the cloud masses on screen (pixels at zoom 1). */
export const WORLD_TRANSITION_SCALE = 440;

/**
 * The cloud sea over the whole screen at `uDensity` (0 clear, 1 white), scaled around `uCenter` by `uZoom`: the
 * edges of the screen fill first and clear last, the edge of the clear part is made of the clouds' own puffs, and a
 * second, faster layer streaks along the flight so the motion reads as speed.
 */
export const WORLD_TRANSITION_FRAGMENT = `
in vec2 vPoint;
out vec4 finalColor;
uniform vec2 uCenter;
uniform vec2 uScreen;
uniform float uDensity;
uniform float uZoom;
uniform float uTime;
uniform float uScale;
uniform float uSeed;
${CLOUD_NOISE}
${CLOUD_SEA}
void main() {
  vec2 local = (vPoint - uCenter) / uZoom;
  vec2 p = local / uScale + vec2(uSeed, uSeed * 0.61);
  vec2 drift = vec2(-uTime * 0.05, uTime * 0.02);
  float rough = fbm3(p * 1.3 + drift);
  float streak = fbm3(p * 0.5 / max(uZoom, 0.2) + drift * 2.0);
  float radius = length((vPoint - uCenter) / (uScreen * 0.5));
  float level = uDensity * 1.5 - 0.25 + (rough - 0.5) * 0.7 + (streak - 0.5) * 0.25 + (radius - 0.6) * 0.2;
  float cover = smoothstep(0.35, 0.65, level);
  if (cover <= 0.002) {
    finalColor = vec4(0.0);
    return;
  }
  vec3 color = cloudShade(p, uTime * 2.0, drift);
  color = mix(color, uLight, (1.0 - cover) * 0.7);
  finalColor = vec4(color * cover, cover);
}
`;
