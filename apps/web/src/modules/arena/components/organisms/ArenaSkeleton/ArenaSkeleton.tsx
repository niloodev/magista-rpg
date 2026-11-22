"use client";

import {
  ARENA_PANEL_TOGGLE_POSITION,
  ARENA_PLACEMENT_TEXTS,
  ARENA_BACK_LABEL,
  ARENA_ROLLS_TEXTS,
  ARENA_SIDEBAR_TEXTS,
  ARENA_SKELETON_LABEL,
  ARENA_TITLE,
  ARENA_TURN_TEXTS,
  SCENE_TEXTS,
} from "@/modules/arena/arena.constants";
import { CharacterLibrarySkeleton } from "@/modules/library/components/organisms";
import { RollFeed } from "@/modules/table/components/organisms";
import { Icon, Skeleton, skeletonSample, Text } from "@/shared/components/atoms";
import { ButtonSkeleton, SkeletonRegion, Tabs } from "@/shared/components/molecules";

import {
  ARENA_TRAY_BUTTON_CLASSES,
  ARENA_TRAY_CLASSES,
  ARENA_TRAY_LIST_CLASSES,
  ArenaConnectionStatus,
  ArenaMapPlaceholder,
  ArenaPanelToggle,
  ArenaZoomControls,
  SceneLibrarySkeleton,
  WorldMapRow,
} from "../../molecules";
import { ArenaMobileNotice } from "../ArenaMobileNotice";
import { ARENA_ROLLS_PANEL_CLASSES, ARENA_ROLLS_TAB_KEY } from "../ArenaRollsPanel";
import { ARENA_SIDEBAR_CLASSES, ARENA_SIDEBAR_TABS } from "../ArenaSidebar";
import { ARENA_BACK_LINK_CLASSES, ARENA_TOP_BAR_CLASSES } from "../ArenaTopBar";
import {
  ARENA_SKELETON_ROLLS_PREFIX,
  ARENA_SKELETON_ROLLS_TABS,
  ARENA_SKELETON_TABS_PREFIX,
  HUD_GAP,
} from "./ArenaSkeleton.constants";
import { useArenaSkeleton } from "./ArenaSkeleton.hook";
import type { ArenaSkeletonProps } from "./ArenaSkeleton.types";
import { ignoreAction, ignoreTab } from "./ArenaSkeleton.utils";

/**
 * Placeholder of `ArenaPage` while the session or the Arena loads: the same top bar (fixed labels real, scene
 * name and head count shaped by the last visit), the map area, the token tray and the zoom controls, nothing
 * focusable. Below 1024px the CSS shows the "Jogue no PC" notice instead, already in the server HTML.
 */
export function ArenaSkeleton({ gm = false }: ArenaSkeletonProps) {
  const { trayRows, noScene, nameLength, people, sidebarWidth, rollsWidth, tab, known } =
    useArenaSkeleton();
  const tabs = gm ? ARENA_SIDEBAR_TABS : ARENA_SIDEBAR_TABS.filter((item) => item.key !== "scenes");
  const activeTab = gm ? tab : "characters";
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
          {!noScene && (
            <ArenaMapPlaceholder
              className="absolute inset-0"
              insetLeft={rollsWidth}
              insetRight={sidebarWidth}
            />
          )}
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
            {!noScene && (
              <ButtonSkeleton
                label={ARENA_TURN_TEXTS.button}
                size="sm"
                icon="list-ordered"
                iconSize={12}
                labelClassName="max-sm:sr-only"
              />
            )}
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
            <div
              aria-hidden="true"
              className={`absolute bottom-4 ${ARENA_TRAY_CLASSES}`}
              style={{ left: rollsWidth + HUD_GAP }}
            >
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
            <div inert className="absolute bottom-4" style={{ right: sidebarWidth + HUD_GAP }}>
              <ArenaZoomControls />
            </div>
          )}
          {rollsWidth > 0 && (
            <div
              aria-hidden="true"
              className={ARENA_ROLLS_PANEL_CLASSES}
              style={{ width: rollsWidth }}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <div inert>
                  <Tabs
                    items={ARENA_SKELETON_ROLLS_TABS}
                    active={ARENA_ROLLS_TAB_KEY}
                    onChange={ignoreTab}
                    label={ARENA_ROLLS_TEXTS.tabs}
                    idPrefix={ARENA_SKELETON_ROLLS_PREFIX}
                    dense
                  />
                </div>
                <RollFeed
                  rolls={[]}
                  loading
                  nested
                  headless
                  className="h-full min-w-0 flex-1 border-0 bg-transparent"
                />
              </div>
            </div>
          )}
          <div inert>
            <ArenaPanelToggle
              side="left"
              open={rollsWidth > 0}
              label={ARENA_ROLLS_TEXTS.close}
              onToggle={ignoreTab}
              className={ARENA_PANEL_TOGGLE_POSITION}
              style={{ left: rollsWidth }}
            />
            <ArenaPanelToggle
              side="right"
              open={sidebarWidth > 0}
              label={ARENA_SIDEBAR_TEXTS.close}
              onToggle={ignoreTab}
              className={ARENA_PANEL_TOGGLE_POSITION}
              style={{ right: sidebarWidth }}
            />
          </div>
          {sidebarWidth > 0 && (
            <div
              aria-hidden="true"
              className={ARENA_SIDEBAR_CLASSES}
              style={{ width: sidebarWidth }}
            >
              <div inert className="flex items-stretch">
                <div className="min-w-0 flex-1">
                  <Tabs
                    items={tabs}
                    active={activeTab}
                    onChange={ignoreTab}
                    label={ARENA_SIDEBAR_TEXTS.tabs}
                    idPrefix={ARENA_SKELETON_TABS_PREFIX}
                    dense
                  />
                </div>
              </div>
              <div inert className="min-h-0 flex-1 overflow-hidden p-4">
                {activeTab === "scenes" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <ButtonSkeleton
                        label={SCENE_TEXTS.newScene}
                        variant="primary"
                        size="sm"
                        icon="map"
                        className="flex-1"
                      />
                      <ButtonSkeleton
                        label={SCENE_TEXTS.newFolder}
                        size="sm"
                        icon="folder-plus"
                        className="flex-1"
                      />
                    </div>
                    <WorldMapRow
                      inert
                      live={false}
                      viewing={false}
                      canReturn={false}
                      onPreview={ignoreAction}
                      onGoLive={ignoreAction}
                      onReturn={ignoreAction}
                    />
                    <SceneLibrarySkeleton announce={false} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {gm && (
                      <div className="flex flex-col gap-2">
                        <ButtonSkeleton
                          label={ARENA_PLACEMENT_TEXTS.npcButton}
                          size="sm"
                          icon="user-plus"
                          disabled={noScene}
                          className="w-full"
                        />
                        <p className="font-sans text-xs text-muted-strong">
                          {noScene ? ARENA_PLACEMENT_TEXTS.noScene : ARENA_PLACEMENT_TEXTS.dragHint}
                        </p>
                      </div>
                    )}
                    {known && !gm && !noScene && (
                      <p className="font-sans text-xs text-muted-strong">
                        {ARENA_PLACEMENT_TEXTS.playerDragHint}
                      </p>
                    )}
                    <CharacterLibrarySkeleton
                      known={known}
                      gm={gm}
                      variant="sidebar"
                      rowActions={known && !gm && !noScene}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </SkeletonRegion>
      </main>
    </>
  );
}
