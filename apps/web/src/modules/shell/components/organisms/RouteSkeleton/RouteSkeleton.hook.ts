"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { ARENA_PATH } from "@/modules/arena/arena.constants";
import { SESSION_HINT_KEY, useSkeletonHint } from "@/modules/shell/providers";

import { SHEET_ROUTE_PREFIX, SHEET_WINDOW_ROUTE_PREFIX } from "./RouteSkeleton.constants";
import { parseSessionHint } from "./RouteSkeleton.utils";

/**
 * Which page skeleton matches the route, and the last session seen on this device (role, login length).
 */
export function useRouteSkeleton() {
  const pathname = usePathname();
  const raw = useSkeletonHint(SESSION_HINT_KEY);
  const hint = useMemo(() => parseSessionHint(raw), [raw]);
  const sheetWindow = pathname.startsWith(SHEET_WINDOW_ROUTE_PREFIX);
  return {
    arena: pathname === ARENA_PATH,
    sheet: sheetWindow || pathname.startsWith(SHEET_ROUTE_PREFIX),
    sheetWindow,
    ...hint,
  };
}
