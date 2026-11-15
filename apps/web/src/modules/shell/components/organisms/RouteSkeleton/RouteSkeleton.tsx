"use client";

import { ArenaSkeleton } from "@/modules/arena/components";
import { SheetSkeleton } from "@/modules/sheet/components/organisms";
import { TableSkeleton } from "@/modules/table/components/organisms";

import { useRouteSkeleton } from "./RouteSkeleton.hook";

/**
 * Skeleton of the page being opened, shown while the session is still loading.
 */
export function RouteSkeleton() {
  const { arena, sheet, sheetWindow, known, gm, loginLength } = useRouteSkeleton();
  if (arena) return <ArenaSkeleton />;
  return sheet ? (
    <SheetSkeleton gm={gm} variant={sheetWindow ? "window" : "page"} />
  ) : (
    <TableSkeleton known={known} gm={gm} loginLength={loginLength} />
  );
}
