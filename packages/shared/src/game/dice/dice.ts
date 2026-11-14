import {
  DICE_MAX_COUNT,
  DICE_MAX_SIDES,
  DICE_MAX_TERMS,
  DICE_TERM_PATTERN,
  FLAT_TERM_PATTERN,
} from "./dice.constants";
import type { DiceSign, IDiceTerm, IRollOutcome, IRolledTerm, RandomInt } from "./dice.types";

/**
 * Parses an expression like "2d6 + 3 - 1d4" into terms, or returns null when invalid.
 */
export function parseDiceExpression(expression: string): IDiceTerm[] | null {
  const compact = expression.replace(/\s+/g, "");
  if (!compact) return null;
  const tokens = compact.match(/[+-]?[^+-]+/g);
  if (!tokens || tokens.join("") !== compact || tokens.length > DICE_MAX_TERMS) return null;
  const terms: IDiceTerm[] = [];
  for (const token of tokens) {
    const sign: DiceSign = token.startsWith("-") ? -1 : 1;
    const body = token.replace(/^[+-]/, "");
    const dice = DICE_TERM_PATTERN.exec(body);
    if (dice) {
      const count = dice[1] ? Number(dice[1]) : 1;
      const sides = Number(dice[2]);
      if (count < 1 || count > DICE_MAX_COUNT || sides < 1 || sides > DICE_MAX_SIDES) return null;
      terms.push({ kind: "dice", sign, count, sides });
      continue;
    }
    if (!FLAT_TERM_PATTERN.test(body)) return null;
    terms.push({ kind: "flat", sign, value: Number(body) });
  }
  return terms;
}

/**
 * Rolls a parsed expression with the given integer source (inclusive bounds).
 */
export function rollTerms(terms: IDiceTerm[], randomInt: RandomInt): IRolledTerm[] {
  return terms.map((term) =>
    term.kind === "flat"
      ? term
      : { ...term, results: Array.from({ length: term.count }, () => randomInt(1, term.sides)) },
  );
}

/**
 * Sums rolled terms honoring each term sign.
 */
export function sumRolledTerms(terms: IRolledTerm[]): number {
  return terms.reduce((total, term) => {
    const value =
      term.kind === "flat" ? term.value : term.results.reduce((sum, result) => sum + result, 0);
    return total + term.sign * value;
  }, 0);
}

/**
 * Parses and rolls an expression, returning null when the expression is invalid.
 */
export function rollDiceExpression(expression: string, randomInt: RandomInt): IRollOutcome | null {
  const parsed = parseDiceExpression(expression);
  if (!parsed) return null;
  const terms = rollTerms(parsed, randomInt);
  return { expression, terms, total: sumRolledTerms(terms) };
}
