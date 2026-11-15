"use client";

import { SCENE_TEXTS, SCENE_TREE_LABELS } from "@/modules/arena/arena.constants";
import { FolderTree } from "@/modules/library/components";
import { Button, Icon } from "@/shared/components/atoms";
import { ActionMenu, ConfirmDialog } from "@/shared/components/molecules";

import { SceneLibrarySkeleton, SceneRow } from "../../molecules";
import { SceneBoardDialog } from "../SceneBoardDialog";
import { SceneFormDialog } from "../SceneFormDialog";
import { useSceneLibrary } from "./SceneLibrary.hook";
import type { SceneLibraryProps } from "./SceneLibrary.types";

export function SceneLibrary(props: SceneLibraryProps) {
  const { liveSceneId, viewingSceneId, onPreview } = props;
  const {
    status,
    error,
    scenes,
    folders,
    expandedFolderIds,
    toggleFolder,
    expandFolders,
    onMove,
    folderSummary,
    folderMenu,
    menuOf,
    portraitOf,
    dialog,
    closeDialog,
    newScene,
    newFolder,
    notice,
    dismissNotice,
    submitScene,
    submitFolder,
    submitRename,
    submitMap,
    submitBoard,
    confirmDelete,
    retry,
  } = useSceneLibrary(props);
  return (
    <div className="@container flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={newScene}
          icon={<Icon name="map" size={14} />}
          className="flex-1"
        >
          {SCENE_TEXTS.newScene}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={newFolder}
          icon={<Icon name="folder-plus" size={14} />}
          className="flex-1"
        >
          {SCENE_TEXTS.newFolder}
        </Button>
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-start justify-between gap-3 border-l-2 border-primary bg-black/40 px-3 py-2 font-sans text-sm text-accent-text"
        >
          {notice}
          <button
            type="button"
            onClick={dismissNotice}
            aria-label="Fechar aviso"
            className="shrink-0 cursor-pointer text-muted-strong hover:text-foreground"
          >
            <Icon name="x" size={14} aria-hidden="true" />
          </button>
        </p>
      )}
      {(status === "idle" || status === "loading") && <SceneLibrarySkeleton announce={false} />}
      {status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 border border-destructive/40 border-l-2 border-l-destructive bg-black/40 px-4 py-3 font-sans text-sm text-error"
        >
          <span className="flex items-center gap-2">
            <Icon name="circle-x" size={16} aria-hidden="true" />
            {error}
          </span>
          <Button variant="secondary" size="sm" onClick={retry}>
            Tentar de novo
          </Button>
        </div>
      )}
      {status === "ready" && (
        <FolderTree
          folders={folders}
          leaves={scenes}
          leafKind="scene"
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={toggleFolder}
          onExpandFolders={expandFolders}
          onMove={onMove}
          folderSummary={folderSummary}
          folderMenu={folderMenu}
          leafPortrait={portraitOf}
          leafIcon="map"
          labels={SCENE_TREE_LABELS}
          empty={
            <p className="border border-dashed border-white/15 px-4 py-10 text-center font-sans text-[15px] text-muted-strong">
              {SCENE_TEXTS.emptyLibrary}
            </p>
          }
          renderLeaf={(scene, slots) => (
            <SceneRow
              name={scene.name}
              mapUrl={portraitOf(scene)}
              live={scene.id === liveSceneId}
              viewing={scene.id === viewingSceneId}
              onOpen={() => onPreview(scene.id)}
              handle={slots.handle}
              dropPosition={slots.dropPosition}
              dimmed={slots.dimmed}
              actions={
                <ActionMenu label={SCENE_TEXTS.sceneActions(scene.name)} items={menuOf(scene)} />
              }
            />
          )}
        />
      )}
      {dialog?.type === "createScene" && (
        <SceneFormDialog
          title={SCENE_TEXTS.newScene}
          submitLabel={SCENE_TEXTS.create}
          nameLabel={SCENE_TEXTS.sceneName}
          withMap
          onSubmit={submitScene}
          onClose={closeDialog}
        />
      )}
      {(dialog?.type === "createFolder" || dialog?.type === "renameFolder") && (
        <SceneFormDialog
          title={dialog.type === "createFolder" ? SCENE_TEXTS.newFolder : SCENE_TEXTS.rename}
          submitLabel={dialog.type === "createFolder" ? SCENE_TEXTS.create : SCENE_TEXTS.save}
          nameLabel={SCENE_TEXTS.folderName}
          initialName={dialog.type === "renameFolder" ? dialog.folder.name : ""}
          withMap={false}
          onSubmit={submitFolder}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === "renameScene" && (
        <SceneFormDialog
          title={SCENE_TEXTS.rename}
          submitLabel={SCENE_TEXTS.save}
          nameLabel={SCENE_TEXTS.sceneName}
          initialName={dialog.scene.name}
          withMap={false}
          onSubmit={submitRename}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === "changeMap" && (
        <SceneFormDialog
          title={SCENE_TEXTS.changeMap}
          submitLabel={SCENE_TEXTS.save}
          nameLabel={null}
          withMap
          mapRequired
          currentMapUrl={portraitOf(dialog.scene)}
          onSubmit={submitMap}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === "board" && (
        <SceneBoardDialog scene={dialog.scene} onSubmit={submitBoard} onClose={closeDialog} />
      )}
      <ConfirmDialog
        open={dialog?.type === "deleteScene" || dialog?.type === "deleteFolder"}
        title={
          dialog?.type === "deleteScene"
            ? SCENE_TEXTS.deleteSceneTitle(dialog.scene.name)
            : dialog?.type === "deleteFolder"
              ? SCENE_TEXTS.deleteFolderTitle(dialog.folder.name)
              : ""
        }
        message={
          dialog?.type === "deleteFolder"
            ? SCENE_TEXTS.deleteFolderMessage
            : SCENE_TEXTS.deleteSceneMessage
        }
        confirmLabel={SCENE_TEXTS.remove}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}
