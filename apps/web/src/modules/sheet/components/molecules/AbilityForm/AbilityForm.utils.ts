import type { AttributeKey } from "@magista/shared";

import { NO_VALUE } from "@/modules/sheet/sheet.constants";

/**
 * Maps the select value back to an attribute key or null.
 */
export function toAttribute(value: string): AttributeKey | null {
  return value === NO_VALUE ? null : (value as AttributeKey);
}
