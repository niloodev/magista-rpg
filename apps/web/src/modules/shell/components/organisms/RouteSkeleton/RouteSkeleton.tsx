"use client";

import { SheetSkeleton } from "@/modules/sheet/components/organisms";
import { TableSkeleton } from "@/modules/table/components/organisms";

import { useRouteSkeleton } from "./RouteSkeleton.hook";

/**
 * Skeleton of the page being opened, shown while the session is still loading.
 */
export function RouteSkeleton() {
  const { sheet, known, gm, loginLength } = useRouteSkeleton();
  return sheet ? (
    <SheetSkeleton gm={gm} />
  ) : (
    <TableSkeleton known={known} gm={gm} loginLength={loginLength} />
  );
}
