"use client";

import {
  ARENA_BACK_LABEL,
  ARENA_SKELETON_LABEL,
  ARENA_TITLE,
} from "@/modules/arena/arena.constants";
import { Icon, Skeleton, skeletonSample, Text } from "@/shared/components/atoms";
import { ButtonSkeleton, SkeletonRegion } from "@/shared/components/molecules";

import {
  ARENA_TRAY_BUTTON_CLASSES,
  ARENA_TRAY_CLASSES,
  ARENA_TRAY_LIST_CLASSES,
  ArenaConnectionStatus,
  ArenaMapPlaceholder,
  ArenaZoomControls,
} from "../../molecules";
import { ArenaMobileNotice } from "../ArenaMobileNotice";
import { ARENA_BACK_LINK_CLASSES, ARENA_TOP_BAR_CLASSES } from "../ArenaTopBar";
import { useArenaSkeleton } from "./ArenaSkeleton.hook";

/**
 * Placeholder of `ArenaPage` while the session or the Arena loads: the same top bar (fixed labels real, scene
 * name and head count shaped by the last visit), the map area, the token tray and the zoom controls, nothing
 * focusable. Below 1024px the CSS shows the "Jogue no PC" notice instead, already in the server HTML.
 */
export function ArenaSkeleton() {
  const { trayRows, noScene, nameLength, people } = useArenaSkeleton();
  return (
    <>
      <div className="lg:hidden">
        <ArenaMobileNotice />
      </div>
      <main
        className="relative isolate hidden h-dvh overflow-hidden bg-void-900 lg:block"
        aria-busy="true"
      >
        <h1 className="sr-only">{ARENA_TITLE}</h1>
        <SkeletonRegion label={ARENA_SKELETON_LABEL} className="absolute inset-0">
          {!noScene && <ArenaMapPlaceholder className="absolute inset-0" />}
          <div aria-hidden="true" className="arena-vignette pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className={ARENA_TOP_BAR_CLASSES}>
            <span className={ARENA_BACK_LINK_CLASSES}>
              <Icon name="arrow-left" size={16} />
              <span className="max-sm:sr-only">{ARENA_BACK_LABEL}</span>
            </span>
            <span className="h-6 w-px shrink-0 bg-border" />
            <div className="min-w-0 flex-1">
              {noScene ? (
                <p className="truncate font-serif text-lg leading-6 text-foreground">
                  {ARENA_TITLE}
                </p>
              ) : (
                <>
                  <Text variant="micro" className="block leading-4">
                    {ARENA_TITLE}
                  </Text>
                  <p className="truncate font-serif text-lg leading-6 text-clip">
                    <Skeleton shape="glyphs">{skeletonSample(nameLength)}</Skeleton>
                  </p>
                </>
              )}
            </div>
            <ArenaConnectionStatus status="connecting" />
            <span className="flex shrink-0 items-center gap-1.5 font-sans text-sm text-muted-strong">
              <Icon name="users" size={16} />
              <Skeleton shape="glyphs">{people}</Skeleton>
            </span>
            <ButtonSkeleton
              label="Perfil"
              size="sm"
              icon="user"
              iconSize={12}
              labelClassName="max-sm:sr-only"
            />
          </div>
          {!noScene && trayRows.length > 0 && (
            <div aria-hidden="true" className={`absolute bottom-4 left-4 ${ARENA_TRAY_CLASSES}`}>
              <ul className={ARENA_TRAY_LIST_CLASSES}>
                {trayRows.map((row) => (
                  <li key={row} className={`shrink-0 ${ARENA_TRAY_BUTTON_CLASSES}`}>
                    <Skeleton shape="circle" tone="ruby" className="h-9 w-9" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!noScene && (
            <div inert className="absolute right-4 bottom-4">
              <ArenaZoomControls />
            </div>
          )}
        </SkeletonRegion>
      </main>
    </>
  );
}
