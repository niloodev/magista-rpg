import { MAX_LOGIN_LENGTH } from "@/modules/shell/providers";

import { DEFAULT_LOGIN_LENGTH, GM_ROLE_HINT } from "./RouteSkeleton.constants";
import type { ISessionHint } from "./RouteSkeleton.types";

const UNKNOWN: ISessionHint = { known: false, gm: false, loginLength: DEFAULT_LOGIN_LENGTH };

/**
 * Reads the stored session hint, ignoring anything malformed (`known` is false when there is none).
 */
export function parseSessionHint(value: unknown): ISessionHint {
  if (typeof value !== "object" || value === null) return UNKNOWN;
  const hint = value as Record<string, unknown>;
  if (typeof hint.r !== "string") return UNKNOWN;
  const length =
    typeof hint.l === "number" && Number.isFinite(hint.l)
      ? Math.min(Math.max(Math.trunc(hint.l), 1), MAX_LOGIN_LENGTH)
      : DEFAULT_LOGIN_LENGTH;
  return { known: true, gm: hint.r === GM_ROLE_HINT, loginLength: length };
}
