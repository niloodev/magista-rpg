"use client";

import { APP_VERSION } from "@/core/services/version";
import { ArenaSkeleton } from "@/modules/arena/components";
import { ARENA_ASSETS, ARENA_ASSET_TEXTS } from "@/modules/arena/arena.constants";
import { AssetLoadingScreen } from "@/shared/components/organisms";
import { SheetSkeleton } from "@/modules/sheet/components/organisms";
import { TableSkeleton } from "@/modules/table/components/organisms";

import { useRouteSkeleton } from "./RouteSkeleton.hook";

/**
 * Skeleton of the page being opened, shown while the session is still loading.
 */
export function RouteSkeleton() {
  const { arena, sheet, sheetWindow, known, gm, loginLength } = useRouteSkeleton();
  if (arena) {
    return (
      <>
        <ArenaSkeleton gm={known && gm} />
        <AssetLoadingScreen
          className="hidden lg:flex"
          progress={0}
          title={ARENA_ASSET_TEXTS.title}
          label={ARENA_ASSET_TEXTS.label}
          detail={ARENA_ASSETS[0].label}
          version={ARENA_ASSET_TEXTS.version(APP_VERSION)}
          closing={false}
        />
      </>
    );
  }
  return sheet ? (
    <SheetSkeleton gm={gm} variant={sheetWindow ? "window" : "page"} />
  ) : (
    <TableSkeleton known={known} gm={gm} loginLength={loginLength} />
  );
}
