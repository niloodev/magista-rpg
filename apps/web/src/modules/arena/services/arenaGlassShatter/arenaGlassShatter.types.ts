import type { IArenaPoint2 } from "@/modules/arena/services/arenaTokenEffects";

/** How the broken glass looks. */
export interface IGlassShatterOptions {
  /** The light on the cracks, and the glow around them and in the gaps between the shards. */
  edge: number;
  glow: number;
  /** How far each shard shifts the image behind it, in units (the refraction of broken glass). */
  shift?: number;
  /** Width of the crack lines, in screen pixels. */
  line?: number;
  seed?: number;
}

/** What the broken glass does this frame. */
export interface IGlassShatterFrame {
  /** The point of impact, in screen pixels, and the size of one unit there (the token radius on screen). */
  center: IArenaPoint2;
  unit: number;
  /** How far from the impact the cracks have run, in units. */
  reach: number;
  /** How much of it shows (0 none, 1 all): fade it out with this. */
  amount: number;
  /** How far the shards have come apart (0 only cracked, 1 gaps open between them). */
  breakup?: number;
  /** A flash at the point of impact (0 to 1). */
  flash?: number;
  seconds: number;
}
