/**
 * True when a load answer belongs to a sheet the user already navigated away from (another one was requested).
 */
export function isStaleLoad(requestedId: string | null, characterId: string): boolean {
  return requestedId !== null && requestedId !== characterId;
}
