/** Postgres unique violation (Prisma code). */
export const UNIQUE_VIOLATION = "P2002";

/**
 * Minutes an asset stays safe after an upload linked it: the link is written right after the upload returns,
 * so a release or sweep in that window must not delete it.
 */
export const LINK_GRACE_MINUTES = 10;
