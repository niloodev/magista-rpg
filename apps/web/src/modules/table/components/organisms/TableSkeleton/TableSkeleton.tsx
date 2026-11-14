"use client";

import { CharacterLibrarySkeleton } from "@/modules/library/components";
import { TABLE_TITLES } from "@/modules/table/table.constants";
import { Skeleton, skeletonSample, Text } from "@/shared/components/atoms";
import { ButtonSkeleton, SkeletonRegion } from "@/shared/components/molecules";

import { PresencePanel } from "../PresencePanel";
import { RollFeed } from "../RollFeed";
import { TABLE_SKELETON_LABEL } from "./TableSkeleton.constants";
import { useTableSkeleton } from "./TableSkeleton.hook";
import type { TableSkeletonProps } from "./TableSkeleton.types";

/**
 * Full-page placeholder of `TablePage` (header, library, presence and roll feed), shaped by the last
 * session seen on this device: role titles, login length and how many people were online.
 */
export function TableSkeleton({ known = false, gm = false, loginLength = 10 }: TableSkeletonProps) {
  const { presenceRows } = useTableSkeleton();
  return (
    <main className="min-h-screen bg-void-900 px-4 py-10" aria-busy="true">
      <h1 className="sr-only">{known && gm ? TABLE_TITLES.gm : TABLE_TITLES.player}</h1>
      <SkeletonRegion label={TABLE_SKELETON_LABEL}>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <Text variant="micro">
                {known ? (
                  gm ? (
                    TABLE_TITLES.gm
                  ) : (
                    TABLE_TITLES.player
                  )
                ) : (
                  <Skeleton shape="glyphs" tone="ruby">
                    {TABLE_TITLES.player}
                  </Skeleton>
                )}
              </Text>
              <p className="font-serif text-2xl">
                <Skeleton shape="glyphs">{skeletonSample(loginLength)}</Skeleton>
              </p>
            </div>
            <ButtonSkeleton label="Sair" size="sm" icon="log-out" iconSize={12} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-6">
              <CharacterLibrarySkeleton known={known} gm={gm} />
              <PresencePanel
                status="connecting"
                members={[]}
                loadingRows={presenceRows}
                titleAs="p"
                nested
              />
            </div>
            <RollFeed rolls={[]} loading nested className="max-h-[75vh]" />
          </div>
        </div>
      </SkeletonRegion>
    </main>
  );
}
