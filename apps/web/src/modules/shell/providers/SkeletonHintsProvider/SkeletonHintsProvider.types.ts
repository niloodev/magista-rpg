import type { ReactNode } from "react";

export type SkeletonHints = Record<string, unknown>;

export interface ISkeletonHintActions {
  setHint: (key: string, value: unknown) => void;
  clearHints: () => void;
}

export interface SkeletonHintsProviderProps {
  initial: SkeletonHints;
  children: ReactNode;
}
