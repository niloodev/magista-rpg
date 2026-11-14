import type { IRollOutcome, IRollResult, IRollResultRow } from "@magista/shared";

import {
  FEED_FLAG_BY_GM,
  FEED_FLAG_CRITICAL,
  FEED_FLAG_LEVEL_UP,
  FEED_HINT_CARDS,
  FEED_HINT_MAX_CHIPS,
  FEED_HINT_MAX_NOTE,
  FEED_HINT_MAX_NOTES,
  FEED_HINT_MAX_ROWS,
  PRESENCE_HINT_MAX,
  ROLL_FEED_LIMIT,
  NATURAL_LABELS,
  SHORT_NOTE_MAX_LENGTH,
} from "./table.constants";
import type {
  ConnectionStatus,
  DieChip,
  FeedRowShape,
  IFeedShape,
  NaturalOutcome,
} from "./table.types";

/**
 * Short notes go in a list; long or multi-line notes go in an expandable text.
 */
export function splitNotes(notes: string[]) {
  return {
    short: notes.filter((note) => note.length <= SHORT_NOTE_MAX_LENGTH && !note.includes("\n")),
    long: notes.filter((note) => note.length > SHORT_NOTE_MAX_LENGTH || note.includes("\n")),
  };
}

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.trunc(value), min), max)
    : fallback;

/**
 * Placeholder presence rows from the stored count of people last seen online (one row when missing).
 */
export function presenceRows(value: unknown): number[] {
  const size = clamp(value, 1, PRESENCE_HINT_MAX, 1);
  return Array.from({ length: size }, (_, index) => index);
}

/**
 * Presence rows to draw while the live presence has not arrived (none once someone is listed or offline).
 */
export function presenceLoadingRows(
  connection: ConnectionStatus,
  members: number,
  hint: unknown,
): number[] {
  return members === 0 && connection !== "disconnected" ? presenceRows(hint) : [];
}

/**
 * Feed part of the skeleton hints cookie: total of rolls and, for the first cards, each result row (label
 * length, number of dice, modifier and natural label lengths), the length of each note, flags for the
 * header and frame (1: rolled by the GM, 2: critical, 4: level up) and the lengths of name, title and subtitle. No text.
 */
export function feedHint(rolls: IRollResult[]): {
  n: number;
  c: [FeedRowShape[], number[], number[], number, number[]][];
} {
  const lengths = (list: string[]) =>
    list.slice(0, FEED_HINT_MAX_NOTES).map((note) => Math.min(note.length, FEED_HINT_MAX_NOTE));
  return {
    n: rolls.length,
    c: rolls.slice(0, FEED_HINT_CARDS).map((roll) => {
      const notes = splitNotes(roll.notes);
      const rows = roll.rows.slice(0, FEED_HINT_MAX_ROWS).map((row): FeedRowShape => {
        const modifier = flatModifier(row.outcome);
        const natural = naturalOutcome(row.outcome);
        return [
          Math.min(`${row.label} ${row.outcome.expression}`.length, FEED_HINT_MAX_NOTE),
          Math.min(toDieChips(row.outcome).length, FEED_HINT_MAX_CHIPS),
          modifier === 0 ? 0 : `+ ${Math.abs(modifier)}`.length,
          natural ? NATURAL_LABELS[natural].length : 0,
        ];
      });
      const flags =
        (roll.rolledByGm ? FEED_FLAG_BY_GM : 0) |
        (hasCritical(roll.rows) ? FEED_FLAG_CRITICAL : 0) |
        (roll.kind === "levelUp" ? FEED_FLAG_LEVEL_UP : 0);
      const texts = [roll.characterName, roll.title, roll.subtitle].map((text) =>
        Math.min(text.length, FEED_HINT_MAX_NOTE),
      );
      return [rows, lengths(notes.short), lengths(notes.long), flags, texts];
    }),
  };
}

/**
 * Reads the stored feed hint into the cards the skeleton draws, ignoring anything malformed.
 */
export function parseFeedHint(value: unknown): IFeedShape | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const hint = value as Record<string, unknown>;
  const lengths = (list: unknown) =>
    Array.isArray(list)
      ? list.slice(0, FEED_HINT_MAX_NOTES).map((length) => clamp(length, 1, FEED_HINT_MAX_NOTE, 1))
      : [];
  const cards = Array.isArray(hint.c) ? hint.c.slice(0, FEED_HINT_CARDS) : [];
  return {
    count: clamp(hint.n, 0, ROLL_FEED_LIMIT, 0),
    cards: cards
      .filter((card): card is unknown[] => Array.isArray(card))
      .map(([rows, short, long, flags, texts]) => ({
        name: clamp(Array.isArray(texts) ? texts[0] : undefined, 1, FEED_HINT_MAX_NOTE, 10),
        title: clamp(Array.isArray(texts) ? texts[1] : undefined, 1, FEED_HINT_MAX_NOTE, 16),
        subtitle: clamp(Array.isArray(texts) ? texts[2] : undefined, 0, FEED_HINT_MAX_NOTE, 0),
        byGm: (clamp(flags, 0, 7, 0) & FEED_FLAG_BY_GM) !== 0,
        critical: (clamp(flags, 0, 7, 0) & FEED_FLAG_CRITICAL) !== 0,
        levelUp: (clamp(flags, 0, 7, 0) & FEED_FLAG_LEVEL_UP) !== 0,
        rows: (Array.isArray(rows) ? rows.slice(0, FEED_HINT_MAX_ROWS) : [])
          .filter((row): row is unknown[] => Array.isArray(row))
          .map(([label, chips, modifier, natural]) => ({
            label: clamp(label, 1, FEED_HINT_MAX_NOTE, 1),
            chips: clamp(chips, 0, FEED_HINT_MAX_CHIPS, 1),
            modifier: clamp(modifier, 0, FEED_HINT_MAX_NOTE, 0),
            natural: clamp(natural, 0, FEED_HINT_MAX_NOTE, 0),
          })),
        short: lengths(short),
        long: lengths(long),
      }))
      .filter((card) => card.rows.length > 0),
  };
}

/**
 * Lists every rolled die with natural 20/1 flags (only on d20s).
 */
export function toDieChips(outcome: IRollOutcome): DieChip[] {
  return outcome.terms.flatMap((term) =>
    term.kind === "dice"
      ? term.results.map((value) => ({
          value,
          sides: term.sides,
          natural:
            term.sides === 20 && value === 20
              ? "critical"
              : term.sides === 20 && value === 1
                ? "fumble"
                : null,
        }))
      : [],
  );
}

/**
 * Signed sum of the flat modifiers of an outcome.
 */
export function flatModifier(outcome: IRollOutcome): number {
  return outcome.terms.reduce(
    (sum, term) => (term.kind === "flat" ? sum + term.sign * term.value : sum),
    0,
  );
}

/**
 * Flags a natural 20 or natural 1 on the first single d20 of the outcome.
 */
export function naturalOutcome(outcome: IRollOutcome): NaturalOutcome {
  const d20 = outcome.terms.find(
    (term) => term.kind === "dice" && term.sides === 20 && term.count === 1,
  );
  if (!d20 || d20.kind !== "dice") return null;
  if (d20.results[0] === 20) return "critical";
  if (d20.results[0] === 1) return "fumble";
  return null;
}

/**
 * True when any row of the roll has a natural 20 on a single d20.
 */
export function hasCritical(rows: IRollResultRow[]): boolean {
  return rows.some((row) =>
    row.outcome.terms.some(
      (term) =>
        term.kind === "dice" && term.sides === 20 && term.count === 1 && term.results[0] === 20,
    ),
  );
}
