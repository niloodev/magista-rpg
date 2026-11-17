/** Antropozohl's casts: the swarm of the ultimate ("Entre os mundos") or the stream of water of his attack. */
export type PassageCastVariant = "call" | "flow";

/** How one variant plays: its timing (ms), its butterflies and the stream it sends. */
export interface IPassageCastPlan {
  durationMs: number;
  hitMs: number;
  releaseMs: number;
  butterflies: number;
  /** Width of the stream of water to the target, in token radii (thin: a current carrying the swarm). */
  stream: number;
  /** How much the caster dims and comes apart while the butterflies leave him (0 none). */
  undone: number;
  /** How strongly the stream shows (the swarm's current is fainter than a torrent). */
  streamAlpha: number;
  /** How far he leans into the cast toward the target, in token radii. */
  lean: number;
}
