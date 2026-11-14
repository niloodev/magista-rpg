"use client";

import { SkeletonHintActionsContext, SkeletonHintsContext } from "./SkeletonHintsProvider.context";
import { useSkeletonHintsProvider } from "./SkeletonHintsProvider.hook";
import type { SkeletonHintsProviderProps } from "./SkeletonHintsProvider.types";

/**
 * Per-device layout hints for loading skeletons. `initial` is the `magista-hints` cookie already parsed on the
 * server (`parseHints`), so the first HTML matches the screen that will load and no raw cookie reaches the client.
 */
export function SkeletonHintsProvider({ initial, children }: SkeletonHintsProviderProps) {
  const { hints, actions } = useSkeletonHintsProvider(initial);
  return (
    <SkeletonHintActionsContext.Provider value={actions}>
      <SkeletonHintsContext.Provider value={hints}>{children}</SkeletonHintsContext.Provider>
    </SkeletonHintActionsContext.Provider>
  );
}
