import { ROLL_BURST_LIMIT, ROLL_BURST_WINDOW_MS } from "./realtime.constants";

/**
 * Room that holds every socket of one account, used to force logout.
 */
export function accountRoom(accountId: string): string {
  return `account:${accountId}`;
}

/**
 * Room that follows one character sheet (its owner's sockets).
 */
export function characterRoom(characterId: string): string {
  return `character:${characterId}`;
}

/**
 * Sliding-window gate: allows up to `limit` hits inside `windowMs`.
 */
export function createRateGate(limit: number, windowMs: number, now: () => number = Date.now) {
  let hits: number[] = [];
  return () => {
    const current = now();
    hits = hits.filter((time) => current - time < windowMs);
    if (hits.length >= limit) return false;
    hits.push(current);
    return true;
  };
}

const gates = new Map<string, () => boolean>();

/**
 * Per-account sliding window shared by every table action that reaches other players (rolls, pings, the Marca).
 */
export function gateFor(accountId: string): () => boolean {
  const existing = gates.get(accountId);
  if (existing) return existing;
  const gate = createRateGate(ROLL_BURST_LIMIT, ROLL_BURST_WINDOW_MS);
  gates.set(accountId, gate);
  return gate;
}
