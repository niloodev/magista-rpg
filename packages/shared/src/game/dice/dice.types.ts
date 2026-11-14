export type DiceSign = 1 | -1;

export type IDiceTerm =
  | { kind: "dice"; sign: DiceSign; count: number; sides: number }
  | { kind: "flat"; sign: DiceSign; value: number };

export type IRolledTerm =
  | { kind: "dice"; sign: DiceSign; count: number; sides: number; results: number[] }
  | { kind: "flat"; sign: DiceSign; value: number };

export interface IRollOutcome {
  expression: string;
  terms: IRolledTerm[];
  total: number;
}

export type RandomInt = (min: number, max: number) => number;
