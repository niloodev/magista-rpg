"use client";

import Link from "next/link";

import { RollFeed } from "@/modules/table/components/organisms";
import { Icon, Skeleton } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules";

import { SHEET_SKELETON_LABEL, SHEET_SKELETON_TITLE } from "./SheetSkeleton.constants";
import { useSheetSkeleton } from "./SheetSkeleton.hook";
import type { SheetSkeletonProps } from "./SheetSkeleton.types";
import {
  SheetHeaderSkeleton,
  SheetOverviewSkeleton,
  SheetSummarySkeleton,
  SheetTabsSkeleton,
} from "./subcomponents";

/**
 * Full-page placeholder of the sheet, with the same layout as `SheetPage` on its first tab.
 */
export function SheetSkeleton({ gm = false }: SheetSkeletonProps) {
  const { art } = useSheetSkeleton();
  return (
    <main className="min-h-screen bg-void-900 px-4 pb-24" aria-busy="true">
      <h1 className="sr-only">{SHEET_SKELETON_TITLE}</h1>
      <SkeletonRegion label={SHEET_SKELETON_LABEL}>
        <div className="mx-auto max-w-[1440px] pt-4">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-muted-strong">
            <Link
              href="/mesa"
              className="flex min-h-9 items-center gap-1.5 transition-colors hover:text-accent-text"
            >
              <Icon name="arrow-left" size={16} /> Voltar para a mesa
            </Link>
            <Skeleton className="h-3 w-32" />
          </div>
          <SheetHeaderSkeleton gm={gm} art={art} />
        </div>
        <div className="mx-auto max-w-[1440px]">
          <SheetSummarySkeleton />
          <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <SheetTabsSkeleton />
              <SheetOverviewSkeleton />
            </div>
            <div className="hidden xl:sticky xl:top-28 xl:block xl:h-[calc(100vh-8rem)]">
              <RollFeed rolls={[]} loading nested className="h-full" />
            </div>
          </div>
        </div>
      </SkeletonRegion>
    </main>
  );
}
