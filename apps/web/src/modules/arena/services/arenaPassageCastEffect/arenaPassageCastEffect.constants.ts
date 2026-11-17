import type { IPassageCastPlan, PassageCastVariant } from "./arenaPassageCastEffect.types";

/**
 * The two casts: in the ultimate the caster comes apart into the swarm, which whirls around him and flies to the
 * target on a thin current; in the attack he gathers the water at his feet and sends it as a torrent that
 * carries his butterflies.
 */
export const PASSAGE_CAST: Record<PassageCastVariant, IPassageCastPlan> = {
  call: {
    durationMs: 1500,
    hitMs: 1150,
    releaseMs: 520,
    butterflies: 40,
    stream: 0.22,
    undone: 1,
    streamAlpha: 0.7,
    lean: 0.04,
  },
  flow: {
    durationMs: 1500,
    hitMs: 720,
    releaseMs: 320,
    butterflies: 22,
    stream: 0.85,
    undone: 0,
    streamAlpha: 1,
    lean: 0.12,
  },
};

export const PASSAGE_CALL_HIT_MS = PASSAGE_CAST.call.hitMs;

export const PASSAGE_FLOW_HIT_MS = PASSAGE_CAST.flow.hitMs;

/** The water around the caster and along the stream, in token radii beyond them (sides, above, below). */
export const PASSAGE_CAST_FIELD = { side: 3, above: 3.5, below: 2 } as const;

/** How far the stream bows up between the caster and the target (share of the distance). */
export const PASSAGE_CAST_BOW = 0.2;

/** The caster coming apart into the swarm: dimmed, cold and blue. */
export const PASSAGE_UNDONE_MATRIX = [
  0.4, 0.1, 0.1, 0, 0, 0.05, 0.5, 0.15, 0, 0.02, 0.1, 0.3, 0.9, 0, 0.12, 0, 0, 0, 0.75, 0,
];

export const PASSAGE_IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
