import type { ICharacterSheet } from "@magista/shared";

/**
 * True when a save changes fields only the GM may edit (class, level and resource maximums).
 */
export function touchesGmOnlyFields(current: ICharacterSheet, next: ICharacterSheet): boolean {
  return (
    current.identity.class !== next.identity.class ||
    current.identity.level !== next.identity.level ||
    current.resources.health.max !== next.resources.health.max ||
    current.resources.sanity.max !== next.resources.sanity.max
  );
}
