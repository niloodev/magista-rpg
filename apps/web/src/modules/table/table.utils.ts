import {
  D20_SIDES,
  naturalOutcome,
  type IRollOutcome,
  type IRollResult,
  type IRollResultRow,
} from "@magista/shared";

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
  MAXIMIZED_LABEL,
  NATURAL_LABELS,
  SHORT_NOTE_MAX_LENGTH,
} from "./table.constants";
import type { ConnectionStatus, DieChip, FeedRowShape, IFeedShape } from "./table.types";

/**
 * Short notes go in a list; long, multi-line or **bold** notes go in an expandable (rich) text.
 */
export function splitNotes(notes: string[]) {
  const isShort = (note: string) =>
    note.length <= SHORT_NOTE_MAX_LENGTH && !note.includes("\n") && !note.includes("**");
  return {
    short: notes.filter(isShort),
    long: notes.filter((note) => !isShort(note)),
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
        return [
          Math.min(`${row.label} ${row.outcome.expression}`.length, FEED_HINT_MAX_NOTE),
          Math.min(toDieChips(row.outcome).length, FEED_HINT_MAX_CHIPS),
          modifier === 0 ? 0 : `+ ${Math.abs(modifier)}`.length,
          rowBadge(row)?.length ?? 0,
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
      })),
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
            term.sides === D20_SIDES && value === D20_SIDES
              ? "critical"
              : term.sides === D20_SIDES && value === 1
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
 * True when any row of the roll has a natural 20 on a single d20.
 */
export function hasCritical(rows: IRollResultRow[]): boolean {
  return rows.some((row) => naturalOutcome(row.outcome) === "critical");
}

/**
 * Label shown after the dice of a row: its natural 20/1, or "Máximo" for damage maximized by a critical.
 */
export function rowBadge(row: IRollResultRow): string | null {
  const natural = naturalOutcome(row.outcome);
  if (natural) return NATURAL_LABELS[natural];
  return row.maximized ? MAXIMIZED_LABEL : null;
}
