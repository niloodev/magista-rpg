"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * The document body on the client (null while rendering on the server), for portals.
 */
export function useDocumentBody(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => document.body,
    () => null,
  );
}
