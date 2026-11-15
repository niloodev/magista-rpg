"use client";

import {
  ARENA_LOAD_ERROR_TITLE,
  ARENA_LOAD_RETRY_LABEL,
  ARENA_MAP_ERROR,
  ARENA_NO_MAP_LABEL,
  ARENA_SELECTION_TEXTS,
} from "@/modules/arena/arena.constants";
import { ProfileDialog } from "@/modules/profile/components";
import { Button, Icon } from "@/shared/components/atoms";
import { ConfirmDialog } from "@/shared/components/molecules";

import { ArenaNotice, ArenaSelectionBar, ArenaTokenTray, ArenaZoomControls } from "../../molecules";
import {
  ArenaCharactersTab,
  ArenaDockedSheet,
  ArenaMobileNotice,
  ArenaSheetWindows,
  ArenaRollsPanel,
  ArenaSidebar,
  ArenaSkeleton,
  ArenaStage,
  ArenaTopBar,
  NpcTokenDialog,
  SceneLibrary,
} from "../../organisms";
import { useArenaPage } from "./ArenaPage.hook";

export function ArenaPage() {
  const {
    isGm,
    status,
    loadError,
    scene,
    stageScene,
    stageLabel,
    renderTokens,
    trayTokens,
    trayLabel,
    selectedTokenId,
    selectedTokenIds,
    desktop,
    connection,
    latencyMs,
    memberCount,
    controlsRef,
    announcement,
    empty,
    notice,
    mapFailed,
    onMapError,
    onRetryMap,
    profileOpen,
    onOpenProfile,
    onCloseProfile,
    onRetry,
    onSelect,
    onDragMove,
    onDrop,
    onBounds,
    onResize,
    selection,
    onSizeChange,
    onToggleHidden,
    onOpenSheet,
    onRequestRemove,
    confirmRemove,
    confirmRemoveTitle,
    onConfirmRemove,
    onCancelRemove,
    onPickToken,
    onStageKeyDown,
    onZoomIn,
    onZoomOut,
    onFit,
    stageInsetRight,
    stageInsetLeft,
    hudStyle,
    sidebarWidth,
    rollsWidth,
    onSidebarResize,
    onSidebarResizeCommit,
    onRollsResize,
    onRollsResizeCommit,
    rollsOpen,
    onRollsOpen,
    broadcast,
    onGoLiveViewed,
    onBackToLive,
    sidebarOpen,
    sidebarTab,
    onSidebarTab,
    onSidebarOpen,
    onOpenCharacter,
    dockedLeft,
    dockedRight,
    windowPanels,
    onDock,
    onUndock,
    onCloseDocked,
    sheetNameFor,
    canPlace,
    isOverMap,
    tokenPreviewSize,
    onPlaceCharacter,
    onDropCharacter,
    npcDialogOpen,
    onNewNpc,
    onCloseNpc,
    selectionSlotClassName,
    onSubmitNpc,
    liveSceneId,
    viewingSceneId,
    onPreviewScene,
    onGoLive,
    rolls,
    pendingRolls,
    rollsLoading,
  } = useArenaPage();
  if (!desktop) return <ArenaMobileNotice />;
  const renderDocked = (characterId: string) => (
    <ArenaDockedSheet
      characterId={characterId}
      name={sheetNameFor(characterId)}
      onUndock={() => onUndock(characterId)}
      onClose={() => onCloseDocked(characterId)}
    />
  );
  if (status === "idle" || status === "loading") return <ArenaSkeleton gm={isGm} />;
  return (
    <main className="relative isolate h-dvh overflow-hidden bg-void-900">
      <ArenaTopBar
        sceneName={scene?.name ?? null}
        status={connection}
        latencyMs={latencyMs}
        memberCount={memberCount}
        broadcast={broadcast}
        onGoLive={onGoLiveViewed}
        onBackToLive={onBackToLive}
        onOpenProfile={onOpenProfile}
      />
      <ArenaRollsPanel
        open={rollsOpen}
        rolls={rolls}
        pending={pendingRolls}
        loading={rollsLoading}
        onOpenChange={onRollsOpen}
        width={rollsWidth}
        onResize={onRollsResize}
        onResizeCommit={onRollsResizeCommit}
        docked={{ ...dockedLeft, render: renderDocked }}
      />
      {scene && (
        <ArenaStage
          className="absolute inset-0"
          scene={stageScene}
          tokens={renderTokens}
          selectedTokenIds={selectedTokenIds}
          controlsRef={controlsRef}
          label={stageLabel}
          onSelect={onSelect}
          onDragMove={onDragMove}
          onDrop={onDrop}
          onBounds={onBounds}
          onResize={onResize}
          resizable={isGm}
          insetRight={stageInsetRight}
          insetLeft={stageInsetLeft}
          onMapError={onMapError}
          onKeyDown={onStageKeyDown}
        />
      )}
      <div aria-hidden="true" className="arena-vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-y-0" style={hudStyle}>
        {status === "error" && (
          <ArenaNotice
            icon="circle-x"
            title={ARENA_LOAD_ERROR_TITLE}
            body={loadError ?? ""}
            className="pointer-events-auto absolute inset-0 pt-14"
            action={
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {ARENA_LOAD_RETRY_LABEL}
              </Button>
            }
          />
        )}
        {status === "ready" && !scene && (
          <ArenaNotice
            icon="map"
            title={empty.title}
            body={empty.body}
            className="pointer-events-auto absolute inset-0 pt-14"
          />
        )}
        {scene && !scene.mapUrl && (
          <p className="absolute top-[4.25rem] left-4 z-10 flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-1.5 font-sans text-xs tracking-[0.12em] text-muted-strong uppercase">
            <Icon name="image" size={14} aria-hidden="true" />
            {ARENA_NO_MAP_LABEL}
          </p>
        )}
        {(notice || mapFailed) && (
          <div
            role="alert"
            className="pointer-events-auto absolute top-[4.25rem] left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 border border-destructive/50 bg-black/80 px-4 py-2 font-sans text-sm text-error"
          >
            <span>{notice ?? ARENA_MAP_ERROR}</span>
            {!notice && mapFailed && (
              <Button variant="ghost" size="sm" onClick={onRetryMap}>
                {ARENA_LOAD_RETRY_LABEL}
              </Button>
            )}
          </div>
        )}
        {scene && trayTokens.length > 0 && (
          <ArenaTokenTray
            className="pointer-events-auto absolute bottom-4 left-4 z-10"
            label={trayLabel}
            tokens={trayTokens}
            selectedId={selectedTokenId}
            onPick={onPickToken}
          />
        )}
        {scene && selection && (
          <div className={selectionSlotClassName}>
            <ArenaSelectionBar
              className="pointer-events-auto"
              label={selection.label}
              isGm={isGm}
              size={selection.size}
              allHidden={selection.allHidden}
              canOpenSheet={selection.canOpenSheet}
              onSizeChange={onSizeChange}
              onToggleHidden={onToggleHidden}
              onOpenSheet={onOpenSheet}
              onRemove={onRequestRemove}
            />
          </div>
        )}
        {scene && (
          <ArenaZoomControls
            className="pointer-events-auto absolute right-4 bottom-4 z-10"
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFit={onFit}
          />
        )}
      </div>
      <ArenaSidebar
        open={sidebarOpen}
        tab={sidebarTab}
        showScenes={isGm}
        onTabChange={onSidebarTab}
        onOpenChange={onSidebarOpen}
        width={sidebarWidth}
        onResize={onSidebarResize}
        onResizeCommit={onSidebarResizeCommit}
        docked={{ ...dockedRight, render: renderDocked }}
        characters={
          <ArenaCharactersTab
            isGm={isGm}
            canPlace={canPlace}
            onOpenCharacter={onOpenCharacter}
            onPlaceCharacter={onPlaceCharacter}
            onDropCharacter={onDropCharacter}
            onNewNpc={onNewNpc}
            isOverMap={isOverMap}
            tokenPreviewSize={tokenPreviewSize}
          />
        }
        scenes={
          <SceneLibrary
            liveSceneId={liveSceneId}
            viewingSceneId={viewingSceneId}
            onPreview={onPreviewScene}
            onGoLive={onGoLive}
          />
        }
      />
      <ConfirmDialog
        open={confirmRemove}
        title={confirmRemoveTitle}
        message={ARENA_SELECTION_TEXTS.confirmMessage}
        confirmLabel={ARENA_SELECTION_TEXTS.remove}
        onConfirm={onConfirmRemove}
        onCancel={onCancelRemove}
      />
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ArenaSheetWindows panels={windowPanels} onDock={onDock} />
      <ProfileDialog open={profileOpen} onClose={onCloseProfile} />
      {isGm && npcDialogOpen && <NpcTokenDialog onSubmit={onSubmitNpc} onClose={onCloseNpc} />}
    </main>
  );
}
