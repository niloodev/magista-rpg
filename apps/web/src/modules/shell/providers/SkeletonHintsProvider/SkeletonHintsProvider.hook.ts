"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { ISkeletonHintActions, SkeletonHints } from "./SkeletonHintsProvider.types";
import { fitHints, writeHintsCookie } from "./SkeletonHintsProvider.utils";

/**
 * Keeps the skeleton hints the server already read and validated from the cookie, and writes changes back to the cookie so the
 * next server render already draws the right skeleton. Actions are stable (they read the latest hints from a ref).
 */
export function useSkeletonHintsProvider(initial: SkeletonHints): {
  hints: SkeletonHints;
  actions: ISkeletonHintActions;
} {
  const [hints, setHints] = useState<SkeletonHints>(initial);
  const latest = useRef(hints);

  const setHint = useCallback((key: string, value: unknown) => {
    const next: SkeletonHints = { ...latest.current };
    if (value === null || value === undefined) delete next[key];
    else next[key] = value;
    if (JSON.stringify(next) === JSON.stringify(latest.current)) return;
    const fitted = fitHints(next, key);
    writeHintsCookie(Object.keys(fitted.hints).length === 0 ? null : fitted.value);
    latest.current = fitted.hints;
    setHints(fitted.hints);
  }, []);

  const clearHints = useCallback(() => {
    writeHintsCookie(null);
    latest.current = {};
    setHints({});
  }, []);

  const actions = useMemo(() => ({ setHint, clearHints }), [setHint, clearHints]);
  return { hints, actions };
}
