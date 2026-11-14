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
