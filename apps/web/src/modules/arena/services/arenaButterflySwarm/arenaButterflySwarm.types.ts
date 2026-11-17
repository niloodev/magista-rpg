import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** One butterfly of a swarm: where it flies, when, how big and how it looks. */
export interface IButterflyFlight {
  /** Where it is `time` seconds into the animation (in the pixels of the swarm's container). */
  path: (time: number) => IArenaPoint2;
  /** When it appears and how long it lives, in seconds of the animation. */
  born: number;
  life: number;
  /** Wingspan, in pixels. */
  size: number;
  /** Wingbeats per second. */
  flap: number;
  /** A glowing one is added to the scene (light); a plain one covers it (a silhouette). */
  glowing: boolean;
  tint: (life: number) => number;
  /** How visible it is along its life (default: fades in and out). */
  alpha?: (life: number) => number;
  /** Its own seed for the flutter, so no two flutter alike. */
  seed: number;
}
