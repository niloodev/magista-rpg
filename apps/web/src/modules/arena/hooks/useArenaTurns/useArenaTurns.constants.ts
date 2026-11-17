/** A turn order update this close to a reveal ends the spinning of those lines (it carries their values). */
export const TURN_REVEAL_SLACK_MS = 400;

/** Lines whose value never came (a failed roll) stop spinning this long after their reveal. */
export const TURN_REVEAL_GRACE_MS = 1500;
