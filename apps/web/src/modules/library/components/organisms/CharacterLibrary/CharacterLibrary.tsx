"use client";

import { memo } from "react";

import { LibraryRowsSkeleton } from "@/modules/library/components/molecules";
import { LIBRARY_SIDEBAR_FRAME, LIBRARY_TITLES } from "@/modules/library/library.constants";
import { folderSummary } from "@/modules/library/library.utils";
import { Skeleton, Text } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { LibraryDialogs } from "../LibraryDialogs";
import {
  CHARACTER_TREE_LABELS,
  EMPTY_PLAYER_TEXT,
  EMPTY_SEARCH_TEXT,
} from "./CharacterLibrary.constants";
import { useCharacterLibrary } from "./CharacterLibrary.hook";
import type { CharacterLibraryProps } from "./CharacterLibrary.types";
import { FolderTree } from "../FolderTree";
import { CharacterRowList, LibraryEmptyTree, LibraryToolbar } from "./subcomponents";

export const CharacterLibrary = memo(function CharacterLibrary({
  className,
  variant = "page",
  onOpenCharacter,
  onPlaceCharacter,
  onDropCharacter,
  dropPreview,
}: CharacterLibraryProps) {
  const {
    isGm,
    status,
    loading,
    shapeHint,
    totalSample,
    error,
    query,
    setQuery,
    searchRef,
    searching,
    gridItems,
    data,
    expandedFolderIds,
    toggleFolder,
    expandFolders,
    resultLabel,
    totalLabel,
    dialog,
    openDialog,
    closeDialog,
    newFolder,
    newCharacter,
    manageAccounts,
    reload,
    notice,
    noticeClassName,
    setNotice,
    onTreeMove,
    folderMenuOf,
    portraitUrlOf,
    renderLeaf,
  } = useCharacterLibrary({ onPlaceCharacter, onOpenCharacter });
  const sidebar = variant === "sidebar";
  return (
    <Panel
      variant="inner"
      className={`@container ${sidebar ? LIBRARY_SIDEBAR_FRAME : "p-5 md:p-6"} ${className ?? ""}`}
    >
      {!sidebar && (
        <SectionHeader
          title={isGm ? LIBRARY_TITLES.gm : LIBRARY_TITLES.player}
          icon="scroll-text"
          aside={
            totalLabel === null ? (
              <span className="font-sans text-xs">
                <Skeleton shape="glyphs">{totalSample}</Skeleton>
              </span>
            ) : (
              <span className="font-sans text-xs text-muted-strong">{totalLabel}</span>
            )
          }
        />
      )}
      <div className="flex flex-col gap-6">
        <LibraryToolbar
          isGm={isGm}
          query={query}
          onQueryChange={setQuery}
          searchRef={searchRef}
          resultLabel={resultLabel}
          onNewFolder={newFolder}
          onNewCharacter={newCharacter}
          onAccounts={manageAccounts}
        />
        <p role="status" className={noticeClassName}>
          {notice}
        </p>
        {error && (
          <Text variant="body" role="alert" className="text-error">
            {error}
          </Text>
        )}
        {loading && <LibraryRowsSkeleton shape={shapeHint} tree={isGm} />}
        {status === "ready" && isGm && !searching && (
          <FolderTree
            folders={data.folders}
            leaves={data.characters}
            leafKind="character"
            expandedFolderIds={expandedFolderIds}
            onToggleFolder={toggleFolder}
            onExpandFolders={expandFolders}
            onMove={onTreeMove}
            folderSummary={folderSummary}
            folderMenu={folderMenuOf}
            leafPortrait={portraitUrlOf}
            labels={CHARACTER_TREE_LABELS}
            freeAxis={Boolean(onDropCharacter)}
            onDropOutside={onDropCharacter}
            outsidePreview={dropPreview}
            empty={<LibraryEmptyTree onNewFolder={newFolder} onNewCharacter={newCharacter} />}
            renderLeaf={renderLeaf}
          />
        )}
        {status === "ready" && (!isGm || searching) && (
          <CharacterRowList
            label={searching ? "Resultados da busca" : "Suas fichas"}
            items={gridItems}
            emptyText={searching ? EMPTY_SEARCH_TEXT : EMPTY_PLAYER_TEXT}
            onOpen={onOpenCharacter}
          />
        )}
      </div>
      {isGm && (
        <LibraryDialogs
          dialog={dialog}
          onOpen={openDialog}
          onClose={closeDialog}
          onChanged={reload}
          onNotice={setNotice}
          onExpandFolders={expandFolders}
        />
      )}
    </Panel>
  );
});
