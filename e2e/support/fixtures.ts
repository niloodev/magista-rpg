import { readFileSync } from "node:fs";

import { STATE_FILE } from "./state";

export interface E2EState {
  playerCharacterId: string;
  otherCharacterId: string;
}

/**
 * Ids prepared by the global setup.
 */
export function e2eState(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as E2EState;
}
