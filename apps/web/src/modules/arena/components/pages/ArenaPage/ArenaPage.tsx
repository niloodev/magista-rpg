"use client";

import {
  ARENA_LOAD_ERROR_TITLE,
  ARENA_LOAD_RETRY_LABEL,
  ARENA_MAP_ERROR,
  ARENA_NO_MAP_LABEL,
} from "@/modules/arena/arena.constants";
import { ProfileDialog } from "@/modules/profile/components";
import { Button, Icon } from "@/shared/components/atoms";

import { ArenaNotice, ArenaTokenTray, ArenaZoomControls } from "../../molecules";
import { ArenaSkeleton, ArenaStage, ArenaTopBar } from "../../organisms";
import { useArenaPage } from "./ArenaPage.hook";

export function ArenaPage() {
  const {
    status,
    loadError,
    scene,
    stageScene,
    stageLabel,
    renderTokens,
    trayTokens,
    trayLabel,
    selectedTokenId,
    connection,
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
    onPickToken,
    onStageKeyDown,
    onZoomIn,
    onZoomOut,
    onFit,
  } = useArenaPage();
  if (status === "idle" || status === "loading") return <ArenaSkeleton />;
  return (
    <main className="relative isolate h-dvh overflow-hidden bg-void-900">
      {scene && (
        <ArenaStage
          className="absolute inset-0"
          scene={stageScene}
          tokens={renderTokens}
          selectedTokenId={selectedTokenId}
          controlsRef={controlsRef}
          label={stageLabel}
          onSelect={onSelect}
          onDragMove={onDragMove}
          onDrop={onDrop}
          onBounds={onBounds}
          onMapError={onMapError}
          onKeyDown={onStageKeyDown}
        />
      )}
      <div aria-hidden="true" className="arena-vignette pointer-events-none absolute inset-0" />
      <ArenaTopBar
        sceneName={scene?.name ?? null}
        status={connection}
        memberCount={memberCount}
        onOpenProfile={onOpenProfile}
      />
      {status === "error" && (
        <ArenaNotice
          icon="circle-x"
          title={ARENA_LOAD_ERROR_TITLE}
          body={loadError ?? ""}
          className="absolute inset-0 pt-14"
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
          className="absolute inset-0 pt-14"
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
          className="absolute top-[4.25rem] left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 border border-destructive/50 bg-black/80 px-4 py-2 font-sans text-sm text-error"
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
          className="absolute bottom-4 left-4 z-10"
          label={trayLabel}
          tokens={trayTokens}
          selectedId={selectedTokenId}
          onPick={onPickToken}
        />
      )}
      {scene && (
        <ArenaZoomControls
          className="absolute right-4 bottom-4 z-10"
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFit={onFit}
        />
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ProfileDialog open={profileOpen} onClose={onCloseProfile} />
    </main>
  );
}
