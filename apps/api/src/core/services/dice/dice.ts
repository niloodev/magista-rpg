import { randomInt } from "node:crypto";

import { getEnv } from "@/core/services/env";

/**
 * Server dice source. Outside production, DEV_FORCED_D20 makes every d20 land on that face (to preview crits/fumbles).
 */
export function serverRandomInt(min: number, max: number): number {
  const env = getEnv();
  const forced = env.NODE_ENV === "production" ? undefined : env.DEV_FORCED_D20;
  if (forced !== undefined && min === 1 && max === 20) return forced;
  return randomInt(min, max + 1);
}
