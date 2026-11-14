import {
  DICE_MAX_COUNT,
  DICE_MAX_SIDES,
  DICE_MAX_TERMS,
  DICE_TERM_PATTERN,
  D20_SIDES,
  FLAT_TERM_PATTERN,
} from "./dice.constants";
import type {
  DiceSign,
  IDiceTerm,
  IRollOptions,
  IRollOutcome,
  IRolledTerm,
  NaturalOutcome,
  RandomInt,
} from "./dice.types";

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
 * Rolls a parsed expression at its highest possible total (critical damage): added dice on their top face,
 * subtracted dice on 1.
 */
export function maximizeTerms(terms: IDiceTerm[]): IRolledTerm[] {
  return terms.map((term) =>
    term.kind === "flat"
      ? term
      : { ...term, results: Array<number>(term.count).fill(term.sign > 0 ? term.sides : 1) },
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
 * Parses and rolls an expression (every die at its highest face with `maximize`), returning null when invalid.
 */
export function rollDiceExpression(
  expression: string,
  randomInt: RandomInt,
  options: IRollOptions = {},
): IRollOutcome | null {
  const parsed = parseDiceExpression(expression);
  if (!parsed) return null;
  const terms = options.maximize ? maximizeTerms(parsed) : rollTerms(parsed, randomInt);
  return { expression, terms, total: sumRolledTerms(terms) };
}

/**
 * Natural 20 (critical) or natural 1 (fumble) on the first single d20 of an outcome.
 */
export function naturalOutcome(outcome: IRollOutcome): NaturalOutcome {
  const d20 = outcome.terms.find(
    (term) => term.kind === "dice" && term.sides === D20_SIDES && term.count === 1,
  );
  if (!d20 || d20.kind !== "dice") return null;
  if (d20.results[0] === D20_SIDES) return "critical";
  return d20.results[0] === 1 ? "fumble" : null;
}
