"use client";

import { LibraryRowsSkeleton } from "@/modules/library/components/molecules";
import { LIBRARY_TITLES } from "@/modules/library/library.constants";
import { Skeleton, Text } from "@/shared/components/atoms";
import { Panel, SectionHeader } from "@/shared/components/molecules";

import { LibraryDialogs } from "../LibraryDialogs";
import { EMPTY_PLAYER_TEXT, EMPTY_SEARCH_TEXT } from "./CharacterLibrary.constants";
import { useCharacterLibrary } from "./CharacterLibrary.hook";
import type { CharacterLibraryProps } from "./CharacterLibrary.types";
import { CharacterRowList, LibraryToolbar, LibraryTree } from "./subcomponents";

export function CharacterLibrary({ className }: CharacterLibraryProps) {
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
    accountLogins,
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
    moveItem,
  } = useCharacterLibrary();
  return (
    <Panel variant="inner" className={`@container p-5 md:p-6 ${className ?? ""}`}>
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
          <LibraryTree
            data={data}
            expandedFolderIds={expandedFolderIds}
            accountLogins={accountLogins}
            onToggleFolder={toggleFolder}
            onExpandFolders={expandFolders}
            onMove={moveItem}
            onDialog={openDialog}
          />
        )}
        {status === "ready" && (!isGm || searching) && (
          <CharacterRowList
            label={searching ? "Resultados da busca" : "Suas fichas"}
            items={gridItems}
            emptyText={searching ? EMPTY_SEARCH_TEXT : EMPTY_PLAYER_TEXT}
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
}
