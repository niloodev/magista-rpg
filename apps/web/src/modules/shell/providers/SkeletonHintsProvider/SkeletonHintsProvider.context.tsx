"use client";

import { createContext, useContext } from "react";

import type { ISkeletonHintActions, SkeletonHints } from "./SkeletonHintsProvider.types";

export const SkeletonHintsContext = createContext<SkeletonHints | null>(null);

export const SkeletonHintActionsContext = createContext<ISkeletonHintActions | null>(null);

/**
 * Raw hint stored under `key` (validate it in the module that owns it), the same on server and client.
 */
export function useSkeletonHint(key: string): unknown {
  const hints = useContext(SkeletonHintsContext);
  if (!hints) throw new Error("useSkeletonHint precisa de SkeletonHintsProvider.");
  return hints[key];
}

/**
 * Stable setters for the per-device skeleton hints (`setHint(key, null)` removes one, `clearHints` all).
 */
export function useSkeletonHintActions(): ISkeletonHintActions {
  const actions = useContext(SkeletonHintActionsContext);
  if (!actions) throw new Error("useSkeletonHintActions precisa de SkeletonHintsProvider.");
  return actions;
}
