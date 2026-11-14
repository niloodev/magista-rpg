import type { IRollOutcome } from "@magista/shared";

/**
 * Splits an outcome into the sum of its dice and the sum of its flat modifiers.
 */
export function splitOutcome(outcome: IRollOutcome) {
  const dice = outcome.terms.reduce(
    (sum, term) =>
      term.kind === "dice" ? sum + term.sign * term.results.reduce((a, b) => a + b, 0) : sum,
    0,
  );
  return { dice, modifier: outcome.total - dice };
}

/**
 * Natural 20 or 1 on the first single d20 of an outcome.
 */
export function naturalOf(outcome: IRollOutcome): "critical" | "fumble" | null {
  const d20 = outcome.terms.find(
    (term) => term.kind === "dice" && term.sides === 20 && term.count === 1,
  );
  if (!d20 || d20.kind !== "dice") return null;
  if (d20.results[0] === 20) return "critical";
  return d20.results[0] === 1 ? "fumble" : null;
}

/**
 * Range of the dice part of an outcome, used for the spinning numbers.
 */
export function diceRange(outcome: IRollOutcome) {
  return outcome.terms.reduce(
    (range, term) =>
      term.kind === "dice" && term.sign > 0
        ? { min: range.min + term.count, max: range.max + term.count * term.sides }
        : range,
    { min: 0, max: 0 },
  );
}

/**
 * Whether the user asked the system for reduced motion (false during server rendering).
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
