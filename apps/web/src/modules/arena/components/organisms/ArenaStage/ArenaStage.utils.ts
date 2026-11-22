import type { IArenaRenderer } from "@/modules/arena/services/arenaRenderer";

/**
 * Font family next/font registered for Cinzel, so canvas labels match the rest of the UI.
 */
export function readSerifFont(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-cinzel").trim();
  return value ? `${value}, serif` : "serif";
}

/** A promise of the board that resolves once it is created (or with null when the stage goes away first). */
export function deferredRenderer(): {
  wait: Promise<IArenaRenderer | null>;
  resolve: (renderer: IArenaRenderer | null) => void;
} {
  let resolve: (renderer: IArenaRenderer | null) => void = () => {};
  const wait = new Promise<IArenaRenderer | null>((done) => {
    resolve = done;
  });
  return { wait, resolve };
}
