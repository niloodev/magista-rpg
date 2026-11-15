"use client";

import { useApp } from "@/modules/shell/store";

/**
 * The Marca only takes over the sheet background while a trait is shared by it.
 */
export function useMarkedBackdrop() {
  const visible = useApp((state) => state.marked.share !== null);
  return { visible };
}
