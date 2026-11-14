import type { NaturalOutcome } from "@magista/shared";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface IFeedRowShape {
  label: number;
  chips: number;
  modifier: number;
  natural: number;
}

export interface IFeedCardShape {
  name: number;
  title: number;
  subtitle: number;
  byGm: boolean;
  critical: boolean;
  levelUp: boolean;
  rows: IFeedRowShape[];
  short: number[];
  long: number[];
}

export interface IFeedShape {
  count: number;
  cards: IFeedCardShape[];
}

export interface DieChip {
  value: number;
  sides: number;
  natural: NaturalOutcome;
}

export type FeedRowShape = [label: number, chips: number, modifier: number, natural: number];
