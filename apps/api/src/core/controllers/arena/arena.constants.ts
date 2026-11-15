/** How long a drag preview reuses its authorization (previews are never saved; moves always check again). */
export const ARENA_DRAG_AUTH_TTL_MS = 1000;

/** Most cached drag authorizations kept at once (expired ones are dropped first). */
export const ARENA_DRAG_AUTH_CACHE_MAX = 500;
