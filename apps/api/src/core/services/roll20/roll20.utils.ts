import {
  ALIGNMENT_KEYS,
  ATTRIBUTE_KEYS,
  CLASS_KEYS,
  type AlignmentKey,
  type AttributeKey,
  type ClassKey,
} from "@magista/shared";

import { LEGACY_ALIGNMENT_ALIASES, REPEATING_FIELDS } from "./roll20.constants";
import type { Roll20Export, Roll20Row, Roll20Section } from "./roll20.types";

/**
 * Lowercases, strips accents and turns spaces into dashes ("Caçador" becomes "cacador").
 */
export function toSlug(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Reads Roll20 attributes into a name to string map.
 */
export function toAttributeMap(raw: Roll20Export): Map<string, string> {
  const map = new Map<string, string>();
  for (const attribute of raw.attributes) {
    map.set(attribute.name, attribute.current == null ? "" : String(attribute.current));
  }
  return map;
}

/**
 * Parses an integer from a Roll20 value, returning null when empty or not numeric.
 */
export function toInt(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Maps a Roll20 class label to a class key, defaulting to "sem-classe".
 */
export function toClassKey(value: string | undefined): ClassKey {
  const slug = toSlug(value ?? "");
  return (CLASS_KEYS as readonly string[]).includes(slug) ? (slug as ClassKey) : "sem-classe";
}

/**
 * Maps a Roll20 alignment value (including the legacy Morte/Vida values) to an alignment key.
 */
export function toAlignmentKey(value: string | undefined): AlignmentKey | null {
  const slug = toSlug(value ?? "");
  const key = LEGACY_ALIGNMENT_ALIASES[slug] ?? slug;
  return (ALIGNMENT_KEYS as readonly string[]).includes(key) ? (key as AlignmentKey) : null;
}

/**
 * Maps "forMod", "desMod"... to the attribute key, or null for "-".
 */
export function toAttributeKey(value: string | undefined): AttributeKey | null {
  const key = (value ?? "").replace(/Mod$/, "");
  return (ATTRIBUTE_KEYS as readonly string[]).includes(key) ? (key as AttributeKey) : null;
}

/**
 * Groups repeating_* attributes into ordered rows, honoring Roll20's _reporder when present.
 */
export function toRows(map: Map<string, string>, section: Roll20Section): Roll20Row[] {
  const fields = REPEATING_FIELDS[section].join("|");
  const pattern = new RegExp(`^repeating_${section}_(.+)_(${fields})$`);
  const rows = new Map<string, Record<string, string>>();
  for (const [name, value] of map) {
    const match = pattern.exec(name);
    if (!match?.[1] || !match[2]) continue;
    const row = rows.get(match[1]) ?? {};
    row[match[2]] = value;
    rows.set(match[1], row);
  }
  const order = (map.get(`_reporder_repeating_${section}`) ?? "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
  const rank = (id: string) => {
    const index = order.indexOf(id.toLowerCase());
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const ids = [...rows.keys()];
  return ids
    .map((id, position) => ({ id, position }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.position - b.position)
    .map(({ id }) => ({ id, fields: rows.get(id) ?? {} }));
}

/**
 * Truncates text to a maximum length.
 */
export function clip(value: string | undefined, max: number): string {
  return (value ?? "").slice(0, max);
}
