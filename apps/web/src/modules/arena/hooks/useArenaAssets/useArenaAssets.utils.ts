import type { RefObject } from "react";

import type { IArenaStageControls } from "@/modules/arena/arena.types";

import { ARENA_STAGE_POLL_MS } from "./useArenaAssets.constants";

/** The board controls once the board is on the page, or null if it does not show up within `limitMs`. */
export async function stageControls(
  controlsRef: RefObject<IArenaStageControls | null>,
  limitMs: number,
): Promise<IArenaStageControls | null> {
  const until = performance.now() + limitMs;
  while (!controlsRef.current && performance.now() < until) {
    await new Promise((resolve) => window.setTimeout(resolve, ARENA_STAGE_POLL_MS));
  }
  return controlsRef.current;
}

/** Waits for `task` (a failure counts as finished), but never longer than `limitMs`. */
export function withLimit(task: Promise<unknown>, limitMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, limitMs);
    const finish = () => {
      window.clearTimeout(timer);
      resolve();
    };
    task.then(finish, finish);
  });
}

/** Whether the device asked to save data (then the scene maps are not fetched ahead). */
export function savesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}
