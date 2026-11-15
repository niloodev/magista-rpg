"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * A callback whose identity never changes but that always runs the latest version of `fn`, so it can be
 * passed to memoized children without making them re-render. Do not call it during render.
 */
export function useStableCallback<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
