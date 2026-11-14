"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { SESSION_HINT_KEY, useSkeletonHint } from "@/modules/shell/providers";

import { SHEET_ROUTE_PREFIX } from "./RouteSkeleton.constants";
import { parseSessionHint } from "./RouteSkeleton.utils";

/**
 * Which page skeleton matches the route, and the last session seen on this device (role, login length).
 */
export function useRouteSkeleton() {
  const pathname = usePathname();
  const raw = useSkeletonHint(SESSION_HINT_KEY);
  const hint = useMemo(() => parseSessionHint(raw), [raw]);
  return { sheet: pathname.startsWith(SHEET_ROUTE_PREFIX), ...hint };
}
