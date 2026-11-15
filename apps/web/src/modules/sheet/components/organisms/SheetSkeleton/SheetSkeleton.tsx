"use client";

import Link from "next/link";

import { SHEET_MAIN_CLASSES } from "@/modules/sheet/sheet.constants";
import { POPOUT_BUTTON_TEXT } from "@/modules/shell/components";
import { RollFeed } from "@/modules/table/components/organisms";
import { Icon, Skeleton } from "@/shared/components/atoms";
import { ButtonSkeleton, SkeletonRegion } from "@/shared/components/molecules";

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
export function SheetSkeleton({ gm = false, variant = "page", art: knownArt }: SheetSkeletonProps) {
  const { art } = useSheetSkeleton(knownArt);
  const panel = variant === "panel";
  const Root = panel ? "div" : "main";
  return (
    <Root className={SHEET_MAIN_CLASSES[variant]} aria-busy="true">
      {!panel && <h1 className="sr-only">{SHEET_SKELETON_TITLE}</h1>}
      <SkeletonRegion label={SHEET_SKELETON_LABEL} className="@container">
        <div className="mx-auto max-w-[1440px] pt-4">
          <div className="mb-4 flex min-h-9 flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-muted-strong">
            {variant === "page" && (
              <Link
                href="/mesa"
                className="flex min-h-9 items-center gap-1.5 transition-colors hover:text-accent-text"
              >
                <Icon name="arrow-left" size={16} /> Voltar para a mesa
              </Link>
            )}
            <Skeleton className="h-3 w-32" />
            {variant === "page" && (
              <span className="ml-auto">
                <ButtonSkeleton
                  label={POPOUT_BUTTON_TEXT}
                  size="sm"
                  variant="ghost"
                  icon="picture-in-picture-2"
                />
              </span>
            )}
          </div>
          <SheetHeaderSkeleton gm={gm} art={art} />
        </div>
        <div className="mx-auto max-w-[1440px]">
          <SheetSummarySkeleton />
          <div className="mt-4 grid gap-6 @min-[77rem]:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <SheetTabsSkeleton panel={panel} />
              <SheetOverviewSkeleton />
            </div>
            {!panel && (
              <div className="hidden @min-[77rem]:sticky @min-[77rem]:top-28 @min-[77rem]:block @min-[77rem]:h-[calc(100vh-8rem)]">
                <RollFeed rolls={[]} loading nested className="h-full" />
              </div>
            )}
          </div>
        </div>
      </SkeletonRegion>
    </Root>
  );
}
