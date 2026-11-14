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
